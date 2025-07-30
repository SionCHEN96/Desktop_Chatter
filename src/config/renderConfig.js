/**
 * 高质量3D渲染配置
 * 针对达到Windows 3D Viewer质量水平的渲染设置
 */

/**
 * 渲染器配置
 * @typedef {Object} RendererConfig
 * @property {boolean} antialias - 抗锯齿
 * @property {string} powerPreference - GPU性能偏好
 * @property {boolean} alpha - 透明度支持
 * @property {boolean} stencil - 模板缓冲
 * @property {boolean} depth - 深度缓冲
 * @property {boolean} logarithmicDepthBuffer - 对数深度缓冲
 * @property {number} pixelRatio - 像素比率
 */
export const RENDERER_CONFIG = {
  // 基础设置
  antialias: true,
  powerPreference: "high-performance",
  alpha: true,
  stencil: true,
  depth: true,
  logarithmicDepthBuffer: true,
  
  // 高质量设置
  pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1, // 限制最大像素比率以平衡性能
  
  // 色彩空间和色调映射
  outputColorSpace: 'srgb',
  toneMapping: 'ACESFilmic',
  toneMappingExposure: 0.7, // 降低曝光值，减少整体亮度
  
  // 阴影设置
  shadowMap: {
    enabled: true,
    type: 'PCFSoftShadowMap', // 可选: BasicShadowMap, PCFShadowMap, PCFSoftShadowMap, VSMShadowMap
    autoUpdate: true,
    needsUpdate: true
  }
};

/**
 * PBR材质配置
 * @typedef {Object} PBRMaterialConfig
 * @property {number} metalness - 金属度
 * @property {number} roughness - 粗糙度
 * @property {number} envMapIntensity - 环境贴图强度
 * @property {boolean} transparent - 透明度
 * @property {number} opacity - 不透明度
 */
export const PBR_MATERIAL_CONFIG = {
  // 默认PBR材质属性
  metalness: 0.1,
  roughness: 0.7,
  envMapIntensity: 0.6, // 降低环境贴图强度，减少反射亮度
  transparent: false,
  opacity: 1.0,
  
  // 高级属性
  clearcoat: 0.0,
  clearcoatRoughness: 0.0,
  sheen: 0.0,
  sheenRoughness: 1.0,
  transmission: 0.0,
  thickness: 0.0,
  ior: 1.5,
  
  // 渲染设置
  side: 'DoubleSide',
  depthTest: true,
  depthWrite: true,
  alphaTest: 0.0,
  
  // 阴影设置
  castShadow: true,
  receiveShadow: true
};

/**
 * 光照配置
 * @typedef {Object} LightingConfig
 * @property {Object} directional - 方向光配置
 * @property {Object} ambient - 环境光配置
 * @property {Object} hemisphere - 半球光配置
 * @property {Object} point - 点光源配置
 */
export const LIGHTING_CONFIG = {
  // 主方向光（太阳光）
  directional: {
    color: 0xffffff,
    intensity: 1.8, // 降低主光源强度，减少整体亮度
    position: [10, 10, 5],
    castShadow: true,
    shadow: {
      mapSize: 2048, // 提高阴影贴图分辨率
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

  // 填充光（柔和的侧光）
  fill: {
    color: 0xffffff,
    intensity: 0.5, // 降低填充光强度
    position: [-5, 5, 5],
    castShadow: false
  },

  // 轮廓光（背光）
  rim: {
    color: 0xffffff,
    intensity: 0.4, // 降低轮廓光强度
    position: [0, 5, -5],
    castShadow: false
  },

  // 环境光
  ambient: {
    color: 0xffffff,
    intensity: 0.2 // 降低环境光强度，减少整体亮度
  },

  // 半球光（天空光）
  hemisphere: {
    skyColor: 0xffffbb,
    groundColor: 0x080820,
    intensity: 0.15 // 降低半球光强度
  }
};

/**
 * 后处理效果配置
 * @typedef {Object} PostProcessingConfig
 * @property {Object} ssao - SSAO配置
 * @property {Object} bloom - Bloom配置
 * @property {Object} fxaa - FXAA配置
 */
export const POST_PROCESSING_CONFIG = {
  // SSAO (屏幕空间环境光遮蔽)
  ssao: {
    enabled: true,
    kernelRadius: 8,
    minDistance: 0.005,
    maxDistance: 0.1,
    intensity: 0.25,
    bias: 0.5,
    scale: 1.0,
    kernelSize: 32
  },
  
  // Bloom (辉光效果)
  bloom: {
    enabled: true,
    threshold: 0.85,
    strength: 0.5,
    radius: 0.4,
    exposure: 1.0
  },
  
  // FXAA (快速近似抗锯齿)
  fxaa: {
    enabled: true
  },
  
  // 色调映射
  toneMapping: {
    enabled: true,
    exposure: 1.0,
    whitePoint: 1.0
  }
};

/**
 * 相机配置
 * @typedef {Object} CameraConfig
 * @property {number} fov - 视野角度
 * @property {number} near - 近裁剪面
 * @property {number} far - 远裁剪面
 * @property {Array<number>} position - 相机位置
 * @property {Array<number>} target - 相机目标
 */
export const CAMERA_CONFIG = {
  fov: 50, // 降低FOV以获得更自然的透视效果
  near: 0.1,
  far: 1000,
  position: [0, 0, 3],
  target: [0, 0, 0]
};

/**
 * 性能配置
 * @typedef {Object} PerformanceConfig
 * @property {string} quality - 质量等级
 * @property {boolean} adaptiveQuality - 自适应质量
 * @property {number} targetFPS - 目标帧率
 */
export const PERFORMANCE_CONFIG = {
  quality: 'high', // low, medium, high, ultra
  adaptiveQuality: true,
  targetFPS: 60,
  
  // 质量等级设置
  qualityLevels: {
    low: {
      shadowMapSize: 512,
      pixelRatio: 1,
      antialias: false,
      postProcessing: false
    },
    medium: {
      shadowMapSize: 1024,
      pixelRatio: 1,
      antialias: true,
      postProcessing: false
    },
    high: {
      shadowMapSize: 2048,
      pixelRatio: typeof window !== 'undefined' ? Math.min(window.devicePixelRatio, 2) : 1,
      antialias: true,
      postProcessing: true
    },
    ultra: {
      shadowMapSize: 4096,
      pixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio : 1,
      antialias: true,
      postProcessing: true
    }
  }
};

/**
 * 环境贴图配置
 * @typedef {Object} EnvironmentConfig
 * @property {string} type - 环境类型
 * @property {string} path - 环境贴图路径
 * @property {number} intensity - 强度
 */
export const ENVIRONMENT_CONFIG = {
  type: 'hdr', // hdr, cube, equirectangular
  path: './public/environments/', // 环境贴图文件夹
  defaultEnvironment: 'studio.hdr', // 默认环境贴图
  intensity: 1.0,
  background: false // 是否作为背景显示
};
