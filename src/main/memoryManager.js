import { ChromaClient } from 'chromadb';
import { app } from 'electron';

class MemoryManager {
  constructor() {
    this.client = null;
    this.collection = null;
    this.initialized = false;
    // 降级存储方案
    this.fallbackStorage = [];
  }

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
      console.log('[MemoryManager] ChromaDB initialized successfully with local server');
    } catch (error) {
      console.warn('[MemoryManager] Failed to connect to local ChromaDB server:', error);
      
      try {
        // 如果无法连接到本地服务，则尝试使用内存模式
        console.log('[MemoryManager] Falling back to in-memory mode');
        this.client = new ChromaClient();
        
        // 创建或获取集合
        this.collection = await this.client.getOrCreateCollection({
          name: "ai_memory"
        });
        
        this.initialized = true;
        console.log('[MemoryManager] ChromaDB initialized successfully in memory mode');
      } catch (fallbackError) {
        console.error('[MemoryManager] Failed to initialize ChromaDB:', fallbackError);
        console.log('[MemoryManager] Using fallback storage method');
        this.initialized = true; // 仍然标记为已初始化，使用降级存储
      }
    }
  }

  async saveMemory(content, metadata = {}) {
    if (!this.initialized) {
      console.warn('[MemoryManager] MemoryManager not initialized');
      return;
    }

    try {
      // 如果ChromaDB不可用，使用降级存储
      if (!this.collection) {
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
        
        console.log('[MemoryManager] Memory saved to fallback storage:', memory);
        return;
      }

      // 保存记忆到 ChromaDB
      const id = Date.now().toString();
      await this.collection.add({
        ids: [id],
        documents: [content],
        metadatas: [metadata]
      });
      
      console.log('[MemoryManager] Memory saved:', { id, content, metadata });
    } catch (error) {
      console.error('[MemoryManager] Failed to save memory:', error);
    }
  }

  async searchMemory(query, nResults = 5) {
    if (!this.initialized) {
      console.warn('[MemoryManager] MemoryManager not initialized');
      return [];
    }

    try {
      // 如果ChromaDB不可用，使用降级搜索
      if (!this.collection) {
        // 在降级存储中进行简单文本搜索
        const results = this.fallbackStorage
          .filter(item => item.content.includes(query))
          .slice(-nResults)
          .reverse();
        
        console.log('[MemoryManager] Memory search results from fallback storage:', results);
        return {
          ids: results.map(r => r.id),
          documents: results.map(r => r.content),
          metadatas: results.map(r => r.metadata)
        };
      }

      // 搜索相关记忆
      const results = await this.collection.query({
        queryTexts: [query],
        nResults: nResults
      });
      
      console.log('[MemoryManager] Memory search results:', results);
      return results;
    } catch (error) {
      console.error('[MemoryManager] Failed to search memory:', error);
      return [];
    }
  }

  async getRecentMemories(limit = 10) {
    if (!this.initialized) {
      console.warn('[MemoryManager] MemoryManager not initialized');
      return [];
    }

    try {
      // 如果ChromaDB不可用，使用降级方法
      if (!this.collection) {
        const results = this.fallbackStorage.slice(-limit).reverse();
        return {
          ids: results.map(r => r.id),
          documents: results.map(r => r.content),
          metadatas: results.map(r => r.metadata)
        };
      }

      // 获取最近的记忆
      const results = await this.collection.get({
        limit: limit,
        order: "desc"
      });
      
      return results;
    } catch (error) {
      console.error('[MemoryManager] Failed to get recent memories:', error);
      return [];
    }
  }
  
  async getAllMemories() {
    if (!this.initialized) {
      console.warn('[MemoryManager] MemoryManager not initialized');
      return [];
    }

    try {
      // 如果ChromaDB不可用，使用降级方法
      if (!this.collection) {
        const results = [...this.fallbackStorage].reverse();
        return {
          ids: results.map(r => r.id),
          documents: results.map(r => r.content),
          metadatas: results.map(r => r.metadata)
        };
      }

      // 获取所有记忆
      const results = await this.collection.get({
        limit: 100
      });
      
      return results;
    } catch (error) {
      console.error('[MemoryManager] Failed to get all memories:', error);
      return [];
    }
  }
}

export default MemoryManager;