/**
 * 内存管理器基类
 * 定义所有内存管理策略都应该实现的接口
 */
export class MemoryManager {
  constructor() {
    this.fallbackStorage = [];
  }

  /**
   * 初始化内存管理器
   * @returns {Promise<void>}
   */
  async initialize() {
    throw new Error('initialize method must be implemented by subclass');
  }

  /**
   * 保存记忆
   * @param {string} content - 记忆内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<void>}
   */
  async saveMemory(content, metadata = {}) {
    throw new Error('saveMemory method must be implemented by subclass');
  }

  /**
   * 搜索记忆
   * @param {string} query - 查询内容
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>}
   */
  async searchMemory(query, limit = 5) {
    throw new Error('searchMemory method must be implemented by subclass');
  }

  /**
   * 获取最近的记忆
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>}
   */
  async getRecentMemories(limit = 10) {
    throw new Error('getRecentMemories method must be implemented by subclass');
  }

  /**
   * 获取所有记忆
   * @returns {Promise<Array>}
   */
  async getAllMemories() {
    throw new Error('getAllMemories method must be implemented by subclass');
  }

  /**
   * 生成简单的向量表示（用于没有向量数据库的情况）
   * @param {string} content - 内容
   * @returns {Array<number>} 向量表示
   */
  generateSimpleVector(content) {
    // 简单的向量生成方法，将文本转换为数字数组
    const vector = new Array(128).fill(0);
    for (let i = 0; i < content.length && i < 128; i++) {
      vector[i] = content.charCodeAt(i) / 255;
    }
    return vector;
  }
}