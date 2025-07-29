/**
 * 统一错误处理系统
 * 提供错误分类、处理和恢复机制
 */

import { createLogger } from './logger.js';

const logger = createLogger('ErrorHandler');

/**
 * 错误类型枚举
 * @readonly
 * @enum {string}
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  VALIDATION: 'VALIDATION',
  AUTHENTICATION: 'AUTHENTICATION',
  PERMISSION: 'PERMISSION',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL: 'INTERNAL',
  EXTERNAL_API: 'EXTERNAL_API',
  FILE_SYSTEM: 'FILE_SYSTEM',
  MEMORY: 'MEMORY',
  ANIMATION: 'ANIMATION',
  UNKNOWN: 'UNKNOWN'
};

/**
 * 错误严重程度枚举
 * @readonly
 * @enum {string}
 */
export const ErrorSeverity = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * 应用错误类
 * 扩展标准Error类，提供更多错误信息
 */
export class AppError extends Error {
  /**
   * 创建应用错误实例
   * @param {string} message - 错误消息
   * @param {string} [type=ErrorType.UNKNOWN] - 错误类型
   * @param {string} [severity=ErrorSeverity.MEDIUM] - 错误严重程度
   * @param {Object} [context={}] - 错误上下文
   * @param {Error} [originalError] - 原始错误对象
   */
  constructor(message, type = ErrorType.UNKNOWN, severity = ErrorSeverity.MEDIUM, context = {}, originalError = null) {
    super(message);
    
    this.name = 'AppError';
    this.type = type;
    this.severity = severity;
    this.context = context;
    this.originalError = originalError;
    this.timestamp = new Date();
    
    // 保持堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * 转换为JSON格式
   * @returns {Object} JSON表示
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : null
    };
  }
}

/**
 * 错误处理器类
 * 提供统一的错误处理和恢复机制
 */
export class ErrorHandler {
  constructor() {
    this.errorHandlers = new Map();
    this.fallbackHandler = this.defaultErrorHandler.bind(this);
    this.setupGlobalErrorHandlers();
  }

