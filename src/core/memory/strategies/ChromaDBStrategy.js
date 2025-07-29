import { MemoryManager } from '../MemoryManager.js';
import { ChromaClient } from 'chromadb';
import { createLogger } from '../../../utils/index.js';

const logger = createLogger('ChromaDBStrategy');

/**
 * ChromaDB内存管理策略
 * 使用ChromaDB向量数据库进行记忆存储和检索，支持持久化存储
 */
export class ChromaDBStrategy extends MemoryManager {
  constructor(connectionConfig = null) {
    super();
    this.client = null;
    this.collection = null;
    this.initialized = false;
    this.connectionConfig = connectionConfig || {
      baseUrl: "http://localhost:8000"
    };
  }

  /**
   * 初始化ChromaDB客户端
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      logger.info('Initializing ChromaDB client', this.connectionConfig);

      // 连接到ChromaDB服务
      this.client = new ChromaClient(this.connectionConfig);

      // 测试连接
      await this.client.heartbeat();
      logger.info('ChromaDB connection established successfully');

      // 创建或获取集合，使用持久化存储和自定义嵌入函数
      this.collection = await this.client.getOrCreateCollection({
        name: "ai_companion_memory",
        metadata: {
          description: "AI Companion persistent memory storage",
          created_at: new Date().toISOString()
        },
        embeddingFunction: {
          generate: async (texts) => {
            // 简单的文本向量化：使用字符编码作为向量
            return texts.map(text => {
              const vector = new Array(384).fill(0); // 384维向量
              for (let i = 0; i < Math.min(text.length, 384); i++) {
                vector[i] = text.charCodeAt(i) / 255; // 归一化到0-1
              }
              return vector;
            });
          }
        }
      });

      this.initialized = true;
      logger.info('ChromaDB strategy initialized successfully', {
        collectionName: "ai_companion_memory",
        persistent: true
      });
    } catch (error) {
      logger.error('Failed to initialize ChromaDB strategy', error);
      throw error;
    }
  }

  /**
   * 保存记忆到ChromaDB
   * @param {string} content - 记忆内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<void>}
   */
  async saveMemory(content, metadata = {}) {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB strategy not initialized');
    }

    try {
      const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const timestamp = new Date().toISOString();

      // 准备文档数据
      const document = content;
      const metadataWithTimestamp = {
        ...metadata,
        timestamp,
        role: metadata.role || 'unknown'
      };

      // 保存到ChromaDB
      await this.collection.add({
        ids: [id],
        documents: [document],
        metadatas: [metadataWithTimestamp]
      });

      logger.info('Memory saved successfully', {
        id,
        contentLength: content.length,
        metadata: metadataWithTimestamp
      });
    } catch (error) {
      logger.error('Failed to save memory to ChromaDB', error);
      throw error;
    }
  }

  /**
   * 在ChromaDB中搜索记忆
   * @param {string} query - 查询内容
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>}
   */
  async searchMemory(query, limit = 5) {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB strategy not initialized');
    }

    try {
      // 使用ChromaDB的查询功能
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: limit
      });

      // 转换结果格式
      const memories = [];
      if (results.ids && results.ids[0]) {
        for (let i = 0; i < results.ids[0].length; i++) {
          memories.push({
            id: results.ids[0][i],
            content: results.documents[0][i],
            metadata: results.metadatas[0][i],
            distance: results.distances[0][i]
          });
        }
      }

      logger.info('Memory search completed', {
        query: query.substring(0, 50),
        resultsCount: memories.length
      });

      return memories;
    } catch (error) {
      logger.error('Failed to search memory in ChromaDB', error);
      throw error;
    }
  }

  /**
   * 获取最近的记忆
   * @param {number} limit - 返回结果数量限制
   * @returns {Promise<Array>}
   */
  async getRecentMemories(limit = 10) {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB strategy not initialized');
    }

    try {
      // 获取所有记忆
      const result = await this.collection.get({
        limit: limit
      });

      // 转换结果格式并按时间戳排序
      const memories = [];
      if (result.ids) {
        for (let i = 0; i < result.ids.length; i++) {
          memories.push({
            id: result.ids[i],
            content: result.documents[i],
            metadata: result.metadatas[i]
          });
        }
      }

      // 按时间戳降序排序（最新的在前）
      memories.sort((a, b) => {
        const timeA = new Date(a.metadata?.timestamp || 0);
        const timeB = new Date(b.metadata?.timestamp || 0);
        return timeB - timeA;
      });

      logger.info('Recent memories retrieved', {
        count: memories.length,
        limit
      });

      return memories.slice(0, limit);
    } catch (error) {
      logger.error('Failed to get recent memories from ChromaDB', error);
      throw error;
    }
  }

  /**
   * 清除所有记忆
   * @returns {Promise<void>}
   */
  async clearAllMemories() {
    if (!this.initialized || !this.collection) {
      throw new Error('ChromaDB strategy not initialized');
    }

    try {
      // 删除集合中的所有数据
      await this.collection.delete();

      logger.info('All memories cleared from ChromaDB');
    } catch (error) {
      logger.error('Failed to clear memories from ChromaDB', error);
      throw error;
    }
  }

  /**
   * 获取存储统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStats() {
    if (!this.initialized || !this.collection) {
      return {
        initialized: false,
        storageType: 'chromadb',
        totalMemories: 0
      };
    }

    try {
      const result = await this.collection.count();

      return {
        initialized: true,
        storageType: 'chromadb',
        totalMemories: result,
        collectionName: 'ai_companion_memory'
      };
    } catch (error) {
      logger.error('Failed to get ChromaDB stats', error);
      return {
        initialized: true,
        storageType: 'chromadb',
        totalMemories: 'unknown',
        error: error.message
      };
    }
  }
}