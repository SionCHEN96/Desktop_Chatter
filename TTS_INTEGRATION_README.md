# Desktop Chatter TTS 集成说明

## 功能概述

本次更新为 Desktop Chatter 添加了完整的 TTS (Text-to-Speech) 语音合成功能，集成了 Fish Speech 语音克隆技术。

## 新增功能

### 1. 语音合成
- AI 回复后自动进行语音合成
- 使用 Fish Speech 进行高质量语音克隆
- 支持中文语音合成

### 2. 语音克隆
- 使用预设的参考音频进行声音克隆
- 参考音频：`public/Audio/就因为卖相不好吗，口感明明很棒的呀.wav`
- 参考文本：`就因为卖相不好吗，口感明明很棒的呀`

### 3. 文本处理
- 自动过滤表情符号
- 清理动作描述（如 *动作*、(表情)、【动作】等）
- 文本长度限制和验证

### 4. 音频播放
- AI 气泡显示时自动播放合成语音
- 支持音频播放队列
- 音频播放完成后自动清理

## 配置说明

### TTS 配置文件
配置文件位于：`src/config/config.js`

主要配置项：
```javascript
export const TTS_CONFIG = {
  // API 配置
  API: {
    BASE_URL: 'http://localhost:3002',
    FISH_SPEECH_URL: 'http://localhost:8080',
    TIMEOUT: 60000
  },
  
  // 语音克隆配置
  VOICE_CLONING: {
    REFERENCE_AUDIO_PATH: './public/Audio/就因为卖相不好吗，口感明明很棒的呀.wav',
    REFERENCE_TEXT: '就因为卖相不好吗，口感明明很棒的呀',
    LANGUAGE: 'zh'
  },
  
  // 文本处理配置
  TEXT_PROCESSING: {
    FILTER_EMOJIS: true,
    MAX_TEXT_LENGTH: 500,
    MIN_TEXT_LENGTH: 1
  }
}
```

### 修改参考音频
1. 将新的音频文件放入 `public/Audio/` 目录
2. 修改 `TTS_CONFIG.VOICE_CLONING.REFERENCE_AUDIO_PATH`
3. 修改 `TTS_CONFIG.VOICE_CLONING.REFERENCE_TEXT` 为对应的文本内容

## 启动方式

### 方式一：使用新的启动脚本（推荐）
```bash
start_with_tts.bat
```

### 方式二：使用原有启动方式
```bash
npm start
```

## 服务架构

### 主要服务
1. **TTSService** - TTS 服务管理
   - 启动/停止 Fish Speech 服务
   - 启动/停止 TTS 代理服务器
   - 健康检查和状态监控

2. **Fish Speech Server** - 语音合成引擎
   - 端口：8080
   - 提供语音合成 API

3. **TTS Proxy Server** - TTS 代理服务器
   - 端口：3002
   - 提供简化的 TTS API 接口

### 服务启动顺序
1. Fish Speech 服务器启动
2. TTS 代理服务器启动
3. 主应用启动
4. 健康检查开始

## 工作流程

1. 用户发送消息
2. AI 生成回复文本
3. 文本自动清理（去除表情符号等）
4. 调用 TTS 服务进行语音合成
5. AI 气泡显示，同时播放合成语音

## 故障排除

### TTS 服务无法启动
1. 检查 Fish Speech 环境是否正确安装
2. 确认端口 8080 和 3002 未被占用
3. 查看控制台错误信息

### 语音合成失败
1. 检查参考音频文件是否存在
2. 确认文本内容不为空
3. 检查网络连接

### 音频播放问题
1. 检查浏览器音频权限
2. 确认音频文件格式支持
3. 查看浏览器控制台错误

## 技术细节

### 文件结构
```
src/
├── config/
│   └── config.js              # TTS 配置
├── main/
│   ├── main.js               # 主进程（集成 TTS 服务）
│   └── services/
│       ├── ttsService.js     # TTS 服务模块
│       └── ipcService.js     # IPC 服务（支持 TTS）
└── renderer/
    └── components/
        ├── App.js            # 应用主组件（TTS 状态检查）
        ├── ChatContainer.js  # 聊天容器（音频支持）
        └── MessageManager.js # 消息管理（音频播放）

public/
└── Audio/
    └── 就因为卖相不好吗，口感明明很棒的呀.wav  # 参考音频

fish-speech-test/
├── server.js                 # TTS 代理服务器
└── start_fish_speech.bat     # Fish Speech 启动脚本
```

### API 接口
- `POST /api/tts` - 语音合成接口
- `GET /api/health` - 健康检查接口
- `GET /api/fish-speech/status` - Fish Speech 状态检查

## 注意事项

1. **首次启动**：Fish Speech 服务首次启动可能需要较长时间
2. **资源占用**：TTS 服务会占用一定的 CPU 和内存资源
3. **网络要求**：需要本地网络连接正常
4. **音频格式**：参考音频建议使用 WAV 格式
5. **文本限制**：单次合成文本不超过 500 字符

## 更新日志

### v1.1.0 - TTS 集成
- ✅ 添加 Fish Speech TTS 集成
- ✅ 实现语音克隆功能
- ✅ 添加文本自动清理
- ✅ 实现音频自动播放
- ✅ 添加 TTS 服务状态监控
- ✅ 创建统一启动脚本

---

如有问题，请查看控制台日志或联系开发者。
