/**
 * AI Companion 类型定义文件
 * 提供项目中使用的主要类型定义
 */

/**
 * @typedef {Object} AIConfig
 * @property {string} BASE_URL - API基础URL
 * @property {string} MODEL - 使用的模型名称
 * @property {number} TEMPERATURE - 温度参数
 */

/**
 * @typedef {Object} Message
 * @property {string} id - 消息唯一标识
 * @property {'user'|'ai'|'system'} type - 消息类型
 * @property {string} text - 消息内容
 * @property {Date} timestamp - 时间戳
 * @property {Object} [metadata] - 元数据
 */

/**
 * @typedef {Object} MemoryItem
 * @property {string} content - 记忆内容
 * @property {Object} metadata - 元数据
 * @property {Date} timestamp - 时间戳
 * @property {number} [score] - 相关性分数
 */

/**
 * @typedef {Object} AnimationConfig
 * @property {string} resource - 动画资源路径
 * @property {string} name - 动画名称
 * @property {string} description - 动画描述
 */

/**
 * @typedef {Object} WindowConfig
 * @property {number} width - 窗口宽度
 * @property {number} height - 窗口高度
 * @property {boolean} transparent - 是否透明
 * @property {boolean} frame - 是否显示边框
 */

/**
 * @typedef {Object} ThemeColors
 * @property {string} primary - 主色调
 * @property {string} secondary - 次色调
 * @property {string} success - 成功色
 * @property {string} danger - 危险色
 * @property {string} warning - 警告色
 * @property {string} info - 信息色
 * @property {string} light - 浅色
 * @property {string} dark - 深色
 * @property {string} userMessage - 用户消息背景色
 * @property {string} aiMessage - AI消息背景色
 * @property {string} background - 背景色
 */

/**
 * @typedef {Object} ServiceResponse
 * @property {boolean} success - 是否成功
 * @property {*} [data] - 响应数据
 * @property {string} [error] - 错误信息
 * @property {number} [code] - 错误代码
 */

/**
 * @typedef {Object} IPCMessage
 * @property {string} type - 消息类型
 * @property {*} payload - 消息载荷
 * @property {string} [id] - 消息ID
 */

/**
 * @typedef {Object} CharacterState
 * @property {boolean} isLoaded - 是否已加载
 * @property {string} currentAnimation - 当前动画
 * @property {boolean} isAnimating - 是否正在播放动画
 * @property {Object} position - 位置信息
 * @property {Object} rotation - 旋转信息
 */

/**
 * @typedef {Object} AppState
 * @property {boolean} isInitialized - 是否已初始化
 * @property {boolean} isConnected - 是否已连接
 * @property {string} currentView - 当前视图
 * @property {Object} settings - 设置信息
 */

// 导出类型定义（用于IDE支持）
export const Types = {
  AIConfig: /** @type {AIConfig} */ ({}),
  Message: /** @type {Message} */ ({}),
  MemoryItem: /** @type {MemoryItem} */ ({}),
  AnimationConfig: /** @type {AnimationConfig} */ ({}),
  WindowConfig: /** @type {WindowConfig} */ ({}),
  ThemeColors: /** @type {ThemeColors} */ ({}),
  ServiceResponse: /** @type {ServiceResponse} */ ({}),
  IPCMessage: /** @type {IPCMessage} */ ({}),
  CharacterState: /** @type {CharacterState} */ ({}),
  AppState: /** @type {AppState} */ ({})
};
