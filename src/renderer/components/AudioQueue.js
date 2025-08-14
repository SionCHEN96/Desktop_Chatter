/**
 * 音频队列管理器
 * 负责管理分段语音的合成和播放
 */

export class AudioQueue {
  constructor() {
    this.queue = [];              // 音频队列
    this.isPlaying = false;       // 是否正在播放
    this.currentAudio = null;     // 当前播放的音频
    this.synthesisPromises = [];  // 合成任务Promise数组
    this.onSegmentReady = null;   // 第一段准备好的回调
    this.onAllComplete = null;    // 全部完成的回调
    this.onError = null;          // 错误回调
    this.startTime = null;        // 开始时间
    this.maxDisplayTime = 30000;  // 最大显示时间（30秒）
    this.hasUserInteracted = false; // 用户是否已交互
  }

  /**
   * 设置用户交互状态
   * @param {boolean} hasInteracted - 是否已交互
   */
  setUserInteraction(hasInteracted) {
    this.hasUserInteracted = hasInteracted;
  }

  /**
   * 开始分段语音合成和播放
   * @param {Array<string>} textSegments - 文本段落数组
   * @param {Function} synthesizeFunction - 语音合成函数
   * @param {Object} callbacks - 回调函数
   */
  async startSegmentedSynthesis(textSegments, synthesizeFunction, callbacks = {}) {
    console.log('[AudioQueue] Starting segmented synthesis for', textSegments.length, 'segments');
    
    this.onSegmentReady = callbacks.onSegmentReady;
    this.onAllComplete = callbacks.onAllComplete;
    this.onError = callbacks.onError;
    this.startTime = Date.now();
    
    // 清空之前的队列
    this.clear();
    
    // 初始化队列
    this.queue = textSegments.map((text, index) => ({
      id: `segment_${index}`,
      text,
      audioUrl: null,
      isReady: false,
      isPlayed: false,
      error: null
    }));

    // 开始合成所有段落
    this.synthesisPromises = textSegments.map((text, index) => 
      this.synthesizeSegment(text, index, synthesizeFunction)
    );

    // 等待第一段合成完成
    try {
      await this.synthesisPromises[0];
      
      // 如果第一段成功，开始播放
      if (this.queue[0] && this.queue[0].isReady) {
        console.log('[AudioQueue] First segment ready, starting playback');
        
        // 通知第一段准备好
        if (this.onSegmentReady) {
          this.onSegmentReady(this.queue[0]);
        }
        
        // 开始播放队列
        this.startPlayback();
      }
    } catch (error) {
      console.error('[AudioQueue] First segment synthesis failed:', error);
      if (this.onError) {
        this.onError(error);
      }
    }

    // 在后台等待所有段落合成完成
    this.waitForAllSegments();
  }

