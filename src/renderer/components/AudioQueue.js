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
    this.synthesizeFunction = synthesizeFunction;
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
      error: null,
      isPlaying: false
    }));

    // 开始逐个合成和播放
    this.startSequentialSynthesisAndPlayback();
  }

  /**
   * 开始顺序合成和播放
   * @private
   */
  async startSequentialSynthesisAndPlayback() {
    console.log('[AudioQueue] Starting sequential synthesis and playback');

    try {
      // 合成第一段
      await this.synthesizeSegment(this.queue[0].text, 0, this.synthesizeFunction);

      // 第一段准备好，通知显示气泡
      if (this.queue[0].isReady) {
        console.log('[AudioQueue] First segment ready, notifying UI');
        if (this.onSegmentReady) {
          this.onSegmentReady(this.queue[0]);
        }

        // 开始播放第一段
        this.playSegment(this.queue[0], 0);

        // 在后台继续合成剩余段落
        this.continueBackgroundSynthesis();
      }
    } catch (error) {
      console.error('[AudioQueue] First segment synthesis failed:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  /**
   * 继续后台合成剩余段落
   * @private
   */
  async continueBackgroundSynthesis() {
    console.log('[AudioQueue] Starting background synthesis for remaining segments');

    // 从第二段开始合成
    for (let i = 1; i < this.queue.length; i++) {
      try {
        // 不等待，立即开始下一段的合成
        this.synthesizeSegment(this.queue[i].text, i, this.synthesizeFunction)
          .then(() => {
            console.log(`[AudioQueue] Background segment ${i + 1} ready`);
          })
          .catch(error => {
            console.error(`[AudioQueue] Background segment ${i + 1} failed:`, error);
          });
      } catch (error) {
        console.error(`[AudioQueue] Failed to start synthesis for segment ${i + 1}:`, error);
      }
    }
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
   * 等待指定段落准备好
   * @private
   * @param {number} index - 段落索引
   */
  async waitForSegment(index) {
    const maxWait = 15000; // 最多等待15秒
    const startWait = Date.now();

    console.log(`[AudioQueue] Waiting for segment ${index + 1} to be ready...`);

    while (!this.queue[index]?.isReady && !this.queue[index]?.error) {
      if (Date.now() - startWait > maxWait) {
        console.warn(`[AudioQueue] Segment ${index + 1} synthesis timeout, skipping`);
        return false; // 返回false表示等待失败
      }

      if (this.isTimeout()) {
        console.warn('[AudioQueue] Display timeout reached during wait');
        return false; // 返回false表示等待失败
      }

      await new Promise(resolve => setTimeout(resolve, 200)); // 增加等待间隔
    }

    if (this.queue[index]?.error) {
      console.warn(`[AudioQueue] Segment ${index + 1} has error, skipping:`, this.queue[index].error);
      return false; // 返回false表示有错误
    }

    console.log(`[AudioQueue] Segment ${index + 1} is ready`);
    return true; // 返回true表示准备好了
  }

  /**
   * 播放单个段落
   * @private
   * @param {Object} segment - 段落对象
   * @param {number} index - 段落索引
   */
  async playSegment(segment, index) {
    return new Promise((resolve, reject) => {
      try {
        console.log(`[AudioQueue] Playing segment ${index + 1}:`, segment.text.substring(0, 30) + '...');

        // 标记为正在播放
        segment.isPlaying = true;

        // 如果用户还没有交互，跳过播放但继续下一段
        if (!this.hasUserInteracted) {
          console.log('[AudioQueue] Skipping audio playback - no user interaction');
          segment.isPlayed = true;
          segment.isPlaying = false;
          resolve();
          this.playNextSegment(index);
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
          console.log(`[AudioQueue] Audio loaded for segment ${index + 1}`);
        });

        audio.addEventListener('ended', () => {
          console.log(`[AudioQueue] Segment ${index + 1} playback completed`);
          segment.isPlayed = true;
          segment.isPlaying = false;
          this.currentAudio = null;
          resolve();

          // 播放下一段
          this.playNextSegment(index);
        });

        audio.addEventListener('error', (error) => {
          console.error(`[AudioQueue] Audio playback error for segment ${index + 1}:`, error);
          segment.isPlayed = true;
          segment.isPlaying = false;
          this.currentAudio = null;

          // 即使出错也继续播放下一段
          this.playNextSegment(index);
          resolve(); // 不reject，继续播放
        });

        // 开始播放
        audio.play().catch(playError => {
          console.error(`[AudioQueue] Audio play failed for segment ${index + 1}:`, playError);
          segment.isPlayed = true;
          segment.isPlaying = false;
          this.currentAudio = null;

          // 即使出错也继续播放下一段
          this.playNextSegment(index);
          resolve(); // 不reject，继续播放
        });

      } catch (error) {
        console.error(`[AudioQueue] Error setting up audio playback for segment ${index + 1}:`, error);
        segment.isPlayed = true;
        segment.isPlaying = false;

        // 即使出错也继续播放下一段
        this.playNextSegment(index);
        resolve(); // 不reject，继续播放
      }
    });
  }

  /**
   * 播放下一段
   * @private
   * @param {number} currentIndex - 当前段落索引
   */
  async playNextSegment(currentIndex) {
    const nextIndex = currentIndex + 1;

    // 检查是否还有下一段
    if (nextIndex >= this.queue.length) {
      console.log('[AudioQueue] All segments played, completing');
      this.completePlayback();
      return;
    }

    const nextSegment = this.queue[nextIndex];

    // 等待下一段准备好
    const isReady = await this.waitForSegment(nextIndex);

    // 检查是否超时
    if (this.isTimeout()) {
      console.log('[AudioQueue] Display timeout reached, stopping playback');
      this.completePlayback();
      return;
    }

    // 如果段落准备好了，播放它
    if (isReady && nextSegment.isReady && nextSegment.audioUrl && !nextSegment.isPlayed) {
      await this.playSegment(nextSegment, nextIndex);
    } else {
      // 如果下一段不可用，继续检查后面的段落
      console.log(`[AudioQueue] Segment ${nextIndex + 1} not ready, trying next segment`);
      this.playNextSegment(nextIndex);
    }
  }

  /**
   * 完成播放
   * @private
   */
  completePlayback() {
    console.log('[AudioQueue] Playback completed');
    this.isPlaying = false;

    // 通知播放完成
    if (this.onAllComplete) {
      this.onAllComplete();
    }
  }



  /**
   * 检查是否超时
   * @private
   * @returns {boolean}
   */
  isTimeout() {
    if (!this.startTime) return false;
    const elapsed = Date.now() - this.startTime;
    const isTimeout = elapsed > this.maxDisplayTime;

    if (isTimeout) {
      console.log(`[AudioQueue] Display timeout reached: ${elapsed}ms > ${this.maxDisplayTime}ms`);
    }

    return isTimeout;
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
