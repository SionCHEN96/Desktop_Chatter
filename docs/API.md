# AI Companion API 文档

本文档描述了AI Companion项目中主要服务和组件的API接口。

## 主进程服务 API

### AIService

AI服务负责与LM Studio API的交互和响应处理。

#### 构造函数
```javascript
new AIService(memoryManager?)
```

**参数:**
- `memoryManager` (Object, 可选): 内存管理器实例

#### 方法

##### `setMemoryManager(memoryManager)`
设置内存管理器实例。

**参数:**
- `memoryManager` (Object): 内存管理器实例

##### `getAIResponse(message)`
获取AI响应。

**参数:**
- `message` (string): 用户消息

**返回:**
- `Promise<string>`: AI响应内容

**示例:**
```javascript
const aiService = new AIService(memoryManager);
const response = await aiService.getAIResponse("你好");
console.log(response); // AI的回复
```

### WindowService

窗口管理服务负责Electron窗口的创建和控制。

#### 方法

##### `createMainWindow()`
创建主窗口。

**返回:**
- `BrowserWindow`: 创建的窗口实例

##### `getMainWindow()`
获取主窗口实例。

**返回:**
- `BrowserWindow|null`: 主窗口实例

##### `closeMainWindow()`
关闭主窗口。

##### `minimizeMainWindow()`
最小化主窗口。

##### `toggleMaximizeMainWindow()`
切换窗口最大化状态。

##### `setAlwaysOnTop(alwaysOnTop)`
设置窗口置顶状态。

**参数:**
- `alwaysOnTop` (boolean): 是否置顶

### MemoryService

内存管理服务封装内存管理器的操作。

#### 方法

##### `initializeMemoryManager()`
初始化内存管理器，自动选择最佳存储策略。

**返回:**
- `Promise<Object|null>`: 内存管理器实例

##### `getMemoryManager()`
获取内存管理器实例。

**返回:**
- `Object|null`: 内存管理器实例

##### `saveMemory(content, metadata)`
保存记忆。

**参数:**
- `content` (string): 记忆内容
- `metadata` (Object): 元数据

**返回:**
- `Promise<boolean>`: 是否成功

##### `searchMemory(query, limit)`
搜索记忆。

**参数:**
- `query` (string): 搜索查询
- `limit` (number): 结果限制，默认5

**返回:**
- `Promise<Array|null>`: 搜索结果

## 渲染进程组件 API

### MessageManager

消息管理组件负责消息的显示和管理。

#### 构造函数
```javascript
new MessageManager(containerElement)
```

**参数:**
- `containerElement` (HTMLElement): 消息容器元素

#### 方法

##### `addUserMessage(text, options)`
添加用户消息。

**参数:**
- `text` (string): 消息内容
- `options` (Object, 可选): 选项

**返回:**
- `Object`: 消息对象

##### `addAIMessage(text, options)`
添加AI消息。

**参数:**
- `text` (string): 消息内容
- `options` (Object, 可选): 选项

**返回:**
- `Object`: 消息对象

##### `clearMessages()`
清空所有消息。

##### `getMessages()`
获取所有消息。

**返回:**
- `Array`: 消息列表

### InputManager

输入管理组件负责用户输入的处理。

#### 构造函数
```javascript
new InputManager(formElement, inputElement, options)
```

**参数:**
- `formElement` (HTMLElement): 表单元素
- `inputElement` (HTMLElement): 输入元素
- `options` (Object, 可选): 配置选项

#### 方法

##### `sendMessage(message)`
发送消息。

**参数:**
- `message` (string): 消息内容

##### `setProcessing(processing)`
设置处理状态。

**参数:**
- `processing` (boolean): 是否正在处理

##### `getValue()`
获取输入值。

**返回:**
- `string`: 输入值

##### `setValue(value)`
设置输入值。

**参数:**
- `value` (string): 输入值

##### `clearInput()`
清空输入。

##### `focus()`
聚焦输入框。

## 工具 API

### Logger

日志系统提供结构化的日志记录。

#### 创建Logger
```javascript
import { createLogger } from '../utils/index.js';
const logger = createLogger('ModuleName');
```

#### 方法

##### `debug(message, context)`
记录调试日志。

##### `info(message, context)`
记录信息日志。

##### `warn(message, context)`
记录警告日志。

##### `error(message, context)`
记录错误日志。

**参数:**
- `message` (string): 日志消息
- `context` (Object, 可选): 上下文信息

### ErrorHandler

错误处理系统提供统一的错误处理机制。

#### 函数

##### `handleError(error, context)`
处理错误。

**参数:**
- `error` (Error|AppError): 错误对象
- `context` (Object, 可选): 额外上下文

**返回:**
- `Promise<boolean>`: 处理结果

##### `createError(message, type, severity, context)`
创建应用错误。

**参数:**
- `message` (string): 错误消息
- `type` (string): 错误类型
- `severity` (string): 错误严重程度
- `context` (Object, 可选): 错误上下文

**返回:**
- `AppError`: 应用错误实例

## IPC 通信协议

### 主进程 → 渲染进程

#### `response`
AI响应消息。

**数据:**
- `string`: AI响应内容

### 渲染进程 → 主进程

#### `message`
用户消息。

**数据:**
- `string`: 用户消息内容

#### `close-window`
关闭窗口请求。

#### `minimize-window`
最小化窗口请求。

#### `toggle-maximize-window`
切换最大化窗口请求。

#### `set-always-on-top`
设置窗口置顶请求。

**数据:**
- `boolean`: 是否置顶

## 配置 API

### AI配置
```javascript
import { LM_STUDIO_CONFIG } from '../config/index.js';
```

### UI配置
```javascript
import { THEME_CONFIG, WINDOW_CONFIG } from '../config/index.js';
```

### 动画配置
```javascript
import { ANIMATION_CONFIG, ANIMATION_EVENTS } from '../config/index.js';
```

## 类型定义

项目使用JSDoc提供类型定义，主要类型包括：

- `Message`: 消息对象
- `MemoryItem`: 记忆项
- `AnimationConfig`: 动画配置
- `WindowConfig`: 窗口配置
- `ServiceResponse`: 服务响应
- `AppError`: 应用错误

详细类型定义请参考 `src/types/index.js`。
