# Desktop Chatter - TTS 测试

桌面聊天应用，集成Fish Speech TTS功能。

## 🚀 快速启动TTS测试

### 一键启动（推荐）
```bash
# 启动TTS服务和测试网页
start_tts_test.bat
```

### 手动启动
```bash
# 1. 启动Fish Speech服务
cd fish-speech-test
start_fish_speech.bat

# 2. 启动Web服务器
node server.js

# 3. 打开浏览器访问
# http://localhost:3002/tts_test.html - 综合测试页面
```

## 📋 测试功能

- **基础TTS**: 文本转语音，支持多种语言
- **声音克隆**: 上传参考音频进行声音克隆
- **标签页切换**: 在一个页面中切换不同功能
- **实时测试**: 统一的Web界面，操作简单

## 🔧 系统要求

- Python 3.8-3.11
- Node.js 16+
- NVIDIA GPU（推荐）
- 8GB+ RAM

## 📁 项目结构

```
fish-speech-test/           # TTS测试项目
├── fish-speech/           # Fish Speech核心
├── generated_audio/       # 生成的音频文件
├── server.js             # Web服务器
├── tts_test.html         # 综合测试页面（基础TTS + 声音克隆）
├── index.html            # 原聊天测试界面（备用）
├── voice_clone_test.html # 原声音克隆界面（备用）
└── start_fish_speech.bat # Fish Speech启动脚本
```
