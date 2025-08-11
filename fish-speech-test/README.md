# 🐟 Fish Speech TTS 集成项目

本项目实现了Fish Speech文本转语音(TTS)功能的完整集成，包括基础TTS和声音克隆功能。

## 🎯 功能特性

- ✅ **本地Fish Speech服务部署**
- ✅ **基础TTS功能**
- ✅ **声音克隆功能**
- ✅ **Web界面测试**
- ✅ **API端点集成**
- ✅ **文件上传支持**

## 🚀 快速开始

### 1. 启动Fish Speech服务
```bash
# 使用批处理文件启动
start_fish_speech.bat

# 或手动启动
cd fish-speech
python -m fish_speech.webui.launch --listen 0.0.0.0:8080 --workers 1
```

### 2. 启动Web服务器
```bash
# 安装依赖
npm install

# 启动服务器
node server.js
```

### 3. 访问应用
- **聊天应用**: http://localhost:3002/index.html
- **声音克隆测试**: http://localhost:3002/voice_clone_test.html
- **健康检查**: http://localhost:3002/api/health

## 📋 API 端点

### 基础TTS
```bash
POST /api/tts
Content-Type: application/json

{
  "text": "要合成的文本"
}
```

### 声音克隆 (文件上传)
```bash
POST /api/voice-clone
Content-Type: multipart/form-data

- referenceAudio: 音频文件
- referenceText: 参考音频对应的文本
- text: 要合成的目标文本
```

### 声音克隆 (Base64)
```bash
POST /api/tts
Content-Type: application/json

{
  "text": "要合成的文本",
  "referenceAudio": "base64编码的音频数据",
  "referenceText": "参考音频对应的文本"
}
```

## 🔧 系统要求

### 硬件要求
- **内存**: 至少8GB RAM（推荐16GB+）
- **显卡**: NVIDIA GPU（推荐4GB+ VRAM）
- **存储**: 至少10GB可用空间

### 软件要求
- **Python**: 3.8-3.11（推荐3.10）
- **Node.js**: 16+
- **CUDA**: 11.8或12.1（GPU加速）

## 📁 项目结构

```
fish-speech-test/
├── fish-speech/           # Fish Speech核心代码
├── generated_audio/       # 生成的音频文件（Git忽略）
├── server.js             # Node.js服务器
├── index.html            # 聊天应用界面
├── voice_clone_test.html # 声音克隆测试界面
├── package.json          # Node.js依赖
├── start_fish_speech.bat # Fish Speech启动脚本
└── README.md            # 本文档
```

## 🎵 声音克隆使用技巧

### 参考音频要求
- **时长**: 5-10秒最佳
- **质量**: 清晰、无背景噪音
- **格式**: WAV格式推荐（16kHz采样率）
- **内容**: 语音清晰、发音标准

### 参考文本要求
- **准确性**: 必须与参考音频内容完全匹配
- **标点符号**: 包含适当的标点符号
- **语言一致**: 与目标文本使用相同语言

## 🧪 测试脚本

项目包含多个测试脚本：

- `test_fish_speech_api.py` - Fish Speech API测试
- `test_chat_tts.py` - 聊天应用TTS测试
- `test_voice_cloning.py` - 声音克隆功能测试

运行测试：
```bash
python test_voice_cloning.py
```

## 🔧 故障排除

### 常见问题

1. **Fish Speech服务无法启动**
   - 检查Python环境和依赖
   - 确认CUDA版本兼容性
   - 查看错误日志

2. **音频生成失败**
   - 检查Fish Speech服务状态
   - 验证API端点连接
   - 确认文本格式正确

3. **声音克隆效果不佳**
   - 使用高质量参考音频
   - 确保参考文本准确匹配
   - 调整模型参数

### 日志查看
- Fish Speech日志: 控制台输出
- Node.js日志: 控制台输出
- 浏览器日志: F12开发者工具

## 📊 性能指标

### 测试环境
- **GPU**: NVIDIA RTX 4060 Ti
- **内存**: 16GB
- **CUDA**: 12.6

### 性能数据
- **处理速度**: ~5.8 tokens/sec
- **内存使用**: ~5.3GB GPU内存
- **响应时间**: 15-25秒（取决于文本长度）
- **音频质量**: 高质量WAV格式输出

## 🎉 成功案例

### 基础TTS
- **输入**: "Hello, this is a test of Fish Speech text to speech."
- **输出**: 253,996字节高质量音频

### 声音克隆
- **参考音频**: 311,340字节
- **生成音频**: 340,012字节
- **音色相似度**: 高度相似

## 📝 开发说明

### Git配置
项目已配置`.gitignore`忽略以下文件：
- `generated_audio/` - 生成的音频文件
- `node_modules/` - Node.js依赖
- `fish_speech_env/` - Python虚拟环境
- 各种临时文件和日志

### 部署注意事项
1. 确保所有依赖正确安装
2. 配置正确的端口（Fish Speech: 8080, Web服务器: 3002）
3. 检查防火墙设置
4. 监控系统资源使用

## 🤝 贡献

欢迎提交Issue和Pull Request来改进项目。

## 📄 许可证

本项目遵循MIT许可证。
