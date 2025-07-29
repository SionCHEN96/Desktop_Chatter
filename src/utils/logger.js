/**
 * 统一日志系统
 * 提供结构化的日志记录功能
 */

/**
 * 日志级别枚举
 * @readonly
 * @enum {string}
 */
export const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR'
};

/**
 * 日志颜色配置
 * @private
 */
const LOG_COLORS = {
  [LogLevel.DEBUG]: '\x1b[36m', // 青色
  [LogLevel.INFO]: '\x1b[32m',  // 绿色
  [LogLevel.WARN]: '\x1b[33m',  // 黄色
  [LogLevel.ERROR]: '\x1b[31m'  // 红色
};

/**
 * 重置颜色代码
 * @private
 */
const RESET_COLOR = '\x1b[0m';

/**
 * Logger类
 * 提供结构化的日志记录功能
 */
export class Logger {
  /**
   * 创建Logger实例
   * @param {string} module - 模块名称
   * @param {string} [level=LogLevel.INFO] - 日志级别
   */
  constructor(module, level = LogLevel.INFO) {
    this.module = module;
    this.level = level;
    this.levelPriority = this._getLevelPriority(level);
  }

  /**
   * 获取日志级别优先级
   * @private
   * @param {string} level - 日志级别
   * @returns {number} 优先级数值
   */
  _getLevelPriority(level) {
    const priorities = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
    return priorities[level] || 1;
  }

  /**
   * 检查是否应该记录该级别的日志
   * @private
   * @param {string} level - 日志级别
   * @returns {boolean} 是否应该记录
   */
  _shouldLog(level) {
    return this._getLevelPriority(level) >= this.levelPriority;
  }

  /**
   * 格式化日志消息
   * @private
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} [context] - 上下文信息
   * @returns {string} 格式化后的日志
   */
  _formatMessage(level, message, context = {}) {
    const timestamp = new Date().toISOString();
    const color = LOG_COLORS[level] || '';
    const reset = RESET_COLOR;
    
    let formattedMessage = `${color}[${timestamp}] [${level}] [${this.module}] ${message}${reset}`;
    
    if (Object.keys(context).length > 0) {
      formattedMessage += `\n${color}Context: ${JSON.stringify(context, null, 2)}${reset}`;
    }
    
    return formattedMessage;
  }

  /**
   * 记录日志
   * @private
   * @param {string} level - 日志级别
   * @param {string} message - 日志消息
   * @param {Object} [context] - 上下文信息
   */
  _log(level, message, context = {}) {
    if (!this._shouldLog(level)) return;
    
    const formattedMessage = this._formatMessage(level, message, context);
    
    // 根据级别选择输出方法
    switch (level) {
      case LogLevel.ERROR:
        console.error(formattedMessage);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(formattedMessage);
        break;
      default:
        console.log(formattedMessage);
    }
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {Object} [context] - 上下文信息
   */
  debug(message, context = {}) {
    this._log(LogLevel.DEBUG, message, context);
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {Object} [context] - 上下文信息
   */
  info(message, context = {}) {
    this._log(LogLevel.INFO, message, context);
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {Object} [context] - 上下文信息
   */
  warn(message, context = {}) {
    this._log(LogLevel.WARN, message, context);
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {Error|Object} [context] - 错误对象或上下文信息
   */
  error(message, context = {}) {
    // 如果context是Error对象，提取有用信息
    if (context instanceof Error) {
      context = {
        name: context.name,
        message: context.message,
        stack: context.stack
      };
    }
    this._log(LogLevel.ERROR, message, context);
  }

  /**
   * 设置日志级别
   * @param {string} level - 新的日志级别
   */
  setLevel(level) {
    this.level = level;
    this.levelPriority = this._getLevelPriority(level);
  }
}

/**
 * 创建Logger实例的工厂函数
 * @param {string} module - 模块名称
 * @param {string} [level] - 日志级别
 * @returns {Logger} Logger实例
 */
export function createLogger(module, level) {
  return new Logger(module, level);
}

/**
 * 默认Logger实例
 */
export const defaultLogger = new Logger('App', LogLevel.INFO);
