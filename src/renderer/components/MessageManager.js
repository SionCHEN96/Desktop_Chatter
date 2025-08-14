/**
 * 消息管理组件
 * 负责消息的显示、存储和管理
 */

import { segmentText } from '../../utils/textSegmentation.js';
import { AudioQueue } from './AudioQueue.js';

export class MessageManager {
  constructor(containerElement) {
    this.container = containerElement;
    this.messages = [];
    this.maxMessages = 100; // 最大消息数量
    this.currentAIMessage = null; // 当前显示的AI消息元素
    this.aiMessageTimeout = null; // AI消息自动消失定时器
    this.aiMessageTimeoutStartTime = null; // 定时器开始时间
    this.aiMessageTimeoutDuration = 10000; // 10秒
    this.aiMessageTimeoutRemaining = 10000; // 剩余时间
    this.isHovered = false; // 是否悬停状态
    this.currentAudio = null; // 当前播放的音频对象
    this.audioQueue = []; // 音频播放队列
    this.hasUserInteracted = false; // 用户是否已经交互过
    this.pendingAudioUrl = null; // 等待播放的音频URL
    this.segmentedAudioQueue = new AudioQueue(); // 分段音频队列
    this.bubbleDisplayTimer = null; // 气泡显示计时器
    this.maxBubbleDisplayTime = 30000; // 最大气泡显示时间（30秒）
    this.voiceEnabled = true; // 语音功能开关

    this.initContainer();
    this.setupUserInteractionDetection();
    this.setupVoiceSettingListener();
  }

  /**
   * 初始化容器
   * @private
   */
  initContainer() {
    if (!this.container) {
      console.error('[MessageManager] Container element not found');
      return;
    }

    this.container.classList.add('message-container');
  }

  /**
   * Setup voice setting listener
   */
  setupVoiceSettingListener() {
    // Listen for voice setting changes from tray menu
    window.electronAPI.onVoiceSettingChanged((data) => {
      console.log('[MessageManager] Voice setting changed:', data.enabled);
      this.voiceEnabled = data.enabled;
    });
  }

