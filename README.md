# Desktop Chatter

一个基于Electron的桌面AI聊天助手应用程序，具有3D虚拟角色、自然语言交互、记忆管理和动画系统。

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![Electron](https://img.shields.io/badge/electron-25.2.0-blue)](https://electronjs.org/)

## 项目概述

Desktop Chatter是一个创新的桌面AI聊天助手应用程序，结合了3D虚拟角色、自然语言处理和向量数据库技术。该应用提供了一个具有情感表达和记忆能力的虚拟角色，可以与用户进行自然对话，并根据上下文提供个性化的响应。

### 🌟 核心特性

- 🎭 **3D虚拟角色**: 基于Three.js和VRM模型的可交互3D角色
- 💬 **自然语言交互**: 与LM Studio集成的AI对话系统
- 🧠 **智能记忆管理**: 使用ChromaDB向量数据库存储和检索对话历史
- 🎤 **AI语音合成**: 集成GPT-SoVITS，支持高质量多角色语音克隆
- 🎬 **动画状态机**: 支持多种角色动画状态（待机、思考、情感表达等）
- 🖥️ **跨平台桌面应用**: 基于Electron的现代桌面应用程序
- 🔧 **模块化架构**: 采用服务化设计，易于扩展和维护
- 📝 **结构化日志**: 完整的日志记录和错误处理系统
- ⚡ **高性能**: 优化的内存管理和渲染性能

### 🏗️ 架构特点

- **服务化架构**: 主进程采用模块化服务设计
- **组件化UI**: 渲染进程使用可复用组件架构
- **统一错误处理**: 完整的错误分类和恢复机制
- **类型安全**: 完善的JSDoc类型定义
- **配置驱动**: 灵活的配置管理系统

## 快速开始指南

### 系统要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本
- Python 3.8+ (用于ChromaDB)
- LM Studio (用于本地AI模型)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd desktop-chatter
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **设置ChromaDB**
   ```bash
   npm run setup-chromadb
   ```

4. **启动应用**
   ```bash
   npm start
   # 或者一步完成设置和启动
   npm run start-with-chromadb
   ```

### 🎤 GPT-SoVITS语音合成（可选）

如果您想使用AI语音合成功能：

1. **安装GPT-SoVITS**
   - 从 [GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS) 下载并安装
   - 按照官方文档配置环境

2. **启动GPT-SoVITS服务**
   ```bash
   # 在GPT-SoVITS目录中
   python api_v2.py -a 127.0.0.1 -p 9880
   ```

3. **启动测试服务器**
   ```bash
   # 在Desktop Chatter目录中
   npm run gpt-sovits-test
   ```

4. **访问测试页面**
   - 打开浏览器访问: http://localhost:3000/gpt-sovits-test.html
   - 测试语音合成功能

详细文档请参考: [GPT-SoVITS集成文档](docs/GPT-SOVITS-INTEGRATION.md)

### 📁 项目结构（简化版）

```
src/
├── config/                 # 📋 配置模块
│   ├── config.js           # 统一配置文件
│   └── index.js            # 配置导出
├── core/                   # 🔧 核心功能模块
│   ├── animation/          # 动画状态机系统
│   ├── character/          # 3D角色管理
│   ├── memory/             # 智能记忆管理
│   └── index.js            # 核心模块统一导出
├── main/                   # 🖥️ 主进程（服务化架构）
│   ├── services/           # 服务模块
│   │   ├── aiService.js    # AI处理服务
│   │   ├── windowService.js # 窗口管理服务
│   │   ├── ipcService.js   # IPC通信服务
│   │   ├── memoryService.js # 内存管理服务
│   │   ├── trayService.js  # 系统托盘服务
│   │   └── index.js        # 服务统一导出
│   ├── main.cjs            # 主进程入口（CommonJS）
│   └── main.js             # 主进程逻辑（ES Modules）
├── renderer/               # 🎨 渲染进程（组件化）
│   ├── components/         # UI组件
│   │   ├── App.js          # 应用根组件
│   │   ├── ChatContainer.js # 聊天容器组件
│   │   ├── MessageManager.js # 消息管理组件
│   │   ├── InputManager.js # 输入管理组件
│   │   ├── CharacterManager.js # 角色管理组件
│   │   ├── WindowControls.js # 窗口控制组件
│   │   └── index.js        # 组件统一导出
│   └── renderer.js         # 渲染进程入口
├── utils/                  # 🛠️ 工具模块
│   ├── logger.js           # 结构化日志系统
│   ├── errorHandler.js     # 统一错误处理
│   └── index.js            # 工具统一导出
├── types/                  # 📝 类型定义和接口
│   └── index.js            # 类型定义和服务接口
├── styles/                 # 🎨 全局样式文件
└── index.js                # 🚀 根级统一导出
```

### 🛠️ 开发指南

#### 代码规范

- **模块系统**: 使用ES6模块系统，支持统一导入导出
- **命名规范**:
  - 文件名使用PascalCase（如`MessageManager.js`）
  - 变量和函数使用camelCase
  - 常量使用UPPER_SNAKE_CASE
- **架构原则**:
  - 服务化设计，职责分离
  - 组件化开发，提高复用性
  - 统一错误处理和日志记录

#### 模块导入最佳实践

```javascript
// ✅ 推荐：使用统一导出
import { AIService, WindowService } from '../main/services/index.js';
import { MessageManager, InputManager } from '../renderer/components/index.js';
import { createLogger, handleError } from '../utils/index.js';

// ✅ 或者从根级导入
import { AnimationStateMachine, MemoryManager } from '../src/index.js';

// ❌ 避免：深层次导入
import { AIService } from '../main/services/aiService.js';
```

#### 添加新功能

1. **核心功能模块**
   ```bash
   # 在 src/core/ 下创建新模块
   mkdir src/core/newFeature
   touch src/core/newFeature/index.js
   ```

2. **服务模块**
   ```bash
   # 在 src/main/services/ 下创建新服务
   touch src/main/services/newService.js
   # 更新 src/main/services/index.js 导出
   ```

3. **UI组件**
   ```bash
   # 在 src/renderer/components/ 下创建新组件
   touch src/renderer/components/NewComponent.js
   # 更新 src/renderer/components/index.js 导出
   ```

#### 日志和错误处理

```javascript
// 创建模块专用日志器
import { createLogger, handleError, ErrorType } from '../utils/index.js';
const logger = createLogger('MyModule');

// 记录不同级别的日志
logger.info('操作成功', { userId: 123 });
logger.warn('警告信息', { context: 'additional info' });
logger.error('错误信息', error);

// 统一错误处理
try {
  // 可能出错的操作
} catch (error) {
  await handleError(error, { module: 'MyModule' });
}
```

#### 调试技巧

- **结构化日志**: 使用内置日志系统替代`console.log`
- **错误追踪**: 查看详细的错误堆栈和上下文信息
- **开发工具**:
  - Electron DevTools用于渲染进程调试
  - 主进程日志查看终端输出
  - Qdrant Web UI (http://localhost:6333/dashboard) 检查向量数据库

### 🔧 配置说明

#### AI配置
```javascript
// src/config/aiConfig.js
export const LM_STUDIO_CONFIG = {
  BASE_URL: 'http://127.0.0.1:1234',  // LM Studio API地址
  MODEL: 'deepseek/deepseek-r1-0528-qwen3-8b',  // 模型名称
  TEMPERATURE: 0.7  // 响应随机性
};
```

#### UI主题配置
```javascript
// src/config/uiConfig.js
export const THEME_CONFIG = {
  colors: {
    primary: '#007bff',
    userMessage: '#dcf8c6',
    aiMessage: '#ffffff'
  }
};
```

### 📊 性能优化

- **内存管理**: 自动降级策略（ChromaDB → 内存存储）
- **错误恢复**: 智能错误处理和自动重试机制
- **日志优化**: 结构化日志，支持不同级别和颜色输出
- **模块加载**: 按需加载，减少启动时间

### 🤝 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

### 📋 常见问题

**Q: 启动时出现ChromaDB连接错误**
A: 项目会自动降级到内存存储。检查Python环境和ChromaDB安装，或查看日志了解当前使用的存储策略。

**Q: 3D角色无法显示**
A: 检查控制台WebGL错误，确保显卡驱动支持WebGL。项目已添加GPU兼容性参数。

**Q: AI响应缓慢或失败**
A: 确认LM Studio正在运行且模型已加载。查看结构化日志获取详细错误信息。

**Q: 如何查看详细日志**
A: 日志会在终端显示，支持颜色编码。可以通过设置日志级别控制输出详细程度。

**Q: 如何添加新的动画**
A: 在`src/config/animationConfig.js`中添加动画配置，然后在动画状态机中定义状态。

### 📚 相关文档

- [项目架构说明](./ARCHITECTURE.md) - 详细的架构设计文档
- [优化总结](./OPTIMIZATION_SUMMARY.md) - 最新的结构优化说明
- [API文档](./docs/API.md) - 服务和组件API文档（待添加）

### 🔄 版本历史

- **v1.2.0** - 项目重命名和依赖更新版本
  - 🏷️ 项目重命名：AI Companion → Desktop Chatter
  - 📦 依赖安装和ChromaDB设置优化
  - 🔧 修复ChromaDB设置脚本的变量冲突问题
  - 📚 更新所有文档以反映新的项目名称

- **v1.1.0** - 结构优化版本
  - 实现服务化架构
  - 添加统一错误处理和日志系统
  - 优化模块导入导出结构
  - 完善类型定义和文档

- **v1.0.0** - 初始版本
  - 基础3D角色和AI对话功能
  - ChromaDB向量数据库集成
  - 基础动画系统

### 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。

### 🙏 致谢

- [Three.js](https://threejs.org/) - 3D图形库
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [ChromaDB](https://www.trychroma.com/) - 向量数据库
- [LM Studio](https://lmstudio.ai/) - 本地AI模型运行环境