# GPT-SoVITS 集成文档

本文档介绍如何在Desktop Chatter项目中使用GPT-SoVITS语音合成功能。

## 📋 概述

GPT-SoVITS集成为Desktop Chatter项目提供了先进的AI语音合成能力，支持：

- 🎤 高质量语音合成
- 🎭 多角色语音克隆
- 🌍 多语言支持（中文、英文、日文、韩文）
- ⚡ 实时语音生成
- 🔧 灵活的参数配置

## 🏗️ 架构设计

### 组件结构

```
GPT-SoVITS集成
├── 配置模块 (src/config/config.js)
│   └── GPT_SOVITS_CONFIG - 服务配置
├── 服务模块 (src/main/services/)
│   └── gptSovitsService.js - 核心服务类
├── IPC通信 (src/main/services/ipcService.js)
│   └── GPT-SoVITS相关处理器
├── 测试服务器 (gpt-sovits-server.js)
│   └── 独立的Express API服务
└── 测试网页 (public/)
    ├── gpt-sovits-test.html - 测试界面
    └── gpt-sovits-test.js - 前端逻辑
```

### 服务架构

1. **GPTSoVITSService**: 核心服务类，封装与GPT-SoVITS API的交互
2. **Express服务器**: 提供HTTP API代理和测试网页服务
3. **IPC集成**: 与主项目的Electron IPC系统集成
4. **配置管理**: 统一的配置管理系统

## 🚀 快速开始

### 1. 启动GPT-SoVITS服务

首先确保GPT-SoVITS服务正在运行：

```bash
# 在GPT-SoVITS项目目录中
python api_v2.py -a 127.0.0.1 -p 9880 -c GPT_SoVITS/configs/tts_infer.yaml
```

### 2. 启动测试服务器

在Desktop Chatter项目根目录中：

```bash
node gpt-sovits-server.js
```

### 3. 访问测试页面

打开浏览器访问：
- 测试页面: http://localhost:3000/gpt-sovits-test.html
- API健康检查: http://localhost:3000/api/health

## 🔧 配置说明

### GPT-SoVITS配置 (src/config/config.js)

```javascript
export const GPT_SOVITS_CONFIG = {
  // API配置
  API_URL: 'http://127.0.0.1:9880',        // GPT-SoVITS API地址
  API_V2_URL: 'http://127.0.0.1:9880',     // API v2地址
  USE_API_V2: true,                        // 是否使用API v2
  TIMEOUT: 30000,                          // 请求超时时间

  // 模型配置
  MODELS: {
    LOCAL_MODELS: {
      XIANGLING: {                         // 角色配置
        GPT_MODEL: 'public/GPT-SOVITS-models/Xiangling-e15.ckpt',
        SOVITS_MODEL: 'public/GPT-SOVITS-models/Xiangling_e8_s80.pth',
        REF_AUDIO: 'public/GPT-SOVITS-models/RefAudio-Xiangling.wav',
        REF_TEXT: '我是不会对食物有什么偏见的，只有不合适的做法...',
        REF_LANGUAGE: 'zh'
      }
    }
  },

  // 默认参数
  DEFAULT_PARAMS: {
    text_lang: 'zh',                       // 文本语言
    top_k: 5,                             // Top-K采样
    top_p: 1.0,                           // Top-P采样
    temperature: 1.0,                     // 温度参数
    speed_factor: 1.0,                    // 语速因子
    // ... 更多参数
  }
};
```

### 角色配置

要添加新角色，在`LOCAL_MODELS`中添加配置：

```javascript
NEW_CHARACTER: {
  GPT_MODEL: 'path/to/gpt/model.ckpt',
  SOVITS_MODEL: 'path/to/sovits/model.pth',
  REF_AUDIO: 'path/to/reference/audio.wav',
  REF_TEXT: '参考音频的文本内容',
  REF_LANGUAGE: 'zh' // 或 'en', 'ja', 'ko'
}
```

## 📡 API接口

### Express服务器API

#### 健康检查
```
GET /api/health
```

