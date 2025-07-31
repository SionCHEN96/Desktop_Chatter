/**
 * 音频管理器
 * 负责音频播放和语音合成功能
 */

import { createLogger } from '../../utils/index.js';

const logger = createLogger('AudioManager');

/**
 * 音频管理器类
 * 封装音频播放和语音合成相关的所有操作
 */
export class AudioManager {
  constructor() {
    /** @type {HTMLAudioElement|null} 当前播放的音频元素 */
    this.currentAudio = null;
    
    /** @type {boolean} 是否正在播放音频 */
    this.isPlaying = false;
    
    /** @type {number} 音量设置 (0-1) */
    this.volume = 0.8;
    
    this.init();
  }

  /**
   * 初始化音频管理器
   */
  init() {
    logger.info('AudioManager initialized');
  }

  /**
   * 播放音频文件
   * @param {string} audioPath - 音频文件路径
   * @returns {Promise<void>}
   */
  async playAudio(audioPath) {
    try {
      // 停止当前播放的音频
      this.stopCurrentAudio();

      // 创建新的音频元素
      this.currentAudio = new Audio(audioPath);
      this.currentAudio.volume = this.volume;

      // 设置播放状态
      this.isPlaying = true;

      // 添加事件监听器
      this.currentAudio.addEventListener('ended', () => {
        this.isPlaying = false;
        logger.debug('Audio playback ended');
      });

      this.currentAudio.addEventListener('error', (error) => {
        logger.error('Audio playback error:', error);
        this.isPlaying = false;
      });

      // 播放音频
      await this.currentAudio.play();
      logger.info('Audio playback started:', audioPath);

    } catch (error) {
      logger.error('Failed to play audio:', error);
      this.isPlaying = false;
      throw error;
    }
  }

  /**
   * 停止当前播放的音频
   */
  stopCurrentAudio() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  /**
   * 设置音量
   * @param {number} volume - 音量值 (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
    logger.debug('Volume set to:', this.volume);
  }

  /**
   * 获取当前音量
   * @returns {number} 当前音量值
   */
  getVolume() {
    return this.volume;
  }

  /**
   * 检查是否正在播放音频
   * @returns {boolean} 是否正在播放
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * 播放语音合成的音频
   * @param {string} audioPath - 合成的音频文件路径
   * @returns {Promise<void>}
   */
  async playTTSAudio(audioPath) {
    try {
      logger.info('Playing TTS audio:', audioPath);
      await this.playAudio(audioPath);
    } catch (error) {
      logger.error('Failed to play TTS audio:', error);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    this.stopCurrentAudio();
    logger.info('AudioManager disposed');
  }
}
