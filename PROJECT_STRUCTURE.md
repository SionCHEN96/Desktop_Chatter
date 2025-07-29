# AI伴侣项目结构说明

## 📁 项目目录结构

```
AI_Companion/
├── 📄 README.md                    # 项目主要说明文档
├── 📄 CHANGELOG.md                 # 版本更新日志
├── 📄 PROJECT_STRUCTURE.md         # 项目结构说明（本文件）
├── 📄 package.json                 # Node.js项目配置
├── 📄 package-lock.json            # 依赖锁定文件
├── 📄 index.html                   # 应用主页面
│
├── 📁 src/                         # 源代码目录
│   ├── 📁 main/                    # 主进程代码
│   │   ├── 📄 main.js              # 主进程入口
│   │   └── 📁 services/            # 主进程服务
│   │       ├── 📄 aiService.js     # AI服务
│   │       ├── 📄 windowService.js # 窗口管理服务
│   │       ├── 📄 ipcService.js    # IPC通信服务
│   │       └── 📄 memoryService.js # 内存管理服务
│   │
│   ├── 📁 renderer/                # 渲染进程代码
│   │   └── 📁 components/          # UI组件
│   │       ├── 📄 App.js           # 应用主组件
│   │       ├── 📄 ChatContainer.js # 聊天容器
│   │       ├── 📄 MessageManager.js# 消息管理器
│   │       ├── 📄 InputManager.js  # 输入管理器
│   │       ├── 📄 ChatToggleManager.js # 输入框切换管理器
│   │       ├── 📄 CharacterManager.js  # 角色管理器
│   │       └── 📄 WindowControls.js    # 窗口控制
│   │
│   ├── 📁 core/                    # 核心功能模块
│   │   ├── 📁 character/           # 角色系统
│   │   └── 📁 memory/              # 内存管理系统
│   │       └── 📁 strategies/      # 存储策略
│   │
│   ├── 📁 config/                  # 配置文件
│   │   ├── 📄 aiConfig.js          # AI配置
│   │   ├── 📄 uiConfig.js          # UI配置
│   │   └── 📄 index.js             # 配置入口
│   │
│   ├── 📁 styles/                  # 样式文件
│   │   ├── 📄 styles.css           # 主样式文件
│   │   └── 📄 global.css           # 全局样式
│   │
│   ├── 📁 utils/                   # 工具模块
│   │   ├── 📄 logger.js            # 日志系统
│   │   └── 📄 errorHandler.js      # 错误处理
│   │
│   ├── 📁 types/                   # 类型定义
│   │   └── 📄 index.js             # 类型定义文件
│   │
│   ├── 📁 ui/                      # UI组件库
│   │   ├── 📄 MessageComponent.js  # 消息组件
│   │   └── 📄 MessageComponent.css # 消息组件样式
│   │
│   └── 📄 preload.js               # 预加载脚本
│
├── 📁 docs/                        # 文档目录
│   ├── 📄 API.md                   # API文档
│   ├── 📄 DEVELOPMENT.md           # 开发指南
│   ├── 📄 README.md                # 文档说明
│   ├── 📄 ARCHITECTURE.md          # 架构文档
│   ├── 📄 CHROMADB_INTEGRATION.md  # ChromaDB集成文档
│   └── 📁 implementation/          # 功能实现文档
│       ├── 📄 AI_BUBBLE_IMPLEMENTATION.md      # AI气泡功能实现
│       ├── 📄 INPUT_TOGGLE_IMPLEMENTATION.md   # 输入框切换功能实现
│       ├── 📄 TIMESTAMP_REMOVAL.md             # 时间戳移除功能
│       ├── 📄 WINDOW_RESIZE_REMOVAL.md         # 窗口调整功能移除
│       └── 📄 OPTIMIZATION_SUMMARY.md          # 优化总结
│
├── 📁 scripts/                     # 脚本目录
│   ├── 📄 setup-chromadb.js        # ChromaDB设置脚本
│   ├── 📄 start-app-with-db.bat    # 启动应用（带数据库）
│   ├── 📄 start-app-with-db-debug.bat # 启动应用（调试模式）
│   └── 📁 database/                # 数据库相关脚本
│       ├── 📄 start-qdrant-advanced.cjs # Qdrant高级启动脚本
│       ├── 📄 start-qdrant-node.cjs     # Qdrant Node.js启动脚本
│       ├── 📄 start-qdrant-full.bat     # Qdrant完整启动脚本
│       ├── 📄 start-qdrant.bat          # Qdrant启动脚本
│       └── 📄 stop-qdrant.bat           # Qdrant停止脚本
│
├── 📁 tests/                       # 测试文件目录
│   ├── 📄 test_bubble_functionality.html    # 气泡功能测试
│   └── 📄 test_toggle_functionality.html    # 切换功能测试
│
├── 📁 public/                      # 公共资源目录
│   ├── 📁 models/                  # 3D模型文件
│   └── 📁 Animations/              # 动画文件
│
├── 📁 data/                        # 数据目录
│   └── 📁 chroma/                  # ChromaDB数据存储
│
├── 📁 qdrant_data/                 # Qdrant数据目录
│   ├── 📁 aliases/                 # 别名配置
│   ├── 📁 collections/             # 集合数据
│   └── 📄 raft_state.json          # Raft状态文件
│
└── 📁 node_modules/                # Node.js依赖包
```

