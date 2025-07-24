export const LM_STUDIO_CONFIG = {
  BASE_URL: 'http://127.0.0.1:1234',
  MODEL: 'deepseek/deepseek-r1-0528-qwen3-8b',
  TEMPERATURE: 0.7,
  SYSTEM_PROMPT: 'You are a helpful AI assistant.'
};

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