  /**
   * 设置用户交互检测
   * @private
   */
  setupUserInteractionDetection() {
    const events = ['click', 'keydown', 'touchstart'];

    const handleUserInteraction = () => {
      if (!this.hasUserInteracted) {
        this.hasUserInteracted = true;

        // 通知分段音频队列用户已交互
        this.segmentedAudioQueue.setUserInteraction(true);

        // 如果有等待播放的音频，现在播放它
        if (this.pendingAudioUrl) {
          this.playAudio(this.pendingAudioUrl);
          this.pendingAudioUrl = null;
        }

        // 移除事件监听器
        events.forEach(event => {
          document.removeEventListener(event, handleUserInteraction);
        });
      }
    };

    // 添加事件监听器
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });
  }

  /**
   * 添加用户消息（不显示，仅记录）
   * @param {string} text - 消息内容
   * @param {Object} options - 选项
   */
  addUserMessage(text, options = {}) {
    const message = {
      id: this.generateMessageId(),
      type: 'user',
      text: text,
      timestamp: new Date(),
      ...options
    };

    // 仅记录到消息列表，不显示UI
    this.messages.push(message);

    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }

    return message;
  }

  /**
   * 添加AI消息（替换当前显示的AI消息）
   * @param {string} text - 消息内容
   * @param {Object} options - 选项
   */
  addAIMessage(text, options = {}) {
    const message = {
      id: this.generateMessageId(),
      type: 'ai',
      text: text,
      timestamp: new Date(),
      ...options
    };

    // 清除之前的AI消息显示和定时器
    this.clearCurrentAIMessage();

    // 记录到消息列表
    this.messages.push(message);

    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      const removedMessage = this.messages.shift();
      if (removedMessage.type !== 'ai') {
        this.removeMessageElement(removedMessage.id);
      }
    }

    console.log(`[MessageManager] Voice enabled: ${this.voiceEnabled}`);

    // 根据语音设置决定行为
    if (this.voiceEnabled) {
      // 语音开启：需要合成语音后再显示气泡
      if (options.enableSegmentedTTS && !message.audioUrl) {
        // 使用分段语音合成
        this.addAIMessageWithSegmentedTTS(message);
      } else if (message.audioUrl) {
        // 有预合成的音频，使用传统方式
        this.renderAIMessage(message);
        this.startAIMessageTimeout();
      } else {
        // 没有音频但启用语音，先合成再显示
        this.renderAIMessage(message);
        this.startAIMessageTimeout();
      }
    } else {
      // 语音关闭：直接显示AI回复气泡
      console.log('[MessageManager] Voice disabled, showing bubble immediately');
      this.renderAIMessage(message);
      this.startAIMessageTimeout();
    }

    return message;
  }

  /**
   * 添加AI消息并进行分段语音合成
   * @param {Object} message - 消息对象
   */
  async addAIMessageWithSegmentedTTS(message) {
    console.log('[MessageManager] Starting segmented TTS for message:', message.text.substring(0, 50) + '...');

    // 对文本进行分段 - 使用更短的段落以减少单次合成时间
    const textSegments = segmentText(message.text, {
      maxSegmentLength: 50,  // 减少最大长度
      minSegmentLength: 6,   // 减少最小长度
      preferredLength: 25    // 减少首选长度
    });

    console.log('[MessageManager] Text segmented into', textSegments.length, 'parts:', textSegments);

    // 开始分段语音合成
    this.segmentedAudioQueue.startSegmentedSynthesis(
      textSegments,
      (text) => this.synthesizeTextSegment(text),
      {
        onSegmentReady: (segment) => {
          console.log('[MessageManager] First segment ready, showing AI bubble');
          // 第一段准备好时显示AI气泡
          this.renderAIMessage(message);
          // 启动30秒显示计时器
          this.startBubbleDisplayTimer();
        },
        onAllComplete: () => {
          console.log('[MessageManager] All segments completed');
          // 所有段落播放完成，可以清除气泡（如果还没超时）
          this.clearBubbleIfNotTimeout();
        },
        onError: (error) => {
          console.error('[MessageManager] Segmented TTS error:', error);
          // 出错时仍然显示消息，但没有语音
          this.renderAIMessage(message);
          this.startAIMessageTimeout();

          // 显示错误提示（可选）
          this.showTTSErrorHint(error);
        }
      }
    );
  }

  /**
   * 合成文本段落的语音
   * @param {string} text - 文本段落
   * @returns {Promise<string>} 音频URL
   */
  async synthesizeTextSegment(text) {
    const startTime = Date.now();

    try {
      console.log('[MessageManager] Synthesizing text segment:', text.substring(0, 30) + '...');

      // 调用TTS服务合成语音
      const response = await window.electronAPI.synthesizeText(text);
      const duration = Date.now() - startTime;

      if (response.success) {
        console.log(`[MessageManager] Segment synthesis successful in ${duration}ms:`, response.audioUrl);
        return response.audioUrl;
      } else {
        const error = new Error(response.error || 'TTS synthesis failed');
        error.errorType = response.errorType || 'unknown';
        error.duration = duration;
        throw error;
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[MessageManager] Segment synthesis failed after ${duration}ms:`, error);

      // 添加错误上下文信息
      error.textLength = text.length;
      error.duration = error.duration || duration;

      throw error;
    }
  }

  /**
   * Show TTS error hint
   * @param {Error} error - Error object
   */
  showTTSErrorHint(error) {
    // Show different hints based on error type
    let hintMessage = '';

    if (error.message && error.message.includes('timeout')) {
      hintMessage = 'TTS synthesis timeout, server may be under heavy load';
    } else if (error.message && error.message.includes('service')) {
      hintMessage = 'TTS service temporarily unavailable';
    } else if (error.message && error.message.includes('connection')) {
      hintMessage = 'Cannot connect to TTS service';
    } else {
      hintMessage = 'TTS synthesis temporarily unavailable';
    }

    console.warn('[MessageManager] TTS Error Hint:', hintMessage);

    // Can optionally display hint in UI (currently only logged to console)
    // Uncomment below if you want to show in UI
    /*
    if (this.currentAIMessage) {
      const hintElement = document.createElement('div');
      hintElement.style.cssText = `
        color: #6c757d;
        font-size: 11px;
        margin-top: 5px;
        opacity: 0.7;
      `;
      hintElement.textContent = hintMessage;
      this.currentAIMessage.appendChild(hintElement);

      // Remove hint after 3 seconds
      setTimeout(() => {
        if (hintElement.parentNode) {
          hintElement.parentNode.removeChild(hintElement);
        }
      }, 3000);
    }
    */
  }

  /**
   * 启动气泡显示计时器（30秒）
   */
  startBubbleDisplayTimer() {
    // 清除之前的计时器
    if (this.bubbleDisplayTimer) {
      clearTimeout(this.bubbleDisplayTimer);
    }

    console.log('[MessageManager] Starting 30-second bubble display timer');
    this.bubbleDisplayTimer = setTimeout(() => {
      console.log('[MessageManager] 30-second timeout reached, clearing AI bubble');
      this.clearCurrentAIMessage();
    }, this.maxBubbleDisplayTime);
  }

  /**
   * 如果没有超时则清除气泡
   */
  clearBubbleIfNotTimeout() {
    // 只有在计时器还在运行时才清除（说明还没超时）
    if (this.bubbleDisplayTimer) {
      console.log('[MessageManager] All audio completed, clearing AI bubble');
      this.clearCurrentAIMessage();
    } else {
      console.log('[MessageManager] Bubble timer already expired, not clearing');
    }
  }

  /**
   * 添加系统消息
   * @param {string} text - 消息内容
   * @param {Object} options - 选项
   */
  addSystemMessage(text, options = {}) {
    const message = {
      id: this.generateMessageId(),
      type: 'system',
      text: text,
      timestamp: new Date(),
      ...options
    };

    this.addMessage(message);
    return message;
  }

  /**
   * 添加消息到列表
   * @private
   * @param {Object} message - 消息对象
   */
  addMessage(message) {
    this.messages.push(message);

    // 限制消息数量
    if (this.messages.length > this.maxMessages) {
      const removedMessage = this.messages.shift();
      this.removeMessageElement(removedMessage.id);
    }

    this.renderMessage(message);
    this.scrollToBottom();
  }

  /**
   * 渲染消息
   * @private
   * @param {Object} message - 消息对象
   */
  renderMessage(message) {
    const messageElement = this.createMessageElement(message);
    this.container.appendChild(messageElement);
  }

  /**
   * 创建消息元素
   * @private
   * @param {Object} message - 消息对象
   * @returns {HTMLElement} 消息元素
   */
  createMessageElement(message) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', `${message.type}-message`);
    messageElement.setAttribute('data-message-id', message.id);

    // 创建消息内容
    const contentElement = document.createElement('div');
    contentElement.classList.add('message-content');
    contentElement.textContent = message.text;

    messageElement.appendChild(contentElement);

    return messageElement;
  }

  /**
   * 移除消息元素
   * @private
   * @param {string} messageId - 消息ID
   */
  removeMessageElement(messageId) {
    const element = this.container.querySelector(`[data-message-id="${messageId}"]`);
    if (element) {
      element.remove();
    }
  }

  /**
   * 清空所有消息
   */
  clearMessages() {
    this.messages = [];
    this.container.innerHTML = '';
  }

  /**
   * 滚动到底部
   * @private
   */
  scrollToBottom() {
    this.container.scrollTop = this.container.scrollHeight;
  }

  /**
   * 清除当前显示的AI消息
   * @private
   */
  clearCurrentAIMessage() {
    // 清除传统定时器
    if (this.aiMessageTimeout) {
      clearTimeout(this.aiMessageTimeout);
      this.aiMessageTimeout = null;
    }

    // 清除气泡显示计时器
    if (this.bubbleDisplayTimer) {
      clearTimeout(this.bubbleDisplayTimer);
      this.bubbleDisplayTimer = null;
    }

    // 停止分段音频队列
    if (this.segmentedAudioQueue) {
      this.segmentedAudioQueue.stop();
    }

    // 移除当前AI消息元素
    if (this.currentAIMessage) {
      // 添加消失动画
      this.currentAIMessage.classList.add('disappearing');

      setTimeout(() => {
        if (this.currentAIMessage && this.currentAIMessage.parentNode) {
          this.currentAIMessage.parentNode.removeChild(this.currentAIMessage);
        }
        this.currentAIMessage = null;
      }, 500); // 与bubbleFadeOut动画时长一致
    }
  }

  /**
   * 渲染AI消息
   * @private
   * @param {Object} message - 消息对象
   */
  renderAIMessage(message) {
    console.log('[MessageManager] Rendering AI message:', {
      text: message.text?.substring(0, 50) + '...',
      hasAudioUrl: !!message.audioUrl,
      audioUrl: message.audioUrl
    });

    const messageElement = this.createMessageElement(message);
    messageElement.classList.add('ai-message-bubble');

    // 添加鼠标事件监听器
    messageElement.addEventListener('mouseenter', () => this.handleMouseEnter());
    messageElement.addEventListener('mouseleave', () => this.handleMouseLeave());

    // 设置为当前AI消息
    this.currentAIMessage = messageElement;

    // 添加到容器
    this.container.appendChild(messageElement);

    // 如果有音频URL，播放音频
    if (message.audioUrl) {
      console.log('[MessageManager] Audio URL found, attempting to play:', message.audioUrl);

      // 静默播放，不显示播放按钮
      // this.addAudioPlayButton(messageElement, message.audioUrl);

      // 延迟一点播放，确保DOM元素已经渲染
      setTimeout(() => {
        this.playAudio(message.audioUrl);
      }, 100);
    } else {
      console.log('[MessageManager] No audio URL provided for this message');
    }

    // 动画通过CSS类自动触发，无需手动设置
  }



  /**
   * 生成消息ID
   * @private
   * @returns {string} 消息ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }



  /**
   * 获取所有消息
   * @returns {Array} 消息列表
   */
  getMessages() {
    return [...this.messages];
  }

  /**
   * 获取最后一条消息
   * @returns {Object|null} 最后一条消息
   */
  getLastMessage() {
    return this.messages.length > 0 ? this.messages[this.messages.length - 1] : null;
  }

  /**
   * 根据类型获取消息
   * @param {string} type - 消息类型
   * @returns {Array} 指定类型的消息列表
   */
  getMessagesByType(type) {
    return this.messages.filter(message => message.type === type);
  }

  /**
   * 开始AI消息定时器
   * @private
   */
  startAIMessageTimeout() {
    this.aiMessageTimeoutStartTime = Date.now();
    this.aiMessageTimeoutRemaining = this.aiMessageTimeoutDuration;
    this.isHovered = false;

    this.aiMessageTimeout = setTimeout(() => {
      if (!this.isHovered) {
        this.clearCurrentAIMessage();
      }
    }, this.aiMessageTimeoutDuration);
  }

  /**
   * 暂停AI消息定时器
   * @private
   */
  pauseAIMessageTimeout() {
    if (this.aiMessageTimeout) {
      clearTimeout(this.aiMessageTimeout);
      this.aiMessageTimeout = null;

      // 计算剩余时间
      const elapsed = Date.now() - this.aiMessageTimeoutStartTime;
      this.aiMessageTimeoutRemaining = Math.max(0, this.aiMessageTimeoutDuration - elapsed);
    }
  }

  /**
   * 恢复AI消息定时器
   * @private
   */
  resumeAIMessageTimeout() {
    if (this.aiMessageTimeoutRemaining > 0) {
      this.aiMessageTimeoutStartTime = Date.now();
      this.aiMessageTimeout = setTimeout(() => {
        if (!this.isHovered) {
          this.clearCurrentAIMessage();
        }
      }, this.aiMessageTimeoutRemaining);
    }
  }

  /**
   * 处理鼠标进入事件
   * @private
   */
  handleMouseEnter() {
    this.isHovered = true;
    this.pauseAIMessageTimeout();
  }

  /**
   * 处理鼠标离开事件
   * @private
   */
  handleMouseLeave() {
    this.isHovered = false;

    // 添加hovered类，移除出现动画
    if (this.currentAIMessage) {
      this.currentAIMessage.classList.add('hovered');
    }

    this.resumeAIMessageTimeout();
  }

  /**
   * 播放音频
   * @param {string} audioUrl - 音频文件URL
   */
  async playAudio(audioUrl) {
    try {
      console.log('[MessageManager] Playing audio:', audioUrl);
      console.log('[MessageManager] User has interacted:', this.hasUserInteracted);

      // 如果用户还没有交互过，保存音频URL等待用户交互
      if (!this.hasUserInteracted) {
        console.log('[MessageManager] Waiting for user interaction before playing audio');
        this.pendingAudioUrl = audioUrl;
        // 静默等待，不显示用户交互提示
        return;
      }

      // 停止当前播放的音频
      this.stopCurrentAudio();

      // 构建完整的音频URL
      let fullAudioUrl = audioUrl.startsWith('http')
        ? audioUrl
        : `http://localhost:3002${audioUrl}`;

      console.log('[MessageManager] Full audio URL:', fullAudioUrl);

      // 使用Electron的IPC获取音频文件
      let audioBlob;
      try {
        console.log('[MessageManager] Getting audio file via Electron IPC...');
        const audioData = await window.electronAPI.getAudioFile(audioUrl);

        if (!audioData.success) {
          throw new Error(`Failed to get audio file: ${audioData.error}`);
        }

        console.log('[MessageManager] Audio file received via IPC, size:', audioData.size);

        // 将base64数据转换为Blob
        const binaryString = atob(audioData.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        audioBlob = new Blob([bytes], { type: audioData.contentType });
        const blobUrl = URL.createObjectURL(audioBlob);
        fullAudioUrl = blobUrl;

        console.log('[MessageManager] Created blob URL:', fullAudioUrl);

      } catch (ipcError) {
        console.error('[MessageManager] IPC audio fetch failed, trying direct fetch:', ipcError);

        // 回退到直接fetch
        try {
          console.log('[MessageManager] Testing direct audio file accessibility...');
          const testResponse = await fetch(fullAudioUrl, { method: 'HEAD' });
          console.log('[MessageManager] Test response status:', testResponse.status);

          if (!testResponse.ok) {
            throw new Error(`Audio file not accessible: ${testResponse.status} ${testResponse.statusText}`);
          }
          console.log('[MessageManager] Direct audio file is accessible');
        } catch (fetchError) {
          console.error('[MessageManager] Direct fetch also failed:', fetchError);
          throw fetchError;
        }
      }

      // 创建音频对象
      const audio = new Audio();
      this.currentAudio = audio;

      // 设置音频属性
      audio.volume = 0.8;
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous'; // 添加跨域支持

      // 添加详细的事件监听器
      audio.addEventListener('loadstart', () => {
        console.log('[MessageManager] Audio loading started');
      });

      audio.addEventListener('loadedmetadata', () => {
        console.log('[MessageManager] Audio metadata loaded, duration:', audio.duration);
      });

      audio.addEventListener('loadeddata', () => {
        console.log('[MessageManager] Audio data loaded');
      });

      audio.addEventListener('canplay', () => {
        console.log('[MessageManager] Audio can start playing');
      });

      audio.addEventListener('canplaythrough', () => {
        console.log('[MessageManager] Audio can play through');
      });

      audio.addEventListener('play', () => {
        console.log('[MessageManager] Audio playback started');
      });

      audio.addEventListener('playing', () => {
        console.log('[MessageManager] Audio is playing');
      });

      audio.addEventListener('pause', () => {
        console.log('[MessageManager] Audio paused');
      });

      audio.addEventListener('ended', () => {
        console.log('[MessageManager] Audio playback ended');

        // 清理blob URL
        if (fullAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fullAudioUrl);
          console.log('[MessageManager] Blob URL cleaned up');
        }

        this.currentAudio = null;
        this.playNextAudio();
      });

      audio.addEventListener('error', (event) => {
        const error = audio.error;
        console.error('[MessageManager] Audio playback error:', {
          code: error?.code,
          message: error?.message,
          event: event
        });

        // 清理blob URL
        if (fullAudioUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fullAudioUrl);
          console.log('[MessageManager] Blob URL cleaned up after error');
        }

        // 详细的错误代码说明
        if (error) {
          switch (error.code) {
            case 1:
              console.error('[MessageManager] MEDIA_ERR_ABORTED: The fetching process for the media resource was aborted by the user agent');
              break;
            case 2:
              console.error('[MessageManager] MEDIA_ERR_NETWORK: A network error caused the media download to fail');
              break;
            case 3:
              console.error('[MessageManager] MEDIA_ERR_DECODE: An error occurred while decoding the media resource');
              break;
            case 4:
              console.error('[MessageManager] MEDIA_ERR_SRC_NOT_SUPPORTED: The media resource is not supported');
              break;
            default:
              console.error('[MessageManager] Unknown audio error');
          }
        }

        this.currentAudio = null;
        this.playNextAudio();
      });

      audio.addEventListener('stalled', () => {
        console.warn('[MessageManager] Audio loading stalled');
      });

      audio.addEventListener('waiting', () => {
        console.log('[MessageManager] Audio waiting for data');
      });

      // 设置音频源
      audio.src = fullAudioUrl;
      console.log('[MessageManager] Audio source set, attempting to load...');

      // 开始加载
      audio.load();

      // 等待音频可以播放
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Audio load timeout'));
        }, 10000); // 10秒超时

        audio.addEventListener('canplay', () => {
          clearTimeout(timeout);
          resolve();
        }, { once: true });

        audio.addEventListener('error', () => {
          clearTimeout(timeout);
          reject(new Error('Audio load failed'));
        }, { once: true });
      });

      console.log('[MessageManager] Audio loaded, starting playback...');

      // 开始播放
      console.log('[MessageManager] Attempting to play audio...');
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        try {
          await playPromise;
          console.log('[MessageManager] Audio play() promise resolved successfully');
        } catch (playError) {
          console.error('[MessageManager] Audio play() promise rejected:', {
            name: playError.name,
            message: playError.message,
            code: playError.code
          });

          // 详细的错误处理（静默记录）
          switch (playError.name) {
            case 'NotAllowedError':
              console.warn('[MessageManager] Autoplay was prevented by browser policy');
              // 静默处理，不显示提示
              break;
            case 'NotSupportedError':
              console.error('[MessageManager] Audio format not supported');
              // 静默处理，不显示提示
              break;
            case 'AbortError':
              console.warn('[MessageManager] Audio playback was aborted');
              // 静默处理，不显示提示
              break;
            default:
              console.error('[MessageManager] Unknown audio playback error:', playError);
              // 静默处理，不显示提示
          }
          throw playError;
        }
      } else {
        console.log('[MessageManager] Audio play() returned undefined (older browser)');
      }

    } catch (error) {
      console.error('[MessageManager] Failed to play audio:', error);
      this.currentAudio = null;
      this.playNextAudio();

      // 静默处理错误，不显示错误信息
      // 错误已记录在控制台中
    }
  }

  /**
   * 停止当前音频播放
   */
  stopCurrentAudio() {
    if (this.currentAudio) {
      try {
        this.currentAudio.pause();
        this.currentAudio.currentTime = 0;
        this.currentAudio = null;
      } catch (error) {
        console.error('[MessageManager] Error stopping audio:', error);
      }
    }
  }

  /**
   * 播放队列中的下一个音频
   * @private
   */
  playNextAudio() {
    if (this.audioQueue.length > 0) {
      const nextAudioUrl = this.audioQueue.shift();
      this.playAudio(nextAudioUrl);
    }
  }

  /**
   * 添加音频到播放队列
   * @param {string} audioUrl - 音频文件URL
   */
  queueAudio(audioUrl) {
    if (this.currentAudio) {
      // 如果正在播放音频，添加到队列
      this.audioQueue.push(audioUrl);
    } else {
      // 如果没有音频在播放，直接播放
      this.playAudio(audioUrl);
    }
  }

  /**
   * 添加音频播放按钮到消息元素
   * @private
   * @param {HTMLElement} messageElement - 消息元素
   * @param {string} audioUrl - 音频URL
   */
  addAudioPlayButton(messageElement, audioUrl) {
    const playButton = document.createElement('button');
    playButton.style.cssText = `
      background: #28a745;
      color: white;
      border: none;
      padding: 3px 8px;
      border-radius: 3px;
      font-size: 11px;
      cursor: pointer;
      margin-left: 8px;
      display: inline-flex;
      align-items: center;
      gap: 3px;
      opacity: 0.8;
      transition: opacity 0.2s;
    `;
    playButton.innerHTML = '🔊';
    playButton.title = '播放语音';

    playButton.addEventListener('click', (e) => {
      e.stopPropagation();
      console.log('[MessageManager] Manual play button clicked');
      this.playAudio(audioUrl);
    });

    playButton.addEventListener('mouseenter', () => {
      playButton.style.opacity = '1';
    });

    playButton.addEventListener('mouseleave', () => {
      playButton.style.opacity = '0.8';
    });

    messageElement.appendChild(playButton);
  }

  /**
   * 显示自动播放被阻止的消息
   * @private
   */
  showAutoplayBlockedMessage() {
    if (this.currentAIMessage) {
      const playButton = document.createElement('button');
      playButton.style.cssText = `
        background: #007bff;
        color: white;
        border: none;
        padding: 5px 10px;
        border-radius: 3px;
        font-size: 12px;
        cursor: pointer;
        margin-top: 5px;
        display: inline-flex;
        align-items: center;
        gap: 5px;
      `;
      playButton.innerHTML = '🔊 点击播放语音';

      playButton.addEventListener('click', () => {
        // 用户点击后重新尝试播放
        if (this.currentAudio && this.currentAudio.src) {
          this.currentAudio.play().then(() => {
            console.log('[MessageManager] Manual audio play successful');
            playButton.remove();
          }).catch(error => {
            console.error('[MessageManager] Manual audio play failed:', error);
          });
        }
      });

      this.currentAIMessage.appendChild(playButton);
    }
  }

  /**
   * 显示错误消息
   * @private
   * @param {string} message - 错误消息
   */
  showErrorMessage(message) {
    if (this.currentAIMessage) {
      const errorElement = document.createElement('div');
      errorElement.style.cssText = `
        color: #dc3545;
        background: #f8d7da;
        border: 1px solid #f5c6cb;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      errorElement.innerHTML = `<span>❌</span><span>${message}</span>`;

      this.currentAIMessage.appendChild(errorElement);

      // 5秒后自动移除
      setTimeout(() => {
        if (errorElement.parentNode) {
          errorElement.parentNode.removeChild(errorElement);
        }
      }, 5000);
    }
  }

  /**
   * 显示用户交互提示
   * @private
   */
  showUserInteractionPrompt() {
    if (this.currentAIMessage && !this.currentAIMessage.querySelector('.interaction-prompt')) {
      const promptElement = document.createElement('div');
      promptElement.className = 'interaction-prompt';
      promptElement.style.cssText = `
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        color: #856404;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 12px;
        margin-top: 8px;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        transition: background-color 0.2s;
      `;

      promptElement.innerHTML = `
        <span>🔊</span>
        <span>点击任意位置启用语音播放</span>
      `;

      promptElement.addEventListener('click', () => {
        this.hasUserInteracted = true;
        if (this.pendingAudioUrl) {
          this.playAudio(this.pendingAudioUrl);
          this.pendingAudioUrl = null;
        }
        promptElement.remove();
      });

      promptElement.addEventListener('mouseenter', () => {
        promptElement.style.backgroundColor = '#fff3cd';
      });

      this.currentAIMessage.appendChild(promptElement);
    }
  }

  /**
   * 清理音频资源
   */
  cleanup() {
    this.stopCurrentAudio();
    this.audioQueue = [];
  }
}