#### 获取角色列表
```
GET /api/gpt-sovits/characters
```

#### 语音合成
```
POST /api/gpt-sovits/synthesize
Content-Type: application/json

{
  "text": "要合成的文本",
  "character": "XIANGLING",
  "text_lang": "zh",
  "speed_factor": 1.0,
  "temperature": 1.0,
  "top_p": 1.0
}
```

### IPC接口（Electron主进程）

#### 语音合成
```javascript
const result = await ipcRenderer.invoke('gpt-sovits-synthesize', {
  text: '要合成的文本',
  options: {
    text_lang: 'zh',
    speed_factor: 1.0
  }
});
```

#### 角色语音合成
```javascript
const result = await ipcRenderer.invoke('gpt-sovits-synthesize-character', {
  text: '要合成的文本',
  character: 'XIANGLING',
  options: {}
});
```

#### 健康检查
```javascript
const result = await ipcRenderer.invoke('gpt-sovits-health');
```

#### 获取角色列表
```javascript
const result = await ipcRenderer.invoke('gpt-sovits-characters');
```

## 🎯 使用示例

### 在渲染进程中使用

```javascript
// 语音合成示例
async function synthesizeVoice(text) {
  try {
    const result = await window.electronAPI.invoke('gpt-sovits-synthesize-character', {
      text: text,
      character: 'XIANGLING',
      options: {
        text_lang: 'zh',
        speed_factor: 1.0,
        temperature: 1.0
      }
    });

    if (result.success) {
      // 创建音频播放
      const audioBuffer = new Uint8Array(result.audioBuffer);
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.play();
    } else {
      console.error('语音合成失败:', result.error);
    }
  } catch (error) {
    console.error('调用失败:', error);
  }
}
```

### 在主进程中使用

```javascript
import { GPTSoVITSService } from './services/gptSovitsService.js';

const gptSovitsService = new GPTSoVITSService();

// 检查服务健康状态
const isHealthy = await gptSovitsService.checkServiceHealth();

// 语音合成
const audioBuffer = await gptSovitsService.synthesizeWithCharacter(
  '你好，欢迎使用GPT-SoVITS！',
  'XIANGLING'
);
```

## 🔍 故障排除

### 常见问题

1. **连接失败**
   - 确保GPT-SoVITS服务正在运行
   - 检查API地址和端口配置
   - 验证防火墙设置

2. **合成失败**
   - 检查模型文件是否存在
   - 验证参考音频文件路径
   - 确认文本内容不为空

3. **音频播放问题**
   - 检查浏览器音频权限
   - 验证音频格式支持
   - 确认音频数据完整性

### 调试方法

1. **启用详细日志**
   ```javascript
   // 在配置中设置
   LOGGING_CONFIG.LEVEL = 'DEBUG'
   ```

2. **检查服务状态**
   ```bash
   curl http://localhost:3000/api/health
   ```

3. **测试API连接**
   ```bash
   curl http://localhost:9880/health
   ```

## 📝 开发指南

### 添加新功能

1. **扩展服务类**: 在`GPTSoVITSService`中添加新方法
2. **更新IPC处理器**: 在`IPCService`中添加对应的处理器
3. **更新配置**: 在配置文件中添加相关设置
4. **编写测试**: 创建相应的测试用例

### 性能优化

1. **缓存机制**: 实现音频缓存以减少重复合成
2. **批处理**: 支持批量文本合成
3. **流式处理**: 实现流式音频传输
4. **资源管理**: 优化内存和CPU使用

## 🔒 安全考虑

1. **输入验证**: 严格验证所有输入参数
2. **访问控制**: 限制API访问权限
3. **资源限制**: 防止资源滥用
4. **错误处理**: 安全的错误信息返回

## 📚 参考资源

- [GPT-SoVITS官方文档](https://github.com/RVC-Boss/GPT-SoVITS)
- [Electron IPC文档](https://www.electronjs.org/docs/api/ipc-main)
- [Express.js文档](https://expressjs.com/)
- [项目架构文档](./ARCHITECTURE.md)
