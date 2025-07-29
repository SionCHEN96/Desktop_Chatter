/**
 * 内存管理服务
 * 负责初始化和管理内存管理器，集成ChromaDB服务
 */

import { MemoryManagerFactory } from '../../core/memory/index.js';
import { ChromaService } from './chromaService.js';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('MemoryService');

/**
 * 内存服务类
 * 封装内存管理相关的所有操作，集成ChromaDB自动启动
 */
export class MemoryService {
  constructor() {
    this.memoryManager = null;
    this.chromaService = new ChromaService();
  }

  /**
   * 初始化内存管理器
   * 自动启动ChromaDB服务并初始化内存管理器
   * @returns {Promise<Object|null>} 内存管理器实例
   */
  async initializeMemoryManager() {
    try {
      logger.info('Starting memory service initialization...');

      // 首先尝试启动ChromaDB服务
      const chromaStarted = await this.chromaService.startChromaDB();

      if (chromaStarted) {
        // ChromaDB启动成功，使用ChromaDB策略
        const connectionConfig = this.chromaService.getConnectionConfig();
        this.memoryManager = await MemoryManagerFactory.createMemoryManager('chromadb', connectionConfig);
        logger.info('Successfully initialized with ChromaDB strategy');
        return this.memoryManager;
      } else {
        // ChromaDB启动失败，降级到内存存储
        logger.warn('ChromaDB failed to start, falling back to in-memory storage');
        this.memoryManager = await MemoryManagerFactory.createMemoryManager('memory');
        logger.info('Successfully initialized with in-memory strategy');
        return this.memoryManager;
      }
    } catch (error) {
      logger.error('Failed to initialize memory manager', error);

      try {
        // 最后的降级方案
        logger.info('Attempting final fallback to in-memory storage');
        this.memoryManager = await MemoryManagerFactory.createMemoryManager('memory');
        logger.info('Successfully initialized with fallback in-memory strategy');
        return this.memoryManager;
      } catch (fallbackError) {
        logger.error('All memory strategies failed to initialize', fallbackError);
        this.memoryManager = null;
        return null;
      }
    }
  }

  /**
   * 获取内存管理器实例
   * @returns {Object|null} 内存管理器实例
   */
  getMemoryManager() {
    return this.memoryManager;
  }

  /**
   * 检查内存管理器是否可用
   * @returns {boolean} 是否可用
   */
  isMemoryManagerAvailable() {
    return this.memoryManager !== null;
  }

  /**
   * 保存记忆
   * @param {string} content - 内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<boolean>} 是否成功
   */
  async saveMemory(content, metadata = {}) {
    if (!this.memoryManager) {
      console.warn('[MemoryService] Memory manager not available');
      return false;
    }

    try {
      await this.memoryManager.saveMemory(content, metadata);
      return true;
    } catch (error) {
      console.error('[MemoryService] Failed to save memory:', error);
      return false;
    }
  }

  /**
   * 搜索记忆
   * @param {string} query - 搜索查询
   * @param {number} limit - 结果限制
   * @returns {Promise<Array|null>} 搜索结果
   */
  async searchMemory(query, limit = 5) {
    if (!this.memoryManager) {
      console.warn('[MemoryService] Memory manager not available');
      return null;
    }

    try {
      return await this.memoryManager.searchMemory(query, limit);
    } catch (error) {
      console.error('[MemoryService] Failed to search memory:', error);
      return null;
    }
  }

  /**
   * 获取最近的记忆
   * @param {number} limit - 结果限制
   * @returns {Promise<Array|null>} 最近的记忆
   */
  async getRecentMemories(limit = 5) {
    if (!this.memoryManager) {
      console.warn('[MemoryService] Memory manager not available');
      return null;
    }

    try {
      return await this.memoryManager.getRecentMemories(limit);
    } catch (error) {
      console.error('[MemoryService] Failed to get recent memories:', error);
      return null;
    }
  }

  /**
   * 清除所有记忆
   * @returns {Promise<boolean>} 是否成功
   */
  async clearAllMemories() {
    if (!this.memoryManager) {
      logger.warn('Memory manager not available');
      return false;
    }

    try {
      await this.memoryManager.clearAllMemories();
      logger.info('All memories cleared successfully');
      return true;
    } catch (error) {
      logger.error('Failed to clear memories', error);
      return false;
    }
  }

  /**
   * 停止内存服务
   * @returns {Promise<void>}
   */
  async stopService() {
    try {
      logger.info('Stopping memory service...');

      // 停止ChromaDB服务
      await this.chromaService.stopChromaDB();

      // 清理内存管理器引用
      this.memoryManager = null;

      logger.info('Memory service stopped successfully');
    } catch (error) {
      logger.error('Error stopping memory service', error);
    }
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态信息
   */
  getServiceStatus() {
    return {
      memoryManager: {
        available: !!this.memoryManager,
        type: this.memoryManager?.constructor?.name || 'none'
      },
      chromaService: this.chromaService.getStatus()
    };
  }
}
