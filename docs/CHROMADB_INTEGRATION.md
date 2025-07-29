# ChromaDB 集成指南

本文档说明了AI Companion项目中ChromaDB的集成和使用方法。

## 🎯 概述

AI Companion现在完全使用ChromaDB作为主要的向量数据库，提供持久化的记忆存储功能。系统会自动启动ChromaDB服务，并在项目数据目录中持久化存储对话记忆。

## 🔧 主要特性

- **自动服务管理**: 应用启动时自动启动ChromaDB服务
- **持久化存储**: 对话数据保存在本地`data/chroma`目录
- **智能降级**: ChromaDB不可用时自动降级到内存存储
- **优雅关闭**: 应用退出时自动停止ChromaDB服务
- **完全移除Qdrant**: 简化架构，专注于ChromaDB

## 📦 安装和设置

### 1. 检查Python环境

ChromaDB需要Python 3.8+环境：

```bash
# Windows
python --version

# macOS/Linux
python3 --version
```

### 2. 安装ChromaDB

使用我们提供的设置脚本：

```bash
npm run setup-chromadb
```

或手动安装：

```bash
pip install chromadb
```

### 3. 启动应用

```bash
# 普通启动（会自动尝试启动ChromaDB）
npm start

# 或者先设置ChromaDB再启动
npm run start-with-chromadb
```

## 🏗️ 架构设计

### ChromaDB服务管理

```
MemoryService
    ↓
ChromaService (自动启动/停止ChromaDB)
    ↓
ChromaDBStrategy (持久化存储)
    ↓
本地数据目录: data/chroma/
```

### 自动降级机制

```
1. 尝试启动ChromaDB服务
   ↓ (失败)
2. 降级到内存存储
   ↓
3. 应用正常运行
```

## 📁 数据存储

### 存储位置
- **数据目录**: `./data/chroma/`
- **集合名称**: `ai_companion_memory`
- **数据格式**: 向量化的对话内容 + 元数据

### 数据结构
```javascript
{
  id: "memory_timestamp_randomid",
  content: "对话内容",
  metadata: {
    role: "user|assistant",
    timestamp: "2024-01-01T00:00:00.000Z"
  }
}
```

## 🔄 服务生命周期

### 启动流程
1. **MemoryService.initializeMemoryManager()**
2. **ChromaService.startChromaDB()** - 启动ChromaDB服务
3. **ChromaDBStrategy.initialize()** - 连接并创建集合
4. **应用就绪** - 开始接收和存储对话

### 关闭流程
1. **应用退出信号**
2. **MemoryService.stopService()** - 停止内存服务
3. **ChromaService.stopChromaDB()** - 优雅关闭ChromaDB
4. **清理完成**

## 🛠️ 开发和调试

### 查看ChromaDB状态

```javascript
// 在主进程中
const status = memoryService.getServiceStatus();
console.log(status);
```

### 手动管理ChromaDB

```javascript
// 启动ChromaDB
await chromaService.startChromaDB();

// 检查状态
const isRunning = await chromaService.isChromaDBRunning();

// 停止ChromaDB
await chromaService.stopChromaDB();
```

### 日志监控

系统提供详细的结构化日志：

```
[ChromaService] Starting ChromaDB service...
[ChromaDBStrategy] ChromaDB connection established successfully
[MemoryService] Successfully initialized with ChromaDB strategy
```

## 📊 性能和配置

### ChromaDB配置

- **端口**: 8000 (默认)
- **主机**: localhost
- **数据路径**: `./data/chroma`
- **超时**: 30秒启动超时

### 性能优化

- **批量操作**: 支持批量保存和查询
- **向量搜索**: 自动向量化和相似度搜索
- **内存管理**: 自动清理和优化

## 🔍 故障排除

### 常见问题

**Q: ChromaDB启动失败**
```
[ERROR] ChromaDB failed to start within timeout
```
**A**: 检查Python环境和ChromaDB安装，系统会自动降级到内存存储

**Q: 数据目录权限错误**
```
[ERROR] Cannot create ChromaDB data directory
```
**A**: 确保应用有写入`./data/chroma`目录的权限

**Q: 端口冲突**
```
[ERROR] Address already in use
```
**A**: 修改`ChromaService`中的端口配置或停止占用8000端口的其他服务

### 调试模式

启用详细日志：

```bash
npm run dev
```

## 🔄 迁移指南

### 从Qdrant迁移

1. **数据备份**: 如果有Qdrant数据，请先备份
2. **清理依赖**: 移除Qdrant相关配置
3. **安装ChromaDB**: 按照上述步骤安装
4. **重新启动**: 使用新的ChromaDB系统

### 数据格式兼容性

新的ChromaDB系统与之前的内存格式兼容，无需特殊迁移步骤。

## 📈 未来计划

- [ ] 支持分布式ChromaDB部署
- [ ] 添加数据备份和恢复功能
- [ ] 实现记忆数据的导入导出
- [ ] 支持多用户记忆隔离
- [ ] 添加记忆数据的可视化界面

## 🤝 贡献

如果您在使用ChromaDB集成时遇到问题或有改进建议，请：

1. 查看现有的GitHub Issues
2. 创建新的Issue描述问题
3. 提交Pull Request改进代码

---

**注意**: 这个集成确保了AI Companion的对话记忆能够持久化保存，即使重启应用也不会丢失历史对话数据。
