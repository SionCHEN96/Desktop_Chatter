/**
 * AI服务模块
 * 负责与LM Studio API的交互和AI响应处理
 */

// 使用Node.js内置的fetch API
import { AI_CONFIG, validateUrl, buildSystemPromptWithMemory } from '../../config/index.js';
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
      if (!validateUrl(AI_CONFIG.BASE_URL)) {
        throw createError(
          'Invalid API URL configuration',
          ErrorType.VALIDATION,
          ErrorSeverity.HIGH,
          { url: AI_CONFIG.BASE_URL }
        );
      }

      logger.debug('Sending request to LM Studio', {
        message: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
        config: AI_CONFIG
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

      // Return different user-friendly messages based on error type
      if (error.type === ErrorType.NETWORK) {
        return 'Network connection issue. Please check your network settings and try again.';
      } else if (error.type === ErrorType.VALIDATION) {
        return 'Configuration validation failed. Please check your LM Studio configuration.';
      } else {
        return 'Sorry, I cannot process your request. Please check if LM Studio is running and properly configured.';
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(`${AI_CONFIG.BASE_URL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: AI_CONFIG.MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage }
          ],
          temperature: AI_CONFIG.TEMPERATURE,
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw createError(
          'API request failed',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.HIGH,
          { status: response.status, statusText: response.statusText }
        );
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      if (error.name === 'AbortError') {
        throw createError(
          'Request timeout',
          ErrorType.NETWORK,
          ErrorSeverity.MEDIUM,
          { timeout: 30000 }
        );
      } else if (error.code === 'ECONNREFUSED' || error.message.includes('fetch')) {
        throw createError(
          'Cannot connect to LM Studio API',
          ErrorType.NETWORK,
          ErrorSeverity.HIGH,
          { url: AI_CONFIG.BASE_URL, code: error.code }
        );
      } else if (error.type) {
        // 已经是我们的错误对象
        throw error;
      } else {
        throw createError(
          'API request failed',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.HIGH,
          { originalError: error.message },
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

      // 检查和修复编码问题
      const encodingIssuePatterns = ['锛', '鍚', '浣', '鎴', '鍙', '甯', '瑙', '鐞', '闂', '鍚', '鍛€', '鏄', '鐨', '鏅', '鸿兘', '鍔╂墜'];
      const hasEncodingIssue = encodingIssuePatterns.some(pattern => content.includes(pattern));

      if (hasEncodingIssue) {
        console.log('[AIService] Detected encoding issue in AI response, attempting to fix...');
        console.log('[AIService] Original content sample:', content.substring(0, 100) + '...');

        try {
          // 尝试多种编码修复方法
          let fixedContent = content;

          // 方法1: latin1 -> utf8
          try {
            const buffer = Buffer.from(content, 'latin1');
            const utf8Content = buffer.toString('utf8');

            // 检查修复效果：如果包含更多常见中文字符，则使用修复后的内容
            const commonChars = ['你', '好', '是', '的', '我', '在', '有', '了', '不', '和', '人', '这', '中', '大', '为'];
            const utf8Score = commonChars.reduce((score, char) => score + (utf8Content.includes(char) ? 1 : 0), 0);
            const originalScore = commonChars.reduce((score, char) => score + (content.includes(char) ? 1 : 0), 0);

            if (utf8Score > originalScore) {
              fixedContent = utf8Content;
              console.log('[AIService] Encoding fix successful using latin1->utf8');
            }
          } catch (e) {
            console.warn('[AIService] latin1->utf8 fix failed:', e.message);
          }

          // 方法2: 如果还有问题，尝试其他编码
          if (encodingIssuePatterns.some(pattern => fixedContent.includes(pattern))) {
            try {
              // 尝试 gbk 解码
              const iconv = require('iconv-lite');
              if (iconv.encodingExists('gbk')) {
                const gbkFixed = iconv.decode(Buffer.from(content, 'binary'), 'gbk');
                const gbkScore = commonChars.reduce((score, char) => score + (gbkFixed.includes(char) ? 1 : 0), 0);
                const currentScore = commonChars.reduce((score, char) => score + (fixedContent.includes(char) ? 1 : 0), 0);

                if (gbkScore > currentScore) {
                  fixedContent = gbkFixed;
                  console.log('[AIService] Encoding fix successful using gbk');
                }
              }
            } catch (e) {
              console.warn('[AIService] GBK fix failed:', e.message);
            }
          }

          content = fixedContent;
          console.log('[AIService] AI response after encoding fix:', content.substring(0, 100) + '...');

        } catch (encodingError) {
          console.warn('[AIService] Failed to fix AI response encoding:', encodingError);
        }
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