  /**
   * 合成单个段落
   * @private
   * @param {string} text - 文本
   * @param {number} index - 段落索引
   * @param {Function} synthesizeFunction - 合成函数
   */
  async synthesizeSegment(text, index, synthesizeFunction) {
    const startTime = Date.now();

    try {
      console.log(`[AudioQueue] Synthesizing segment ${index + 1}:`, text.substring(0, 30) + '...');

      const audioUrl = await synthesizeFunction(text);
      const duration = Date.now() - startTime;

      if (this.queue[index]) {
        this.queue[index].audioUrl = audioUrl;
        this.queue[index].isReady = true;
        this.queue[index].duration = duration;
        console.log(`[AudioQueue] Segment ${index + 1} synthesis completed in ${duration}ms`);
      }

      return audioUrl;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[AudioQueue] Segment ${index + 1} synthesis failed after ${duration}ms:`, error);

      if (this.queue[index]) {
        this.queue[index].error = error;
        this.queue[index].duration = duration;
        this.queue[index].errorType = this.categorizeError(error);
      }

      // 对于第一段，如果合成失败，仍然要抛出错误以便显示消息
      // 对于后续段落，记录错误但不阻止其他段落的合成
      if (index === 0) {
        throw error;
      } else {
        console.warn(`[AudioQueue] Segment ${index + 1} failed, but continuing with other segments`);
        return null; // 返回null表示这段失败了
      }
    }
  }

  /**
   * 分类错误类型
   * @private
   * @param {Error} error - 错误对象
   * @returns {string} 错误类型
   */
  categorizeError(error) {
    const message = error.message || '';

    if (message.includes('timeout') || message.includes('aborted')) {
      return 'timeout';
    } else if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    } else if (message.includes('service')) {
      return 'service';
    } else {
      return 'unknown';
    }
  }

  /**
   * 开始播放队列
   * @private
   */
  async startPlayback() {
    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    console.log('[AudioQueue] Starting audio playback');

    try {
      for (let i = 0; i < this.queue.length; i++) {
        const segment = this.queue[i];
        
        // 等待当前段落准备好
        await this.waitForSegment(i);
        
        // 检查是否超时
        if (this.isTimeout()) {
          console.log('[AudioQueue] Display timeout reached, stopping playback');
          break;
        }
        
        // 播放当前段落
        if (segment.isReady && segment.audioUrl && !segment.isPlayed) {
          await this.playSegment(segment);
        }
      }
    } catch (error) {
      console.error('[AudioQueue] Playback error:', error);
      if (this.onError) {
        this.onError(error);
      }
    } finally {
      this.isPlaying = false;
      console.log('[AudioQueue] Playback completed');
      
      // 通知播放完成
      if (this.onAllComplete) {
        this.onAllComplete();
      }
    }
  }

  /**
   * 等待指定段落准备好
   * @private
   * @param {number} index - 段落索引
   */
  async waitForSegment(index) {
    const maxWait = 10000; // 最多等待10秒
    const startWait = Date.now();
    
    while (!this.queue[index]?.isReady && !this.queue[index]?.error) {
      if (Date.now() - startWait > maxWait) {
        throw new Error(`Segment ${index + 1} synthesis timeout`);
      }
      
      if (this.isTimeout()) {
        throw new Error('Display timeout reached');
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.queue[index]?.error) {
      throw this.queue[index].error;
    }
  }

  /**
   * 播放单个段落
   * @private
   * @param {Object} segment - 段落对象
   */
  async playSegment(segment) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[AudioQueue] Playing segment:`, segment.text.substring(0, 30) + '...');
        
        // 如果用户还没有交互，跳过播放
        if (!this.hasUserInteracted) {
          console.log('[AudioQueue] Skipping audio playback - no user interaction');
          segment.isPlayed = true;
          resolve();
          return;
        }
        
        // 构建完整的音频URL
        const fullAudioUrl = segment.audioUrl.startsWith('http') 
          ? segment.audioUrl 
          : `http://localhost:3002${segment.audioUrl}`;

        // 创建音频对象
        const audio = new Audio(fullAudioUrl);
        this.currentAudio = audio;
        
        audio.addEventListener('loadeddata', () => {
          console.log(`[AudioQueue] Audio loaded for segment`);
        });
        
        audio.addEventListener('ended', () => {
          console.log(`[AudioQueue] Segment playback completed`);
          segment.isPlayed = true;
          this.currentAudio = null;
          resolve();
        });
        
        audio.addEventListener('error', (error) => {
          console.error(`[AudioQueue] Audio playback error:`, error);
          segment.isPlayed = true;
          this.currentAudio = null;
          reject(error);
        });
        
        // 开始播放
        audio.play().catch(playError => {
          console.error(`[AudioQueue] Audio play failed:`, playError);
          segment.isPlayed = true;
          this.currentAudio = null;
          reject(playError);
        });
        
      } catch (error) {
        console.error(`[AudioQueue] Error setting up audio playback:`, error);
        segment.isPlayed = true;
        reject(error);
      }
    });
  }

  /**
   * 等待所有段落合成完成
   * @private
   */
  async waitForAllSegments() {
    try {
      await Promise.allSettled(this.synthesisPromises);
      console.log('[AudioQueue] All segments synthesis completed');
    } catch (error) {
      console.error('[AudioQueue] Error waiting for all segments:', error);
    }
  }

  /**
   * 检查是否超时
   * @private
   * @returns {boolean}
   */
  isTimeout() {
    if (!this.startTime) return false;
    return Date.now() - this.startTime > this.maxDisplayTime;
  }

  /**
   * 停止播放
   */
  stop() {
    console.log('[AudioQueue] Stopping audio queue');
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    
    this.isPlaying = false;
  }

  /**
   * 清空队列
   */
  clear() {
    this.stop();
    this.queue = [];
    this.synthesisPromises = [];
    this.startTime = null;
  }

  /**
   * 获取队列状态
   * @returns {Object}
   */
  getStatus() {
    const readyCount = this.queue.filter(s => s.isReady).length;
    const playedCount = this.queue.filter(s => s.isPlayed).length;
    const errorCount = this.queue.filter(s => s.error).length;
    
    return {
      totalSegments: this.queue.length,
      readySegments: readyCount,
      playedSegments: playedCount,
      errorSegments: errorCount,
      isPlaying: this.isPlaying,
      isTimeout: this.isTimeout(),
      elapsedTime: this.startTime ? Date.now() - this.startTime : 0
    };
  }
}