## 📋 目录说明

### 🔧 核心代码目录

- **`src/main/`**: Electron主进程代码，负责应用生命周期、窗口管理、系统集成
- **`src/renderer/`**: 渲染进程代码，负责用户界面和交互逻辑
- **`src/core/`**: 核心业务逻辑，包括角色系统和内存管理
- **`src/config/`**: 应用配置文件，包括AI、UI等各种配置

### 📚 文档目录

- **`docs/`**: 项目文档集合
  - **`docs/implementation/`**: 具体功能实现的详细文档
- **`README.md`**: 项目主要说明和快速开始指南
- **`CHANGELOG.md`**: 版本更新历史记录

### 🛠️ 工具和脚本

- **`scripts/`**: 各种自动化脚本
  - **`scripts/database/`**: 数据库相关的启动和管理脚本
- **`tests/`**: 功能测试页面和测试工具

### 📦 资源和数据

- **`public/`**: 静态资源文件（模型、动画等）
- **`data/`**: 应用数据存储目录
- **`qdrant_data/`**: Qdrant向量数据库数据

## 🎯 文件整理原则

### 1. 按功能分类
- 将相关功能的文件放在同一目录下
- 区分核心代码、文档、脚本、测试等不同类型

### 2. 层次清晰
- 使用子目录进一步细分功能模块
- 避免根目录文件过多

### 3. 命名规范
- 使用描述性的文件和目录名称
- 保持命名一致性

### 4. 易于维护
- 相关文档与代码就近放置
- 便于查找和修改

## 🚀 快速导航

### 开发相关
- 主要代码: `src/`
- 配置文件: `src/config/`
- 样式文件: `src/styles/`

### 文档相关
- 架构文档: `docs/ARCHITECTURE.md`
- API文档: `docs/API.md`
- 功能实现: `docs/implementation/`

### 运行和测试
- 启动脚本: `scripts/`
- 测试页面: `tests/`
- 数据库脚本: `scripts/database/`

## 📝 维护建议

1. **新增功能**: 在 `docs/implementation/` 中添加实现文档
2. **配置修改**: 更新 `src/config/` 中的相应配置文件
3. **样式调整**: 修改 `src/styles/` 中的样式文件
4. **测试验证**: 在 `tests/` 中添加相应的测试文件
5. **版本更新**: 及时更新 `CHANGELOG.md`

这样的目录结构使项目更加整洁、易于维护和扩展。
