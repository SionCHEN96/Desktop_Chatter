/**
 * 内存管理服务
 * 负责初始化和管理内存管理器
 */

import { MemoryManagerFactory } from '../../core/memory/index.js';

/**
 * 内存服务类
 * 封装内存管理相关的所有操作
 */
export class MemoryService {
  constructor() {
    this.memoryManager = null;
  }

  /**
   * 初始化内存管理器
   * 按优先级尝试不同的存储策略
   * @returns {Promise<Object|null>} 内存管理器实例
   */
  async initializeMemoryManager() {
    try {
      // 首先尝试使用Qdrant
      this.memoryManager = await MemoryManagerFactory.createMemoryManager('qdrant');
      console.log('[MemoryService] Successfully initialized with Qdrant strategy');
      return this.memoryManager;
    } catch (error) {
      console.error('[MemoryService] Failed to initialize with Qdrant strategy:', error.message);
      
      try {
        // 尝试使用ChromaDB作为备选
        this.memoryManager = await MemoryManagerFactory.createMemoryManager('chromadb');
        console.log('[MemoryService] Successfully initialized with ChromaDB strategy');
        return this.memoryManager;
      } catch (chromaError) {
        console.error('[MemoryService] Failed to initialize with ChromaDB strategy:', chromaError.message);
        
        try {
          // 最后尝试使用内存存储
          this.memoryManager = await MemoryManagerFactory.createMemoryManager('memory');
          console.log('[MemoryService] Successfully initialized with in-memory strategy');
          return this.memoryManager;
        } catch (memoryError) {
          console.error('[MemoryService] Failed to initialize with in-memory strategy:', memoryError.message);
          console.error('[MemoryService] All memory strategies failed to initialize');
          this.memoryManager = null;
          return null;
        }
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
      console.warn('[MemoryService] Memory manager not available');
      return false;
    }

    try {
      await this.memoryManager.clearAllMemories();
      return true;
    } catch (error) {
      console.error('[MemoryService] Failed to clear memories:', error);
      return false;
    }
  }
}