  /**
   * 设置全局错误处理器
   * @private
   */
  setupGlobalErrorHandlers() {
    // 处理未捕获的异常
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception', error);
      this.handleError(new AppError(
        'Uncaught Exception',
        ErrorType.INTERNAL,
        ErrorSeverity.CRITICAL,
        {},
        error
      ));
    });

    // 处理未处理的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection', { reason, promise });
      this.handleError(new AppError(
        'Unhandled Promise Rejection',
        ErrorType.INTERNAL,
        ErrorSeverity.HIGH,
        { reason, promise }
      ));
    });
  }

  /**
   * 注册错误处理器
   * @param {string} errorType - 错误类型
   * @param {Function} handler - 处理函数
   */
  registerHandler(errorType, handler) {
    this.errorHandlers.set(errorType, handler);
  }

  /**
   * 处理错误
   * @param {Error|AppError} error - 错误对象
   * @param {Object} [additionalContext={}] - 额外上下文
   * @returns {Promise<boolean>} 是否成功处理
   */
  async handleError(error, additionalContext = {}) {
    try {
      // 转换为AppError
      const appError = this.normalizeError(error, additionalContext);
      
      // 记录错误
      this.logError(appError);
      
      // 查找特定处理器
      const handler = this.errorHandlers.get(appError.type) || this.fallbackHandler;
      
      // 执行处理器
      const result = await handler(appError);
      
      return result !== false;
    } catch (handlerError) {
      logger.error('Error in error handler', handlerError);
      return false;
    }
  }

  /**
   * 标准化错误对象
   * @private
   * @param {Error|AppError} error - 错误对象
   * @param {Object} additionalContext - 额外上下文
   * @returns {AppError} 标准化的错误对象
   */
  normalizeError(error, additionalContext = {}) {
    if (error instanceof AppError) {
      // 合并额外上下文
      error.context = { ...error.context, ...additionalContext };
      return error;
    }
    
    // 根据错误类型推断错误分类
    const type = this.inferErrorType(error);
    const severity = this.inferErrorSeverity(error, type);
    
    return new AppError(
      error.message || 'Unknown error',
      type,
      severity,
      additionalContext,
      error
    );
  }

  /**
   * 推断错误类型
   * @private
   * @param {Error} error - 错误对象
   * @returns {string} 错误类型
   */
  inferErrorType(error) {
    const message = error.message?.toLowerCase() || '';
    
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return ErrorType.NETWORK;
    }
    if (message.includes('permission') || message.includes('access')) {
      return ErrorType.PERMISSION;
    }
    if (message.includes('not found') || message.includes('404')) {
      return ErrorType.NOT_FOUND;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }
    if (message.includes('file') || message.includes('directory')) {
      return ErrorType.FILE_SYSTEM;
    }
    if (message.includes('memory') || message.includes('storage')) {
      return ErrorType.MEMORY;
    }
    if (message.includes('animation') || message.includes('three')) {
      return ErrorType.ANIMATION;
    }
    
    return ErrorType.UNKNOWN;
  }

  /**
   * 推断错误严重程度
   * @private
   * @param {Error} error - 错误对象
   * @param {string} type - 错误类型
   * @returns {string} 错误严重程度
   */
  inferErrorSeverity(error, type) {
    // 根据错误类型设置默认严重程度
    const severityMap = {
      [ErrorType.NETWORK]: ErrorSeverity.MEDIUM,
      [ErrorType.VALIDATION]: ErrorSeverity.LOW,
      [ErrorType.AUTHENTICATION]: ErrorSeverity.HIGH,
      [ErrorType.PERMISSION]: ErrorSeverity.HIGH,
      [ErrorType.NOT_FOUND]: ErrorSeverity.LOW,
      [ErrorType.INTERNAL]: ErrorSeverity.HIGH,
      [ErrorType.EXTERNAL_API]: ErrorSeverity.MEDIUM,
      [ErrorType.FILE_SYSTEM]: ErrorSeverity.MEDIUM,
      [ErrorType.MEMORY]: ErrorSeverity.HIGH,
      [ErrorType.ANIMATION]: ErrorSeverity.LOW,
      [ErrorType.UNKNOWN]: ErrorSeverity.MEDIUM
    };
    
    return severityMap[type] || ErrorSeverity.MEDIUM;
  }

  /**
   * 记录错误
   * @private
   * @param {AppError} error - 错误对象
   */
  logError(error) {
    const logMethod = this.getLogMethod(error.severity);
    logMethod(`[${error.type}] ${error.message}`, error.toJSON());
  }

  /**
   * 获取日志方法
   * @private
   * @param {string} severity - 错误严重程度
   * @returns {Function} 日志方法
   */
  getLogMethod(severity) {
    switch (severity) {
      case ErrorSeverity.LOW:
        return logger.info.bind(logger);
      case ErrorSeverity.MEDIUM:
        return logger.warn.bind(logger);
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return logger.error.bind(logger);
      default:
        return logger.warn.bind(logger);
    }
  }

  /**
   * 默认错误处理器
   * @private
   * @param {AppError} error - 错误对象
   * @returns {boolean} 处理结果
   */
  defaultErrorHandler(error) {
    // 默认处理逻辑
    logger.warn(`No specific handler for error type: ${error.type}`);
    return true;
  }
}

/**
 * 全局错误处理器实例
 */
export const globalErrorHandler = new ErrorHandler();

/**
 * 便捷的错误处理函数
 * @param {Error|AppError} error - 错误对象
 * @param {Object} [context] - 额外上下文
 * @returns {Promise<boolean>} 处理结果
 */
export function handleError(error, context = {}) {
  return globalErrorHandler.handleError(error, context);
}

/**
 * 创建应用错误的便捷函数
 * @param {string} message - 错误消息
 * @param {string} [type] - 错误类型
 * @param {string} [severity] - 错误严重程度
 * @param {Object} [context] - 错误上下文
 * @returns {AppError} 应用错误实例
 */
export function createError(message, type, severity, context) {
  return new AppError(message, type, severity, context);
}
