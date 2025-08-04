# AI Companion 开发指南

本文档为AI Companion项目的开发者提供详细的开发指南和最佳实践。

## 🚀 快速开始

### 环境准备

1. **Node.js环境**
   ```bash
   # 推荐使用Node.js 16+
   node --version  # 应该 >= 16.0.0
   npm --version   # 应该 >= 8.0.0
   ```

2. **克隆和安装**
   ```bash
   git clone <repository-url>
   cd ai-companion
   npm install
   ```

3. **启动开发环境**
   ```bash
   # 设置ChromaDB环境
   npm run setup-chromadb

   # 启动应用
   npm start
   ```

## 📁 项目结构理解

### 核心原则

- **服务化**: 主进程采用微服务架构
- **组件化**: 渲染进程使用可复用组件
- **模块化**: 统一的导入导出机制
- **类型安全**: 完整的JSDoc类型定义

### 目录说明

```
src/
├── config/          # 📋 配置管理
├── core/            # 🔧 核心业务逻辑
├── main/            # 🖥️ 主进程服务
├── renderer/        # 🎨 渲染进程组件
├── ui/              # 🎯 可复用UI组件
├── utils/           # 🛠️ 工具函数
└── types/           # 📝 类型定义
```

## 🔧 开发工作流

### 1. 添加新功能

#### 核心功能模块
```bash
# 1. 创建模块目录
mkdir src/core/newFeature

# 2. 创建主要文件
touch src/core/newFeature/NewFeature.js
touch src/core/newFeature/index.js

# 3. 实现功能
# 4. 更新 src/core/index.js 导出
```

#### 主进程服务
```bash
# 1. 创建服务文件
touch src/main/services/newService.js

# 2. 实现服务类
# 3. 更新 src/main/services/index.js 导出
# 4. 在 main.js 中集成服务
```

#### 渲染进程组件
```bash
# 1. 创建组件文件
touch src/renderer/components/NewComponent.js

# 2. 实现组件类
# 3. 更新 src/renderer/components/index.js 导出
# 4. 在父组件中使用
```

### 2. 代码规范

#### 文件命名
- 组件文件: `PascalCase.js` (如 `MessageManager.js`)
- 服务文件: `camelCase.js` (如 `aiService.js`)
- 配置文件: `camelCase.js` (如 `aiConfig.js`)
- 工具文件: `camelCase.js` (如 `logger.js`)

#### 代码风格
```javascript
// ✅ 推荐的类定义
/**
 * 服务类描述
 * @class ServiceName
 */
export class ServiceName {
  /**
   * 构造函数
   * @param {Object} options - 配置选项
   */
  constructor(options = {}) {
    /** @type {Object} 配置选项 */
    this.options = options;
  }

  /**
   * 方法描述
   * @param {string} param - 参数描述
   * @returns {Promise<string>} 返回值描述
   */
  async methodName(param) {
    // 实现逻辑
  }
}
```

#### 导入导出规范
```javascript
// ✅ 推荐的导入方式
import { ServiceA, ServiceB } from '../services/index.js';
import { createLogger, handleError } from '../utils/index.js';

// ✅ 推荐的导出方式
export { ServiceA } from './serviceA.js';
export { ServiceB } from './serviceB.js';
```

### 3. 日志和错误处理

#### 使用日志系统
```javascript
import { createLogger } from '../utils/index.js';

const logger = createLogger('ModuleName');

// 不同级别的日志
logger.debug('调试信息', { data: someData });
logger.info('操作成功', { userId: 123 });
logger.warn('警告信息', { context: 'warning context' });
logger.error('错误信息', error);
```

#### 错误处理最佳实践
```javascript
import { handleError, createError, ErrorType, ErrorSeverity } from '../utils/index.js';

try {
  // 可能出错的操作
  const result = await riskyOperation();
} catch (error) {
  // 统一错误处理
  await handleError(error, { 
    module: 'ModuleName',
    operation: 'riskyOperation'
  });
}

// 创建自定义错误
const customError = createError(
  'Custom error message',
  ErrorType.VALIDATION,
  ErrorSeverity.MEDIUM,
  { field: 'username' }
);
```

### 4. 配置管理

#### 添加新配置
```javascript
// 1. 在对应的配置文件中添加
// src/config/aiConfig.js
export const NEW_AI_CONFIG = {
  setting1: 'value1',
  setting2: 'value2'
};

// 2. 更新 src/config/index.js
export { NEW_AI_CONFIG } from './aiConfig.js';

// 3. 在代码中使用
import { NEW_AI_CONFIG } from '../config/index.js';
```

## 🧪 测试指南

### 单元测试
```bash
# 安装测试依赖
npm install --save-dev jest

# 运行测试
npm test
```

### 测试文件结构
```
tests/
├── unit/
│   ├── services/
│   ├── components/
│   └── utils/
├── integration/
└── e2e/
```

### 测试示例
```javascript
// tests/unit/services/aiService.test.js
import { AIService } from '../../../src/main/services/aiService.js';

describe('AIService', () => {
  let aiService;

  beforeEach(() => {
    aiService = new AIService();
  });

  test('should create instance', () => {
    expect(aiService).toBeInstanceOf(AIService);
  });

  test('should handle API response', async () => {
    // 测试逻辑
  });
});
```

## 🐛 调试技巧

### 主进程调试
```bash
# 启动时添加调试参数
npm start -- --inspect=9229

# 在Chrome中打开
chrome://inspect
```

### 渲染进程调试
```javascript
// 在开发环境中自动打开DevTools
if (process.env.NODE_ENV === 'development') {
  mainWindow.webContents.openDevTools();
}
```

### 日志调试
```javascript
// 设置日志级别
import { LogLevel } from '../utils/index.js';
logger.setLevel(LogLevel.DEBUG);
```

## 📦 构建和部署

### 开发构建
```bash
npm run build:dev
```

### 生产构建
```bash
npm run build
```

### 打包应用
```bash
npm run dist
```

## 🔄 版本控制

### Git工作流
```bash
# 1. 创建功能分支
git checkout -b feature/new-feature

# 2. 开发和提交
git add .
git commit -m "feat: add new feature"

# 3. 推送和创建PR
git push origin feature/new-feature
```

### 提交消息规范
- `feat:` 新功能
- `fix:` 修复bug
- `docs:` 文档更新
- `style:` 代码格式调整
- `refactor:` 代码重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 🚀 性能优化

### 内存管理
- 及时清理事件监听器
- 避免内存泄漏
- 使用对象池复用

### 渲染优化
- 减少DOM操作
- 使用requestAnimationFrame
- 优化Three.js场景

### 网络优化
- 实现请求缓存
- 添加重试机制
- 优化API调用频率

## 📚 学习资源

- [Electron官方文档](https://electronjs.org/docs)
- [Three.js文档](https://threejs.org/docs/)
- [JSDoc规范](https://jsdoc.app/)
- [Node.js最佳实践](https://github.com/goldbergyoni/nodebestpractices)

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 遵循代码规范
4. 添加测试用例
5. 更新文档
6. 提交Pull Request

## ❓ 常见问题

**Q: 如何添加新的动画状态？**
A: 在`animationConfig.js`中添加配置，然后在`AnimationStateMachine`中定义状态。

**Q: 如何扩展错误处理？**
A: 在`ErrorHandler`中注册新的错误类型处理器。

**Q: 如何添加新的配置项？**
A: 在对应的配置文件中添加，并更新导出文件。

**Q: 如何调试IPC通信？**
A: 使用日志系统记录IPC消息，检查主进程和渲染进程的日志输出。
