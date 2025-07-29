export const LM_STUDIO_CONFIG = {
  BASE_URL: 'http://127.0.0.1:1234',
  MODEL: 'deepseek/deepseek-r1-0528-qwen3-8b',
  TEMPERATURE: 0.7
};

// 基础系统提示词
const BASE_SYSTEM_PROMPT = `You are a  good friend and life assistant. Your personality includes:
1. Friendly and helpful
2. Always provides helpful and detailed answers
3. Interaction Rules:
  - Language: Respond in Chinese, and maintain consistency throughout the conversation`;

// 添加一个函数来构建包含记忆的系统提示
export async function buildSystemPromptWithMemory(userMessage, memoryManager) {
  let basePrompt = BASE_SYSTEM_PROMPT;

  try {
    if (memoryManager) {
      // 搜索与用户消息相关的记忆
      const searchResults = await memoryManager.searchMemory(userMessage, 3);
      let memories = [];

      if (searchResults && searchResults.points) {
        memories = searchResults.points.map(point => point.payload?.content || point.content).filter(content => content);
      } else if (searchResults && Array.isArray(searchResults)) {
        memories = searchResults.map(item => item.payload?.content || item.content).filter(content => content);
      }

      // 获取最近的记忆
      const recentResults = await memoryManager.getRecentMemories(3);
      let recentMemories = [];

      if (recentResults && recentResults.points) {
        recentMemories = recentResults.points.map(point => point.payload?.content || point.content).filter(content => content);
      } else if (recentResults && Array.isArray(recentResults)) {
        recentMemories = recentResults.map(item => item.payload?.content || item.content).filter(content => content);
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

export const CONTAINER_STYLES = {
  position: 'absolute',
  bottom: '200px',
  left: '0'
};

// 简单的URL验证函数
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
}