import { QdrantStrategy } from './strategies/QdrantStrategy.js';
import { ChromaDBStrategy } from './strategies/ChromaDBStrategy.js';

/**
 * 内存管理器工厂类
 * 负责创建和管理不同的内存管理策略
 */
export class MemoryManagerFactory {
  /**
   * 创建内存管理器实例
   * @param {string} strategy - 要使用的策略 ('qdrant', 'chromadb', 'fallback')
   * @returns {Promise<MemoryManager>}
   */
  static async createMemoryManager(strategy = 'qdrant') {
    let memoryManager;
    
    switch (strategy.toLowerCase()) {
      case 'qdrant':
        try {
          memoryManager = new QdrantStrategy();
          await memoryManager.initialize();
          console.log('[MemoryManagerFactory] Using Qdrant strategy');
          return memoryManager;
        } catch (error) {
          console.error('[MemoryManagerFactory] Failed to initialize Qdrant strategy:', error);
          console.log('[MemoryManagerFactory] Falling back to ChromaDB strategy');
          // 降级到ChromaDB
          return await this.createMemoryManager('chromadb');
        }
        
      case 'chromadb':
        try {
          memoryManager = new ChromaDBStrategy();
          await memoryManager.initialize();
          console.log('[MemoryManagerFactory] Using ChromaDB strategy');
          return memoryManager;
        } catch (error) {
          console.error('[MemoryManagerFactory] Failed to initialize ChromaDB strategy:', error);
          console.log('[MemoryManagerFactory] Falling back to in-memory strategy');
          // 降级到内存存储
          return await this.createMemoryManager('fallback');
        }
        
      case 'fallback':
      default:
        // 创建一个使用内存存储的简单实现
        console.log('[MemoryManagerFactory] Using fallback in-memory strategy');
        return this.createFallbackMemoryManager();
    }
  }
  
  /**
   * 创建降级的内存管理器（纯内存存储）
   * @returns {Object} 内存管理器对象
   */
  static createFallbackMemoryManager() {
    const storage = [];
    
    return {
      initialized: true,
      
      async saveMemory(content, metadata = {}) {
        const memory = {
          id: Date.now().toString(),
          content: content,
          metadata: metadata,
          timestamp: new Date().toISOString()
        };
        
        storage.push(memory);
        
        // 保持存储大小在合理范围内
        if (storage.length > 100) {
          storage.splice(0, storage.length - 100);
        }
        
        console.log('[FallbackMemoryManager] Memory saved to storage:', memory);
      },
      
      async searchMemory(query, limit = 5) {
        // 简单的文本匹配搜索
        const results = storage
          .filter(item => item.content.includes(query))
          .slice(0, limit)
          .map(item => ({
            id: item.id,
            payload: {
              content: item.content,
              metadata: item.metadata
            }
          }));
          
        console.log('[FallbackMemoryManager] Memory search results:', results);
        return results;
      },
      
      async getRecentMemories(limit = 10) {
        const recent = [...storage]
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .slice(0, limit)
          .map(item => ({
            id: item.id,
            payload: {
              content: item.content,
              metadata: item.metadata
            }
          }));
          
        console.log('[FallbackMemoryManager] Recent memories:', recent);
        return recent;
      },
      
      async getAllMemories() {
        const all = storage.map(item => ({
          id: item.id,
          payload: {
            content: item.content,
            metadata: item.metadata
          }
        }));
        
        console.log('[FallbackMemoryManager] All memories:', all);
        return all;
      }
    };
  }
}