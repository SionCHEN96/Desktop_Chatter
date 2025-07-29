import { MemoryManager } from '../MemoryManager.js';
import { ChromaClient } from 'chromadb';
import { DefaultEmbeddingFunction } from '@chroma-core/default-embed';

/**
 * ChromaDB内存管理策略
 * 使用ChromaDB向量数据库进行记忆存储和检索
 */
export class ChromaDBStrategy extends MemoryManager {
  constructor() {
    super();
    this.client = null;
    this.collection = null;
    this.initialized = false;
  }

  /**
   * 初始化ChromaDB客户端
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // 首先尝试连接到本地运行的ChromaDB服务
      this.client = new ChromaClient({
        baseUrl: "http://localhost:8000"
      });
      
      // 测试连接
      await this.client.heartbeat();
      
      // 创建或获取集合
      this.collection = await this.client.getOrCreateCollection({
        name: "ai_memory"
      });
      
      this.initialized = true;
      console.log('[ChromaDBStrategy] ChromaDB initialized successfully with local server');
    } catch (error) {
      console.warn('[ChromaDBStrategy] Failed to connect to local ChromaDB server:', error);
      
      try {
        // 如果无法连接到本地服务，则尝试使用内存模式
        console.log('[ChromaDBStrategy] Falling back to in-memory mode');
        this.client = new ChromaClient();
        
        // 创建或获取集合
        this.collection = await this.client.getOrCreateCollection({
          name: "ai_memory"
        });
        
        this.initialized = true;
        console.log('[ChromaDBStrategy] ChromaDB initialized successfully in memory mode');
      } catch (fallbackError) {
        console.error('[ChromaDBStrategy] Failed to initialize ChromaDB:', fallbackError);
        console.log('[ChromaDBStrategy] Using fallback storage method');
        this.initialized = true; // 仍然标记为已初始化，使用降级存储
      }
    }
  }

  /**
   * 保存记忆到ChromaDB
   * @param {string} content - 记忆内容
   * @param {Object} metadata - 元数据
   * @returns {Promise<void>}
   */
  async saveMemory(content, metadata = {}) {
    if (!this.initialized) {
      console.warn('[ChromaDBStrategy] MemoryManager not initialized');
      return;
    }

    try {
      if (!this.collection) {
        // 使用降级存储
        const memory = {
          id: Date.now().toString(),
          content: content,
          metadata: metadata,
          timestamp: new Date().toISOString()
        };
        
        this.fallbackStorage.push(memory);
        
        // 保持存储大小在合理范围内
        if (this.fallbackStorage.length > 100) {
          this.fallbackStorage = this.fallbackStorage.slice(-100);
        }
        
        console.log('[ChromaDBStrategy] Memory saved to fallback storage:', memory);
        return;
      }

      // 保存记忆到 ChromaDB
      const ids = [Date.now().toString()];
      const embeddings = [this.generateSimpleVector(content)];
      const metadatas = [{
        ...metadata,
        timestamp: new Date().toISOString()
      }];
      const documents = [content];

      await this.collection.add({
        ids,
        embeddings,
        metadatas,
        documents
      });
      
      console.log('[ChromaDBStrategy] Memory saved:', { ids, documents, metadatas });
    } catch (error) {
      console.error('[ChromaDBStrategy] Failed to save memory:', error);
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
    if (!this.initialized) {
      console.warn('[ChromaDBStrategy] MemoryManager not initialized');
      return [];
    }

    try {
      if (!this.collection) {
        // 从降级存储中搜索
        console.log('[ChromaDBStrategy] Memory search results from fallback storage:', this.fallbackStorage);
        return this.fallbackStorage.slice(0, limit);
      }

      // 在 ChromaDB 中搜索
      const queryEmbedding = this.generateSimpleVector(query);
      const result = await this.collection.query({
        queryEmbeddings: queryEmbedding,
        nResults: limit
      });
      
      console.log('[ChromaDBStrategy] Memory search results:', result);
      
      // 格式化结果以匹配预期格式
      const formattedResults = [];
      if (result.ids && result.ids.length > 0) {
        for (let i = 0; i < result.ids[0].length; i++) {
          formattedResults.push({
            id: result.ids[0][i],
            payload: {
              content: result.documents[0][i],
              metadata: result.metadatas[0][i]
            }
          });
        }
      }
      
      return formattedResults;
    } catch (error) {
      console.error('[ChromaDBStrategy] Failed to search memory:', error);
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
      console.warn('[ChromaDBStrategy] MemoryManager not initialized');
      return [];
    }

    try {
      if (!this.collection) {
        // 从降级存储中获取最近的记忆
        const recent = [...this.fallbackStorage].reverse().slice(0, limit);
        console.log('[ChromaDBStrategy] Recent memories from fallback storage:', recent);
        return recent;
      }

      // 在 ChromaDB 中获取所有记忆并排序
      const result = await this.collection.get({
        limit: limit
      });
      
      console.log('[ChromaDBStrategy] Recent memories:', result);
      
      // 格式化结果以匹配预期格式
      const formattedResults = [];
      if (result.ids) {
        for (let i = 0; i < result.ids.length; i++) {
          formattedResults.push({
            id: result.ids[i],
            payload: {
              content: result.documents[i],
              metadata: result.metadatas[i]
            }
          });
        }
      }
      
      return formattedResults;
    } catch (error) {
      console.error('[ChromaDBStrategy] Failed to get recent memories:', error);
      throw error;
    }
  }

  /**
   * 获取所有记忆
   * @returns {Promise<Array>}
   */
  async getAllMemories() {
    if (!this.initialized) {
      console.warn('[ChromaDBStrategy] MemoryManager not initialized');
      return [];
    }

    try {
      if (!this.collection) {
        // 从降级存储中获取所有记忆
        console.log('[ChromaDBStrategy] All memories from fallback storage:', this.fallbackStorage);
        return this.fallbackStorage;
      }

      // 获取所有记忆
      const result = await this.collection.get();
      
      console.log('[ChromaDBStrategy] All memories:', result);
      
      // 格式化结果以匹配预期格式
      const formattedResults = [];
      if (result.ids) {
        for (let i = 0; i < result.ids.length; i++) {
          formattedResults.push({
            id: result.ids[i],
            payload: {
              content: result.documents[i],
              metadata: result.metadatas[i]
            }
          });
        }
      }
      
      return formattedResults;
    } catch (error) {
      console.error('[ChromaDBStrategy] Failed to get all memories:', error);
      throw error;
    }
  }
}