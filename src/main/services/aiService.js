/**
 * AI服务模块
 * 负责与LM Studio API的交互和AI响应处理
 */

import axios from 'axios';
import { LM_STUDIO_CONFIG, validateUrl, buildSystemPromptWithMemory } from '../../config/index.js';
import { createLogger, createError, ErrorType, ErrorSeverity } from '../../utils/index.js';

const logger = createLogger('AIService');

/**
 * AI服务类
 * 封装AI相关的所有操作
 *
 * @class AIService
 */
export class AIService {
  /**
   * 创建AI服务实例
   * @param {Object|null} [memoryManager=null] - 内存管理器实例
   */
  constructor(memoryManager = null) {
    /** @type {Object|null} 内存管理器实例 */
    this.memoryManager = memoryManager;
  }

  /**
   * 设置内存管理器
   * @param {Object} memoryManager - 内存管理器实例
   */
  setMemoryManager(memoryManager) {
    this.memoryManager = memoryManager;
  }

  /**
   * 获取AI响应
   * @param {string} message - 用户消息
   * @returns {Promise<string>} AI响应内容
   */
  async getAIResponse(message) {
    try {
      if (!validateUrl(LM_STUDIO_CONFIG.BASE_URL)) {
        throw createError(
          'Invalid API URL configuration',
          ErrorType.VALIDATION,
          ErrorSeverity.HIGH,
          { url: LM_STUDIO_CONFIG.BASE_URL }
        );
      }

      logger.debug('Sending request to LM Studio', {
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        config: LM_STUDIO_CONFIG
      });

      // 构建包含记忆的系统提示
      const systemPrompt = await buildSystemPromptWithMemory(this.memoryManager, message);

      // 保存用户消息到长期记忆
      if (this.memoryManager) {
        try {
          await this.memoryManager.saveMemory(message, { role: 'user' });
        } catch (memoryError) {
          logger.warn('Failed to save user message to memory', memoryError);
        }
      }

      const response = await this._sendRequest(systemPrompt, message);
      const content = this._processResponse(response);

      // 保存AI响应到长期记忆
      if (this.memoryManager) {
        try {
          await this.memoryManager.saveMemory(content, { role: 'assistant' });
        } catch (memoryError) {
          logger.warn('Failed to save AI response to memory', memoryError);
        }
      }

      logger.info('AI response generated successfully');
      return content;
    } catch (error) {
      logger.error('Failed to get AI response', error);

      // 根据错误类型返回不同的用户友好消息
      if (error.type === ErrorType.NETWORK) {
        return '网络连接出现问题，请检查网络设置后重试。';
      } else if (error.type === ErrorType.VALIDATION) {
        return '配置验证失败，请检查LM Studio配置。';
      } else {
        return '抱歉，我无法处理您的请求。请检查LM Studio是否正在运行并正确配置。';
      }
    }
  }

  /**
   * 发送请求到LM Studio
   * @private
   * @param {string} systemPrompt - 系统提示词
   * @param {string} userMessage - 用户消息
   * @returns {Promise<Object>} API响应
   */
  async _sendRequest(systemPrompt, userMessage) {
    try {
      return await axios.post(
        `${LM_STUDIO_CONFIG.BASE_URL}/v1/chat/completions`,
        {
          model: LM_STUDIO_CONFIG.MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: LM_STUDIO_CONFIG.TEMPERATURE,
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000
        }
      );
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw createError(
          'Cannot connect to LM Studio API',
          ErrorType.NETWORK,
          ErrorSeverity.HIGH,
          { url: LM_STUDIO_CONFIG.BASE_URL, code: error.code }
        );
      } else if (error.code === 'ETIMEDOUT') {
        throw createError(
          'Request timeout',
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          { timeout: 30000 }
        );
      } else {
        throw createError(
          'API request failed',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.HIGH,
          { status: error.response?.status, statusText: error.response?.statusText },
          error
        );
      }
    }
  }

  /**
   * 处理AI响应
   * @private
   * @param {Object} response - API响应
   * @returns {string} 处理后的内容
   */
  _processResponse(response) {
    try {
      logger.debug('Processing LM Studio response', {
        status: response.status,
        hasChoices: !!response.data?.choices?.length
      });

      if (!response.data?.choices?.length) {
        throw createError(
          'Invalid API response format',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.HIGH,
          { response: response.data }
        );
      }

      let content = response.data.choices[0].message?.content;

      if (!content) {
        throw createError(
          'Empty response content',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.MEDIUM,
          { choice: response.data.choices[0] }
        );
      }

      // 移除<think>标签及其内容
      content = content.replace(/<think>[\s\S]*?<\/think>/g, '');

      // 移除可能残留的空白行
      content = content.replace(/^\s*[\r\n]/gm, '').trim();

      if (!content) {
        throw createError(
          'Content is empty after processing',
          ErrorType.INTERNAL,
          ErrorSeverity.MEDIUM
        );
      }

      return content;
    } catch (error) {
      if (error instanceof Error && error.name === 'AppError') {
        throw error;
      }
      throw createError(
        'Failed to process API response',
        ErrorType.INTERNAL,
        ErrorSeverity.HIGH,
        {},
        error
      );
    }
  }
}
