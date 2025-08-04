/**
 * 配置模块统一导出
 * 简化的配置管理，所有配置集中在一个文件中
 */

// 主配置文件 - 推荐使用
export {
    default as CONFIG,
    AI_CONFIG,
    UI_CONFIG,
    ANIMATION_CONFIG,
    MEMORY_CONFIG,
    RENDERING_CONFIG,
    LOGGING_CONFIG,
    validateUrl,
    buildSystemPromptWithMemory
} from './config.js';

// 向后兼容的导出
export {
    LM_STUDIO_CONFIG,
    THEME_CONFIG,
    WINDOW_CONFIG,
    CONTAINER_STYLES
} from './config.js';