/**
 * 应用主配置文件
 * 重新导出各个配置模块，保持向后兼容性
 */

// 重新导出AI配置
export {
  LM_STUDIO_CONFIG,
  buildSystemPromptWithMemory,
  validateUrl
} from './aiConfig.js';

// 重新导出UI配置
export {
  CONTAINER_STYLES,
  WINDOW_CONFIG,
  THEME_CONFIG
} from './uiConfig.js';