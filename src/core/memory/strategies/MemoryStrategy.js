/**
 * 内存存储策略
 * 使用内存数组进行记忆存储和检索（降级方案）
 */

import { MemoryManager } from '../MemoryManager.js';

export class MemoryStrategy extends MemoryManager {
  constructor() {
    super();
    this.memories = [];
    this.initialized = false;
  }

  /**
   * 初始化内存存储
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.memories = [];
      this.initialized = true;
      console.log('[MemoryStrategy] In-memory storage initialized successfully');
    } catch (error) {
      console.error('[MemoryStrategy] Failed to initialize in-memory storage:', error);
      throw error;
    }
  }

  /**
   * 保存记忆到内存
   * @param {string} content - 记忆内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<void>}
   */
  async saveMemory(content, metadata = {}) {
    if (!this.initialized) {
      throw new Error('Memory storage not initialized');
    }

    try {
      const memory = {
        id: this.generateId(),
        content: content,
        metadata: metadata,
        timestamp: new Date(),
        vector: this.generateSimpleVector(content) // 简单的向量表示
      };

      this.memories.push(memory);
      
      // 限制内存中的记忆数量，避免内存泄漏
      if (this.memories.length > 1000) {
        this.memories = this.memories.slice(-800); // 保留最近的800条
      }

      console.log(`[MemoryStrategy] Saved memory: ${content.substring(0, 50)}...`);
    } catch (error) {
      console.error('[MemoryStrategy] Failed to save memory:', error);
      throw error;
    }
  }

  /**
   * 搜索记忆
   * @param {string} query - 查询内容
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>} 搜索结果
   */
  async searchMemory(query, limit = 5) {
    if (!this.initialized) {
      throw new Error('Memory storage not initialized');
    }

    try {
      const queryVector = this.generateSimpleVector(query);
      
      // 计算相似度并排序
      const results = this.memories
        .map(memory => ({
          ...memory,
          score: this.calculateSimilarity(queryVector, memory.vector)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      console.log(`[MemoryStrategy] Found ${results.length} memories for query: ${query.substring(0, 30)}...`);
      return results;
    } catch (error) {
      console.error('[MemoryStrategy] Failed to search memory:', error);
      return [];
    }
  }

  /**
   * 获取最近的记忆
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>} 最近的记忆
   */
  async getRecentMemories(limit = 5) {
    if (!this.initialized) {
      throw new Error('Memory storage not initialized');
    }

    try {
      const recentMemories = this.memories
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);

      console.log(`[MemoryStrategy] Retrieved ${recentMemories.length} recent memories`);
      return recentMemories;
    } catch (error) {
      console.error('[MemoryStrategy] Failed to get recent memories:', error);
      return [];
    }
  }

  /**
   * 清除所有记忆
   * @returns {Promise<void>}
   */
  async clearAllMemories() {
    if (!this.initialized) {
      throw new Error('Memory storage not initialized');
    }

    try {
      this.memories = [];
      console.log('[MemoryStrategy] All memories cleared');
    } catch (error) {
      console.error('[MemoryStrategy] Failed to clear memories:', error);
      throw error;
    }
  }

  /**
   * 生成唯一ID
   * @private
   * @returns {string} 唯一ID
   */
  generateId() {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 生成简单的向量表示
   * @private
   * @param {string} text - 文本内容
   * @returns {Array<number>} 向量
   */
  generateSimpleVector(text) {
    // 简单的文本向量化：基于字符频率
    const vector = new Array(100).fill(0);
    const normalizedText = text.toLowerCase();
    
    for (let i = 0; i < normalizedText.length; i++) {
      const charCode = normalizedText.charCodeAt(i);
      const index = charCode % 100;
      vector[index] += 1;
    }
    
    // 归一化
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (magnitude > 0) {
      for (let i = 0; i < vector.length; i++) {
        vector[i] /= magnitude;
      }
    }
    
    return vector;
  }

  /**
   * 计算向量相似度
   * @private
   * @param {Array<number>} vector1 - 向量1
   * @param {Array<number>} vector2 - 向量2
   * @returns {number} 相似度分数
   */
  calculateSimilarity(vector1, vector2) {
    if (vector1.length !== vector2.length) {
      return 0;
    }
    
    let dotProduct = 0;
    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
    }
    
    return Math.max(0, dotProduct); // 确保非负
  }

  /**
   * 获取存储统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      totalMemories: this.memories.length,
      initialized: this.initialized,
      storageType: 'memory'
    };
  }
}
