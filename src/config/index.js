/**
 * 配置模块统一导出
 * 提供所有配置项的统一访问入口
 */

// 应用配置（向后兼容）
export {
    LM_STUDIO_CONFIG,
    validateUrl,
    buildSystemPromptWithMemory,
    CONTAINER_STYLES,
    WINDOW_CONFIG,
    THEME_CONFIG
} from './appConfig.js';

// AI配置
export {
    LM_STUDIO_CONFIG as AI_CONFIG,
    buildSystemPromptWithMemory as buildAIPrompt,
    validateUrl as validateApiUrl
} from './aiConfig.js';

// UI配置
export {
    CONTAINER_STYLES as UI_CONTAINER_STYLES,
    WINDOW_CONFIG as UI_WINDOW_CONFIG,
    THEME_CONFIG as UI_THEME_CONFIG
} from './uiConfig.js';

// 动画配置
export {
    ANIMATION_CONFIG,
    ANIMATION_EVENTS,
    ANIMATION_TRANSITION,
    ANIMATION_BLEND_MODE
} from './animationConfig.js';

// 渲染配置
export {
    RENDERER_CONFIG,
    PBR_MATERIAL_CONFIG,
    LIGHTING_CONFIG,
    POST_PROCESSING_CONFIG,
    CAMERA_CONFIG,
    PERFORMANCE_CONFIG,
    ENVIRONMENT_CONFIG
} from './renderConfig.js';