# 更新日志

本文档记录了AI Companion项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
并且本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.2.0] - 2024-01-XX

### 🧹 项目整理和优化

#### 数据库策略统一
- **ChromaDB为主**: 确认ChromaDB作为主要向量数据库
- **移除Qdrant依赖**: 删除所有Qdrant相关脚本和配置
- **简化配置**: 统一内存管理配置，简化降级策略

#### 文件清理
- **删除测试文件**: 移除临时的HTML测试页面
- **删除重复文档**: 清理过时的实现文档
- **更新依赖**: 移除不必要的Qdrant相关包

#### 文档更新
- **README.md**: 更新安装说明和技术栈信息
- **ARCHITECTURE.md**: 统一架构文档中的数据库引用
- **ChromaDB集成**: 完善ChromaDB使用指南

### 🔧 改进
- **package.json**: 简化脚本，专注ChromaDB集成
- **配置统一**: 所有配置文件统一使用ChromaDB
- **错误处理**: 优化ChromaDB连接失败时的降级逻辑

## [1.1.0] - 2024-01-XX

### 🎉 重大更新 - 项目结构全面优化

这是一个重要的结构优化版本，重构了整个项目架构，提升了代码质量和可维护性。

### ✨ 新增功能

#### 服务化架构
- **AIService**: 独立的AI处理服务，支持智能错误处理和自动重试
- **WindowService**: 专门的窗口管理服务，支持完整的窗口控制
- **IPCService**: 统一的IPC通信服务，自动事件管理和清理
- **MemoryService**: 内存管理服务，支持自动降级策略

#### 组件化UI系统
- **MessageManager**: 专业的消息管理组件，支持多种消息类型
- **InputManager**: 智能输入管理，支持历史记录和输入验证
- **优化的ChatContainer**: 整合消息和输入管理的聊天容器

#### 工具系统
- **结构化日志系统**: 支持分级日志、颜色编码和上下文信息
- **统一错误处理**: 完整的错误分类、自动恢复和用户友好消息
- **类型定义系统**: 完善的JSDoc类型定义，提升IDE支持

#### 配置管理
- **模块化配置**: 按功能分离的配置文件（AI、UI、动画）
- **主题系统**: 完整的UI主题配置支持
- **配置验证**: 自动配置验证和默认值处理

### 🔧 改进优化

#### 代码质量
- 统一文件命名规范，修复大小写不一致问题
- 完善的JSDoc文档，提升代码可读性
- 模块化导入导出，简化依赖关系
- 统一的错误处理和日志记录

#### 架构优化
- 服务化主进程架构，提升可维护性
- 组件化渲染进程，提高复用性
- 统一的模块导出机制，简化导入路径
- 完整的类型定义系统

#### 性能提升
- 智能内存管理，支持自动降级
- 优化的错误处理，减少崩溃风险
- 改进的日志系统，降低性能影响
- 更好的资源管理和清理

#### 开发体验
- 简化的模块导入路径
- 更好的IDE支持和代码提示
- 完整的开发文档和API说明
- 标准化的代码规范

### 📁 文件结构变更

#### 新增文件
```
src/
├── config/
│   ├── aiConfig.js          # AI配置模块
│   ├── uiConfig.js          # UI配置模块
│   └── appConfig.js         # 重构的应用配置
├── main/services/           # 新增服务目录
│   ├── aiService.js         # AI服务
│   ├── windowService.js     # 窗口服务
│   ├── ipcService.js        # IPC服务
│   ├── memoryService.js     # 内存服务
│   └── index.js             # 服务统一导出
├── renderer/components/     # 重构的组件目录
│   ├── MessageManager.js    # 消息管理组件
│   ├── InputManager.js      # 输入管理组件
│   └── ChatContainer.js     # 重构的聊天容器
├── utils/                   # 新增工具目录
│   ├── logger.js            # 日志系统
│   ├── errorHandler.js      # 错误处理
│   └── index.js             # 工具统一导出
├── types/                   # 新增类型定义
│   └── index.js             # 类型定义文件
└── index.js                 # 根级统一导出
```

#### 重构文件
- `src/main/main.js`: 重构为服务化架构
- `src/renderer/components/ChatContainer.js`: 使用新的管理器组件
- `src/config/index.js`: 更新为模块化配置导出
- `src/core/animation/AnimationStateMachine.js`: 添加完整JSDoc文档

### 📚 文档更新

#### 新增文档
- `OPTIMIZATION_SUMMARY.md`: 详细的优化总结文档
- `docs/API.md`: 完整的API文档
- `docs/DEVELOPMENT.md`: 开发指南和最佳实践
- `CHANGELOG.md`: 版本更新日志

#### 更新文档
- `README.md`: 全面更新，反映新架构
- `ARCHITECTURE.md`: 更新架构说明，添加服务化设计

### 🔄 迁移指南

#### 导入路径更新
```javascript
// 旧的导入方式
import { AnimationStateMachine } from '../core/animation/AnimationStateMachine.js';

// 新的推荐方式
import { AnimationStateMachine } from '../core/index.js';
// 或者
import { AnimationStateMachine } from '../src/index.js';
```

#### 服务使用更新
```javascript
// 旧的直接调用方式
const response = await getAIResponse(message);

// 新的服务化方式
const aiService = new AIService(memoryManager);
const response = await aiService.getAIResponse(message);
```

#### 错误处理更新
```javascript
// 旧的错误处理
console.error('Error:', error);

// 新的统一错误处理
import { handleError } from '../utils/index.js';
await handleError(error, { module: 'ModuleName' });
```

### ⚠️ 破坏性变更

1. **文件导入路径**: 部分深层导入路径已更改，建议使用统一导出
2. **主进程架构**: main.js重构为服务化架构，直接调用方式已废弃
3. **配置文件**: 配置项重新组织，部分配置路径可能需要更新

### 🐛 修复问题

- 修复文件命名大小写不一致导致的导入错误
- 修复内存管理器初始化失败时的崩溃问题
- 修复动画状态机的状态转换异常
- 修复IPC通信的内存泄漏问题

### 🔮 下一版本计划

- [ ] 添加单元测试覆盖
- [ ] 实现配置热更新
- [ ] 添加性能监控
- [ ] 支持插件系统
- [ ] 国际化支持

---

## [1.0.0] - 2024-01-XX

### ✨ 初始版本

#### 核心功能
- 基于Electron的桌面应用框架
- 3D虚拟角色系统（Three.js + VRM）
- AI对话系统（LM Studio集成）
- 向量数据库记忆管理（Qdrant）
- 动画状态机系统

#### 主要特性
- 🎭 3D虚拟角色交互
- 💬 自然语言对话
- 🧠 智能记忆管理
- 🎬 动画状态控制
- 🖥️ 跨平台桌面应用

#### 技术栈
- Electron 25.2.0
- Three.js 0.153.0
- @pixiv/three-vrm 3.4.2
- Qdrant向量数据库
- LM Studio API集成

---

## 版本说明

### 版本号规则
- **主版本号**: 不兼容的API修改
- **次版本号**: 向下兼容的功能性新增
- **修订号**: 向下兼容的问题修正

### 更新类型
- 🎉 **重大更新**: 架构级别的重要变更
- ✨ **新增功能**: 新功能和特性
- 🔧 **改进优化**: 性能和体验优化
- 🐛 **修复问题**: Bug修复
- 📚 **文档更新**: 文档和说明更新
- ⚠️ **破坏性变更**: 不向下兼容的变更
