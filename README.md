# AI Companion

一个基于Electron的3D虚拟角色AI助手应用程序，具有自然语言交互、记忆管理和动画系统。

## 项目概述

AI Companion是一个创新的桌面应用程序，结合了3D虚拟角色、自然语言处理和向量数据库技术。该应用提供了一个具有情感表达和记忆能力的虚拟角色，可以与用户进行自然对话，并根据上下文提供个性化的响应。

### 核心特性

- 🎭 **3D虚拟角色**: 基于Three.js和VRM模型的可交互3D角色
- 💬 **自然语言交互**: 与LM Studio集成的AI对话系统
- 🧠 **记忆管理**: 使用Qdrant向量数据库存储和检索对话历史
- 🎬 **动画系统**: 支持多种角色动画状态（待机、思考、情感表达等）
- 🖥️ **桌面应用**: 基于Electron的跨平台桌面应用程序

## 快速开始指南

### 系统要求

- Node.js 16.x 或更高版本
- npm 8.x 或更高版本
- Docker (可选，用于Qdrant数据库)
- LM Studio (用于本地AI模型)

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd ai-companion
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动Qdrant数据库**
   
   有两种方式启动Qdrant数据库:
   
   **方式一：使用Docker (推荐)**
   ```bash
   npm run start-with-db
   ```
   
   **方式二：使用Node.js**
   ```bash
   npm run start-with-db-node
   ```

4. **启动应用**
   ```bash
   npm start
   ```

### 项目结构

```
src/
├── config/                 # 配置文件
├── core/                   # 核心功能模块
│   ├── ai/                 # AI相关功能
│   ├── animation/          # 动画系统
│   ├── character/          # 角色控制
│   └── memory/             # 内存管理
├── main/                   # 主进程代码
├── renderer/               # 渲染进程代码
├── ui/                     # UI组件
├── styles/                 # 样式文件
└── utils/                  # 工具函数
```

### 开发指南

1. **代码规范**
   - 使用ES6模块系统
   - 遵循camelCase命名规范
   - 模块化设计，每个功能独立封装

2. **添加新功能**
   - 在`src/core/`目录下创建对应的功能模块
   - 通过`index.js`文件暴露模块接口
   - 在主进程中通过导入方式使用模块

3. **调试**
   - 使用`console.log`输出调试信息
   - 查看Electron控制台获取错误信息
   - 使用Qdrant Web UI检查向量数据库状态

### 常见问题

**Q: 启动时出现Qdrant连接错误**
A: 确保已启动Qdrant数据库服务，或使用降级的内存存储模式。

**Q: 3D角色无法显示**
A: 检查浏览器控制台是否有WebGL相关错误，确保系统支持WebGL。

**Q: AI响应缓慢**
A: 检查LM Studio是否正常运行，确认模型已加载。

### 许可证

本项目基于MIT许可证开源。