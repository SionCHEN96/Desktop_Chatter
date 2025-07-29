import { MemoryManager } from '../MemoryManager.js';

/**
 * Qdrant内存管理策略
 * 使用Qdrant向量数据库进行记忆存储和检索
 */
export class QdrantStrategy extends MemoryManager {
  constructor() {
    super();
    this.client = null;
    this.initialized = false;
    // 添加连接重试计数器
    this.retryCount = 0;
    this.maxRetries = 3;
  }

  /**
   * 初始化Qdrant客户端
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // 动态导入Qdrant客户端
      const { QdrantClient } = await import('@qdrant/js-client-rest');
      
      // 初始化 Qdrant 客户端，连接到本地服务
      this.client = new QdrantClient({ 
        host: 'localhost', 
        port: 6333,
        timeout: 5000, // 添加超时设置
        checkCompatibility: false // 跳过版本兼容性检查以避免错误
      });
      
      // 测试连接 - 使用更简单的方法
      const collections = await this.client.getCollections();
      console.log('[QdrantStrategy] Qdrant connection successful');
      
      // 检查集合是否存在，如果不存在则创建
      let collectionExists = false;
      
      // 获取所有集合并检查是否存在ai_memory
      for (const collection of collections.collections) {
        if (collection.name === 'ai_memory') {
          collectionExists = true;
          break;
        }
      }
      
      if (!collectionExists) {
        await this.client.createCollection('ai_memory', {
          vectors: { size: 128, distance: 'Cosine' }
        });
      }
      
      this.initialized = true;
      console.log('[QdrantStrategy] Qdrant initialized successfully');
    } catch (error) {
      console.error('[QdrantStrategy] Error during initialization:', error);
      throw error;
    }
  }

  /**
   * 保存记忆到Qdrant
   * @param {string} content - 记忆内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<void>}
   */
  async saveMemory(content, metadata = {}) {
    if (!this.initialized) {
      console.warn('[QdrantStrategy] MemoryManager not initialized');
      return;
    }

    try {
      // 保存记忆到 Qdrant
      const id = Date.now();
      const vector = this.generateSimpleVector(content);
      
      await this.client.upsert('ai_memory', {
        wait: true,
        points: [
          {
            id: id,
            vector: vector,
            payload: {
              content: content,
              metadata: metadata,
              timestamp: new Date().toISOString()
            }
          }
        ]
      });
      
      console.log('[QdrantStrategy] Memory saved:', { id, content, metadata });
    } catch (error) {
      console.error('[QdrantStrategy] Failed to save memory:', error);
      throw error;
    }
  }

  /**
   * 在Qdrant中搜索记忆
   * @param {string} query - 查询内容
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>}
   */
  async searchMemory(query, limit = 5) {
    if (!this.initialized) {
      console.warn('[QdrantStrategy] MemoryManager not initialized');
      return [];
    }

    try {
      const vector = this.generateSimpleVector(query);
      const result = await this.client.query('ai_memory', {
        query: vector,
        limit: limit,
        with_payload: true
      });
      
      console.log('[QdrantStrategy] Memory search results:', result);
      return result.points || [];
    } catch (error) {
      console.error('[QdrantStrategy] Failed to search memory:', error);
      throw error;
    }
  }

  /**
   * 获取最近的记忆
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>}
   */
  async getRecentMemories(limit = 10) {
    if (!this.initialized) {
      console.warn('[QdrantStrategy] MemoryManager not initialized');
      return [];
    }

    try {
      // 使用查询所有点并按ID排序的方式获取最近的记忆
      // 因为ID是时间戳，较大的ID表示较新的记录
      const result = await this.client.scroll('ai_memory', {
        limit: limit,
        with_payload: true
      });
      
      // 如果scroll操作成功，按ID降序排序（最新的在前）
      if (result.points && result.points.length > 0) {
        result.points.sort((a, b) => b.id - a.id);
      }
      
      console.log('[QdrantStrategy] Recent memories:', result);
      return result.points || [];
    } catch (error) {
      console.error('[QdrantStrategy] Failed to get recent memories:', error);
      // 降级到搜索所有记忆并按时间排序
      try {
        const allPoints = await this.client.scroll('ai_memory', {
          with_payload: true
        });
        
        if (allPoints.points && allPoints.points.length > 0) {
          // 按ID排序（最新的在前）
          const sortedPoints = allPoints.points.sort((a, b) => b.id - a.id);
          return sortedPoints.slice(0, limit);
        }
        return [];
      } catch (fallbackError) {
        console.error('[QdrantStrategy] Failed to get recent memories with fallback:', fallbackError);
        throw error;
      }
    }
  }

  /**
   * 获取所有记忆
   * @returns {Promise<Array>}
   */
  async getAllMemories() {
    if (!this.initialized) {
      console.warn('[QdrantStrategy] MemoryManager not initialized');
      return [];
    }

    try {
      const allMemories = [];
      let offset = null;
      const limit = 100;

      do {
        const result = await this.client.scroll('ai_memory', {
          limit: limit,
          offset: offset,
          with_payload: true
        });

        allMemories.push(...(result.points || []));
        offset = result.next_page_offset;
      } while (offset !== null);

      return allMemories;
    } catch (error) {
      console.error('[QdrantStrategy] Failed to get all memories:', error);
      throw error;
    }
  }
}