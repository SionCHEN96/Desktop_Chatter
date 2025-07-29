/**
 * AI相关配置
 * 包含LM Studio配置、系统提示词等
 */

/**
 * LM Studio API配置
 * @typedef {Object} LMStudioConfig
 * @property {string} BASE_URL - API基础URL
 * @property {string} MODEL - 使用的模型名称
 * @property {number} TEMPERATURE - 温度参数，控制响应的随机性
 */
export const LM_STUDIO_CONFIG = {
  BASE_URL: 'http://127.0.0.1:1234',
  MODEL: 'deepseek/deepseek-r1-0528-qwen3-8b',
  TEMPERATURE: 0.7
};

/**
 * 基础系统提示词
 * 定义AI助手的基本人格和行为规范
 */
const BASE_SYSTEM_PROMPT = `You are a good friend and life assistant. Your personality includes:
1. Friendly and helpful
2. Always provides helpful and detailed answers
3. Interaction Rules:
  - Language: Respond in Chinese, and maintain consistency throughout the conversation`;

/**
 * 构建包含记忆的系统提示词
 * @param {Object} memoryManager - 内存管理器实例
 * @param {string} userMessage - 用户消息
 * @returns {Promise<string>} 包含记忆上下文的系统提示词
 */
export async function buildSystemPromptWithMemory(memoryManager, userMessage) {
  let basePrompt = BASE_SYSTEM_PROMPT;

  try {
    if (memoryManager) {
      // 搜索与用户消息相关的记忆
      const searchResults = await memoryManager.searchMemory(userMessage, 3);
      let memories = [];

      if (searchResults && searchResults.points) {
        memories = searchResults.points
          .map(point => point.payload?.content || point.content)
          .filter(content => content);
      } else if (searchResults && Array.isArray(searchResults)) {
        memories = searchResults
          .map(item => item.payload?.content || item.content)
          .filter(content => content);
      }

      // 获取最近的记忆
      const recentResults = await memoryManager.getRecentMemories(3);
      let recentMemories = [];

      if (recentResults && recentResults.points) {
        recentMemories = recentResults.points
          .map(point => point.payload?.content || point.content)
          .filter(content => content);
      } else if (recentResults && Array.isArray(recentResults)) {
        recentMemories = recentResults
          .map(item => item.payload?.content || item.content)
          .filter(content => content);
      }

      // 合并记忆并去重
      const allMemories = [...new Set([...memories, ...recentMemories])];

      if (allMemories.length > 0) {
        basePrompt += `\n\n# Context Information:\n`;
        basePrompt += `Here are some previous conversations or facts that might be relevant:\n`;
        allMemories.forEach((memory, index) => {
          basePrompt += `${index + 1}. ${memory}\n`;
        });
        basePrompt += `\nUse this context to provide more personalized and accurate responses, but don't explicitly mention these memories unless they're directly relevant to the conversation.`;
      }
    }
  } catch (error) {
    console.error('[DEBUG] Error building system prompt with memory:', error);
  }

  return basePrompt;
}

/**
 * 验证URL格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} URL是否有效
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}
