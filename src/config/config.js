/**
 * AI Companion 统一配置文件
 * 包含所有应用配置，简化配置管理
 */

/**
 * 验证URL格式
 * @param {string} url - 要验证的URL
 * @returns {boolean} 验证结果
 */
export function validateUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 构建包含记忆的系统提示词
 * @param {Array} memories - 相关记忆数组
 * @returns {string} 系统提示词
 */
export function buildSystemPromptWithMemory(memories = []) {
  let prompt = '你是一个友善、聪明的AI助手。请用简洁、自然的方式回答用户的问题。';
  
  if (memories && memories.length > 0) {
    const memoryContext = memories
      .map(memory => memory.content)
      .join('\n');
    
    prompt += `\n\n以下是一些相关的对话历史，可以帮助你更好地理解上下文：\n${memoryContext}`;
  }
  
  return prompt;
}

// ==================== AI 配置 ====================
export const AI_CONFIG = {
  BASE_URL: 'http://127.0.0.1:1234',
  MODEL: 'deepseek/deepseek-r1-0528-qwen3-8b',
  TEMPERATURE: 0.7,
  MAX_TOKENS: 2048,
  TIMEOUT: 30000
};

// ==================== UI 配置 ====================
export const UI_CONFIG = {
  THEME: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    userMessage: '#dcf8c6',
    aiMessage: '#ffffff',
    background: 'transparent'  // 修改为透明背景
  },
  WINDOW: {
    width: 400,
    height: 600,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: './src/preload.js'
    }
  },
  CONTAINER: {
    borderRadius: '15px',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: 'transparent',  // 修改为透明背景
    padding: '20px'
  }
};

// ==================== 动画配置 ====================
export const ANIMATION_CONFIG = {
  DEFAULT_STATE: 'idle',
  TRANSITION_DURATION: 500,
  BLEND_MODE: 'smooth',
  RESOURCES: {
    idle: './public/Animations/Idle.fbx',
    thinking: './public/Animations/Thinking.fbx'
    // 暂时注释掉其他动画，只保留基础的 idle 和 thinking
    // speaking: './public/Animations/Looking.fbx',
    // joy: './public/Animations/Look Around.fbx',
    // sad: './public/Animations/Standing Idle.fbx',
    // surprised: './public/Animations/Look Around.fbx'
  },
  EVENTS: {
    USER_MESSAGE: 'thinking',
    AI_RESPONSE: 'idle',  // 暂时改为 idle，因为没有 speaking 状态
    IDLE: 'idle',
    ERROR: 'idle'  // 暂时改为 idle，因为没有 sad 状态
  }
};

// ==================== 内存配置 ====================
export const MEMORY_CONFIG = {
  STRATEGY: 'chromadb',
  FALLBACK_STRATEGY: 'memory',
  MAX_MEMORIES: 1000,
  SEARCH_LIMIT: 5,
  CHROMA: {
    PATH: './data/chroma',
    COLLECTION: 'ai_companion_memories',
    HOST: 'localhost',
    PORT: 8000
  }
};

// ==================== 渲染配置 ====================
export const RENDERING_CONFIG = {
  ANTIALIAS: true,
  SHADOWS: true,
  QUALITY: 'high',
  PERFORMANCE: {
    MAX_FPS: 60,
    ADAPTIVE_QUALITY: true
  },
  CAMERA: {
    fov: 45,
    near: 0.1,
    far: 1000,
    position: [0, 1.6, 3],
    target: [0, 1, 0]
  },
  LIGHTING: {
    // 主方向光配置
    directional: {
      color: 0xffffff,
      intensity: 0.8,
      position: [5, 10, 5],
      castShadow: true,
      shadow: {
        mapSize: 2048,
        camera: {
          near: 0.1,
          far: 50,
          left: -10,
          right: 10,
          top: 10,
          bottom: -10
        },
        bias: -0.0001,
        normalBias: 0.02
      }
    },
    // 填充光配置
    fill: {
      color: 0x87ceeb,
      intensity: 0.3,
      position: [-5, 5, -5]
    },
    // 轮廓光配置
    rim: {
      color: 0xffffff,
      intensity: 0.2,
      position: [0, 5, -10]
    },
    // 环境光配置
    ambient: {
      color: 0x404040,
      intensity: 0.4
    },
    // 半球光配置
    hemisphere: {
      skyColor: 0x87ceeb,
      groundColor: 0x444444,
      intensity: 0.3
    }
  },
  RENDERER: {
    antialias: true,
    powerPreference: 'high-performance',
    alpha: true,
    stencil: false,
    depth: true,
    logarithmicDepthBuffer: false,
    toneMappingExposure: 1.0,
    shadowMap: {
      enabled: true
    }
  }
};

// ==================== 日志配置 ====================
export const LOGGING_CONFIG = {
  LEVEL: 'INFO',
  ENABLE_COLORS: true,
  ENABLE_TIMESTAMP: true
};

// ==================== 向后兼容导出 ====================
export const LM_STUDIO_CONFIG = AI_CONFIG;
export const THEME_CONFIG = UI_CONFIG.THEME;
export const WINDOW_CONFIG = UI_CONFIG.WINDOW;
export const CONTAINER_STYLES = UI_CONFIG.CONTAINER;

// 构建系统提示词函数已在上面导出

// 默认导出所有配置
export default {
  AI: AI_CONFIG,
  UI: UI_CONFIG,
  ANIMATION: ANIMATION_CONFIG,
  MEMORY: MEMORY_CONFIG,
  RENDERING: RENDERING_CONFIG,
  LOGGING: LOGGING_CONFIG,
  
  // 工具函数
  validateUrl,
  buildSystemPromptWithMemory
};
