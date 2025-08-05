/**
 * GPT-SoVITS服务模块
 * 负责与GPT-SoVITS API的交互和语音合成处理
 */

import axios from 'axios';
import { GPT_SOVITS_CONFIG, validateUrl } from '../../config/index.js';
import { createLogger, createError, ErrorType, ErrorSeverity } from '../../utils/index.js';

const logger = createLogger('GPTSoVITSService');

/**
 * GPT-SoVITS服务类
 * 封装GPT-SoVITS相关的所有操作
 *
 * @class GPTSoVITSService
 */
export class GPTSoVITSService {
  /**
   * 创建GPT-SoVITS服务实例
   */
  constructor() {
    /** @type {string} API基础URL */
    this.apiUrl = GPT_SOVITS_CONFIG.USE_API_V2 ? GPT_SOVITS_CONFIG.API_V2_URL : GPT_SOVITS_CONFIG.API_URL;
    
    /** @type {boolean} 是否使用API v2 */
    this.useApiV2 = GPT_SOVITS_CONFIG.USE_API_V2;
    
    /** @type {number} 请求超时时间 */
    this.timeout = GPT_SOVITS_CONFIG.TIMEOUT;
  }

  /**
   * 检查GPT-SoVITS服务是否可用
   * @returns {Promise<boolean>} 服务是否可用
   */
  async checkServiceHealth() {
    try {
      if (!validateUrl(this.apiUrl)) {
        throw createError(
          'Invalid GPT-SoVITS API URL configuration',
          ErrorType.VALIDATION,
          ErrorSeverity.HIGH,
          { url: this.apiUrl }
        );
      }

      const response = await axios.get(`${this.apiUrl}/health`, {
        timeout: 5000
      });

      logger.info('GPT-SoVITS service health check passed', {
        status: response.status,
        data: response.data
      });

      return true;
    } catch (error) {
      logger.warn('GPT-SoVITS service health check failed', {
        error: error.message,
        url: this.apiUrl
      });
      return false;
    }
  }

  /**
   * 语音合成
   * @param {string} text - 要合成的文本
   * @param {Object} options - 合成选项
   * @param {string} [options.text_lang='zh'] - 文本语言
   * @param {string} [options.ref_audio_path] - 参考音频路径
   * @param {string} [options.prompt_text] - 参考音频文本
   * @param {string} [options.prompt_lang='zh'] - 参考音频语言
   * @param {number} [options.top_k=5] - Top-K采样参数
   * @param {number} [options.top_p=1.0] - Top-P采样参数
   * @param {number} [options.temperature=1.0] - 温度参数
   * @param {string} [options.text_split_method='cut5'] - 文本分割方法
   * @param {number} [options.batch_size=1] - 批处理大小
   * @param {number} [options.speed_factor=1.0] - 语速因子
   * @param {boolean} [options.streaming_mode=false] - 是否使用流式模式
   * @returns {Promise<Buffer>} 合成的音频数据
   */
  async synthesize(text, options = {}) {
    try {
      if (!text || typeof text !== 'string') {
        throw createError(
          'Invalid text input for synthesis',
          ErrorType.VALIDATION,
          ErrorSeverity.MEDIUM,
          { text }
        );
      }

      // 合并默认参数和用户参数
      const params = {
        ...GPT_SOVITS_CONFIG.DEFAULT_PARAMS,
        ...options,
        text: text.trim()
      };

      logger.debug('Starting GPT-SoVITS synthesis', {
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        params: { ...params, text: '[TRUNCATED]' }
      });

      const endpoint = this.useApiV2 ? '/tts' : '/';
      const response = await this._sendSynthesisRequest(endpoint, params);

      if (response.data) {
        logger.info('GPT-SoVITS synthesis completed successfully', {
          textLength: text.length,
          audioSize: response.data.length
        });
        return response.data;
      } else {
        throw createError(
          'No audio data received from GPT-SoVITS API',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.HIGH
        );
      }
    } catch (error) {
      if (error.type) {
        // 已经是我们的错误对象
        throw error;
      }

      logger.error('GPT-SoVITS synthesis failed', {
        error: error.message,
        text: text.substring(0, 50) + '...'
      });

      throw createError(
        'GPT-SoVITS synthesis failed',
        ErrorType.EXTERNAL_API,
        ErrorSeverity.HIGH,
        { originalError: error.message },
        error
      );
    }
  }

  /**
   * 使用预设角色进行语音合成
   * @param {string} text - 要合成的文本
   * @param {string} characterName - 角色名称（如'XIANGLING'）
   * @param {Object} options - 额外选项
   * @returns {Promise<Buffer>} 合成的音频数据
   */
  async synthesizeWithCharacter(text, characterName = 'XIANGLING', options = {}) {
    const character = GPT_SOVITS_CONFIG.MODELS.LOCAL_MODELS[characterName.toUpperCase()];
    
    if (!character) {
      throw createError(
        `Character '${characterName}' not found in configuration`,
        ErrorType.VALIDATION,
        ErrorSeverity.MEDIUM,
        { availableCharacters: Object.keys(GPT_SOVITS_CONFIG.MODELS.LOCAL_MODELS) }
      );
    }

    const characterOptions = {
      ref_audio_path: character.REF_AUDIO,
      prompt_text: character.REF_TEXT,
      prompt_lang: character.REF_LANGUAGE,
      ...options
    };

    return this.synthesize(text, characterOptions);
  }

  /**
   * 发送合成请求到GPT-SoVITS API
   * @private
   * @param {string} endpoint - API端点
   * @param {Object} params - 请求参数
   * @returns {Promise<Object>} API响应
   */
  async _sendSynthesisRequest(endpoint, params) {
    try {
      const config = {
        method: 'POST',
        url: `${this.apiUrl}${endpoint}`,
        timeout: this.timeout,
        responseType: 'arraybuffer', // 接收二进制音频数据
        headers: {
          'Content-Type': 'application/json'
        }
      };

      if (this.useApiV2) {
        // API v2 使用JSON格式
        config.data = params;
      } else {
        // API v1 使用form-data格式
        config.data = new URLSearchParams(params);
        config.headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      return await axios(config);
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw createError(
          'Cannot connect to GPT-SoVITS API',
          ErrorType.NETWORK,
          ErrorSeverity.HIGH,
          { url: this.apiUrl, code: error.code }
        );
      } else if (error.code === 'ETIMEDOUT') {
        throw createError(
          'GPT-SoVITS API request timeout',
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          { timeout: this.timeout }
        );
      } else {
        throw createError(
          'GPT-SoVITS API request failed',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.HIGH,
          { 
            status: error.response?.status, 
            statusText: error.response?.statusText,
            data: error.response?.data 
          },
          error
        );
      }
    }
  }

  /**
   * 获取可用的角色列表
   * @returns {Array<Object>} 角色列表
   */
  getAvailableCharacters() {
    return Object.entries(GPT_SOVITS_CONFIG.MODELS.LOCAL_MODELS).map(([name, config]) => ({
      name,
      displayName: name.toLowerCase(),
      refAudio: config.REF_AUDIO,
      refText: config.REF_TEXT,
      language: config.REF_LANGUAGE
    }));
  }

  /**
   * 获取服务配置信息
   * @returns {Object} 配置信息
   */
  getServiceInfo() {
    return {
      apiUrl: this.apiUrl,
      useApiV2: this.useApiV2,
      timeout: this.timeout,
      availableCharacters: this.getAvailableCharacters(),
      defaultParams: GPT_SOVITS_CONFIG.DEFAULT_PARAMS
    };
  }
}
