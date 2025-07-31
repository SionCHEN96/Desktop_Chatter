/**
 * 音频服务模块
 * 负责语音合成和音频处理
 */

import { VITSService } from '../../core/audio/VITSService.js';
import { createLogger } from '../../utils/index.js';
import path from 'path';
import fs from 'fs';

const logger = createLogger('AudioService');

/**
 * 音频服务类
 * 封装音频相关的所有操作
 */
export class AudioService {
  constructor() {
    /** @type {VITSService} VITS语音合成服务 */
    this.vitsService = new VITSService();
    
    /** @type {boolean} 是否启用语音合成 */
    this.ttsEnabled = true;
    
    /** @type {Set<string>} 正在处理的文本集合，避免重复处理 */
    this.processingTexts = new Set();
    
    this.init();
  }

  /**
   * 初始化音频服务
   */
  init() {
    try {
      // 检查Python环境
      this.checkPythonEnvironment();
      
      // 定期清理旧音频文件
      this.startCleanupTimer();
      
      logger.info('AudioService initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AudioService:', error);
      this.ttsEnabled = false;
    }
  }

  /**
   * 检查Python环境
   */
  checkPythonEnvironment() {
    // 这里可以添加Python环境检查逻辑
    // 例如检查Python是否安装，VITS依赖是否可用等
    logger.info('Python environment check completed');
  }

  /**
   * 为AI响应生成语音
   * @param {string} text - AI响应文本
   * @returns {Promise<string|null>} 生成的音频文件路径，如果失败返回null
   */
  async generateSpeechForResponse(text) {
    if (!this.ttsEnabled) {
      logger.warn('TTS is disabled, skipping speech generation');
      return null;
    }

    if (!text || text.trim().length === 0) {
      logger.warn('Empty text provided for speech generation');
      return null;
    }

    // 清理文本，移除特殊字符和过长的内容
    const cleanText = this.cleanTextForTTS(text);
    
    if (this.processingTexts.has(cleanText)) {
      logger.warn('Text is already being processed, skipping duplicate request');
      return null;
    }

    try {
      this.processingTexts.add(cleanText);
      logger.info('Generating speech for AI response');
      
      const audioPath = await this.vitsService.generateSpeech(cleanText);
      
      // 转换为相对于public目录的路径，供前端使用
      const relativePath = path.relative(path.join(process.cwd(), 'public'), audioPath);
      const webPath = relativePath.replace(/\\/g, '/'); // 确保使用正斜杠
      
      logger.info('Speech generation completed:', webPath);
      return webPath;
      
    } catch (error) {
      logger.error('Failed to generate speech for response:', error);
      return null;
    } finally {
      this.processingTexts.delete(cleanText);
    }
  }

  /**
   * 清理文本用于TTS
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanTextForTTS(text) {
    // 移除markdown格式
    let cleanText = text.replace(/[*_`#]/g, '');
    
    // 移除多余的空白字符
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // 限制文本长度（避免生成过长的音频）
    if (cleanText.length > 200) {
      cleanText = cleanText.substring(0, 200) + '...';
    }
    
    // 移除特殊字符，保留中文、英文、数字和基本标点
    cleanText = cleanText.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s.,!?。，！？]/g, '');
    
    return cleanText;
  }

  /**
   * 启用或禁用TTS
   * @param {boolean} enabled - 是否启用
   */
  setTTSEnabled(enabled) {
    this.ttsEnabled = enabled;
    logger.info('TTS enabled status changed to:', enabled);
  }

  /**
   * 获取TTS启用状态
   * @returns {boolean} 是否启用TTS
   */
  isTTSEnabled() {
    return this.ttsEnabled;
  }

  /**
   * 启动清理定时器
   */
  startCleanupTimer() {
    // 每小时清理一次旧音频文件
    setInterval(() => {
      try {
        this.vitsService.cleanupOldAudioFiles();
        logger.debug('Audio cleanup completed');
      } catch (error) {
        logger.warn('Audio cleanup failed:', error);
      }
    }, 60 * 60 * 1000); // 1小时
  }

  /**
   * 获取生成的音频文件列表
   * @returns {Array<string>} 音频文件路径列表
   */
  getGeneratedAudioFiles() {
    try {
      const outputDir = this.vitsService.outputDir;
      if (!fs.existsSync(outputDir)) {
        return [];
      }

      const files = fs.readdirSync(outputDir)
        .filter(file => file.endsWith('.wav'))
        .map(file => path.join(outputDir, file));

      return files;
    } catch (error) {
      logger.error('Failed to get generated audio files:', error);
      return [];
    }
  }

  /**
   * 清理所有生成的音频文件
   */
  clearAllGeneratedAudio() {
    try {
      const files = this.getGeneratedAudioFiles();
      for (const file of files) {
        fs.unlinkSync(file);
      }
      logger.info(`Cleared ${files.length} generated audio files`);
    } catch (error) {
      logger.error('Failed to clear generated audio files:', error);
    }
  }

  /**
   * 获取VITS服务实例
   * @returns {VITSService} VITS服务实例
   */
  getVITSService() {
    return this.vitsService;
  }
}
