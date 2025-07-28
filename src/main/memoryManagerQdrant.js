import { app } from 'electron';
import { join } from 'path';

class MemoryManagerQdrant {
  constructor() {
    this.client = null;
    this.initialized = false;
    // 降级存储方案
    this.fallbackStorage = [];
  }

  async initialize() {
    try {
      // 动态导入Qdrant客户端
      const { QdrantClient } = await import('@qdrant/js-client-rest');
      
      // 初始化 Qdrant 客户端，连接到本地服务
      this.client = new QdrantClient({ 
        host: 'localhost', 
        port: 6333 
      });
      
      // 测试连接 - 使用更简单的方法
      const collections = await this.client.getCollections();
      console.log('[MemoryManagerQdrant] Qdrant connection successful');
      
      // 检查集合是否存在，如果不存在则创建
      let collectionExists = false;
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
      console.log('[MemoryManagerQdrant] Qdrant initialized successfully');
    } catch (error) {
      // 检查是否是连接错误
      if (error.cause && error.cause.code === 'ECONNREFUSED') {
        console.log('[MemoryManagerQdrant] Qdrant service not available, using fallback storage method');
      } else {
        console.error('[MemoryManagerQdrant] Failed to initialize Qdrant:', error);
      }
      console.log('[MemoryManagerQdrant] Using fallback storage method');
      this.initialized = true; // 仍然标记为已初始化，使用降级存储
    }
  }

  async saveMemory(content, metadata = {}) {
    if (!this.initialized) {
      console.warn('[MemoryManagerQdrant] MemoryManager not initialized');
      return;
    }

    try {
      // 如果Qdrant不可用，使用降级存储
      if (!this.client) {
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
        
        console.log('[MemoryManagerQdrant] Memory saved to fallback storage:', memory);
        return;
      }

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
      
      console.log('[MemoryManagerQdrant] Memory saved:', { id, content, metadata });
    } catch (error) {
      console.error('[MemoryManagerQdrant] Failed to save memory to Qdrant, using fallback storage:', error);
      // 如果Qdrant保存失败，使用降级存储
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
      
      console.log('[MemoryManagerQdrant] Memory saved to fallback storage:', memory);
    }
  }

  async searchMemory(query, nResults = 5) {
    if (!this.initialized) {
      console.warn('[MemoryManagerQdrant] MemoryManager not initialized');
      return [];
    }

    try {
      // 如果Qdrant不可用，使用降级搜索
      if (!this.client) {
        // 在降级存储中进行简单文本搜索
        const results = this.fallbackStorage
          .filter(item => item.content.includes(query))
          .slice(-nResults)
          .reverse();
        
        console.log('[MemoryManagerQdrant] Memory search results from fallback storage:', results);
        return {
          points: results.map(r => ({
            id: r.id,
            payload: {
              content: r.content,
              metadata: r.metadata
            }
          }))
        };
      }

      // 搜索相关记忆
      const queryVector = this.generateSimpleVector(query);
      const results = await this.client.query('ai_memory', {
        query: queryVector,
        limit: nResults,
        with_payload: true
      });
      
      console.log('[MemoryManagerQdrant] Memory search results:', results);
      return results;
    } catch (error) {
      console.error('[MemoryManagerQdrant] Failed to search memory in Qdrant, using fallback storage:', error);
      // 如果Qdrant搜索失败，使用降级存储
      const results = this.fallbackStorage
        .filter(item => item.content.includes(query))
        .slice(-nResults)
        .reverse();
      
      return {
        points: results.map(r => ({
          id: r.id,
          payload: {
            content: r.content,
            metadata: r.metadata
          }
        }))
      };
    }
  }

  async getRecentMemories(limit = 10) {
    if (!this.initialized) {
      console.warn('[MemoryManagerQdrant] MemoryManager not initialized');
      return [];
    }

    try {
      // 如果Qdrant不可用，使用降级方法
      if (!this.client) {
        const results = this.fallbackStorage.slice(-limit).reverse();
        return {
          points: results.map(r => ({
            id: r.id,
            payload: {
              content: r.content,
              metadata: r.metadata
            }
          }))
        };
      }

      // 获取最近的记忆 (Qdrant不直接支持按时间排序，需要在payload中过滤)
      const results = await this.client.scroll('ai_memory', {
        limit: limit,
        with_payload: true
      });
      
      return results;
    } catch (error) {
      console.error('[MemoryManagerQdrant] Failed to get recent memories from Qdrant, using fallback storage:', error);
      // 如果Qdrant获取失败，使用降级存储
      const results = this.fallbackStorage.slice(-limit).reverse();
      return {
        points: results.map(r => ({
          id: r.id,
          payload: {
            content: r.content,
            metadata: r.metadata
          }
        }))
      };
    }
  }
  
  // 生成简单的向量表示（在实际应用中，你可能想要使用更复杂的嵌入模型）
  generateSimpleVector(text) {
    // 创建一个简单的基于文本的"嵌入"向量
    const vector = new Array(128).fill(0);
    for (let i = 0; i < text.length && i < vector.length; i++) {
      vector[i] = text.charCodeAt(i) / 255;
    }
    return vector;
  }
  
  // 获取所有记忆（用于调试和查看）
  async getAllMemories() {
    if (!this.initialized) {
      console.warn('[MemoryManagerQdrant] MemoryManager not initialized');
      return [];
    }

    try {
      // 如果Qdrant不可用，使用降级方法
      if (!this.client) {
        const results = [...this.fallbackStorage].reverse();
        return {
          points: results.map(r => ({
            id: r.id,
            payload: {
              content: r.content,
              metadata: r.metadata
            }
          }))
        };
      }

      // 获取所有记忆
      const results = await this.client.scroll('ai_memory', {
        with_payload: true
      });
      
      return results;
    } catch (error) {
      console.error('[MemoryManagerQdrant] Failed to get all memories from Qdrant, using fallback storage:', error);
      // 如果Qdrant获取失败，使用降级存储
      const results = [...this.fallbackStorage].reverse();
      return {
        points: results.map(r => ({
          id: r.id,
          payload: {
            content: r.content,
            metadata: r.metadata
          }
        }))
      };
    }
  }
}

export default MemoryManagerQdrant;