# 🐟 Fish Speech 部署和使用指南

## 🎯 项目概述

Fish Speech 是一个高质量的多语言语音合成系统，支持：
- 🌍 **13种语言**：中文、英文、日文、韩文、德文、法文、西班牙文、俄文、阿拉伯文、意大利文、葡萄牙文、荷兰文、波兰文
- 🎭 **情感表达**：35种情感标记，如 (happy) (sad) (angry) (excited) 等
- 🎵 **语调控制**：5种语调标记，如 (whispering) (shouting) (soft tone) 等
- ✨ **特殊效果**：10种特殊效果，如 (laughing) (crying) (sighing) 等
- 🎤 **声音克隆**：支持参考音频进行声音特征克隆

## 🚀 快速开始

### 方式一：使用测试环境（推荐）

我们已经为您创建了完整的测试环境：

```bash
# 测试页面已启动
访问地址: http://localhost:3001/index.html
```

**功能特点**：
- ✅ 完整的Web界面
- ✅ 支持文本输入和语音合成
- ✅ 支持参考音频上传
- ✅ 情感标记快速插入
- ✅ 多语言支持
- ✅ 音频播放和下载

### 方式二：本地部署Fish Speech

#### 1. 环境要求
```bash
# Python 3.8+
# CUDA 11.8+ (GPU推荐)
# 至少8GB内存
```

#### 2. 安装Fish Speech
```bash
# 克隆仓库
git clone https://github.com/fishaudio/fish-speech.git
cd fish-speech

# 安装依赖
pip install -e .

# 下载模型
huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
```

#### 3. 启动API服务
```bash
# 启动Fish Speech API服务器
python -m fish_speech.webui.api --listen 0.0.0.0:8080

# 或使用GPU加速
python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cuda
```

#### 4. 验证安装
```bash
# 测试API是否正常
curl http://localhost:8080/health
```

## 🎮 使用方法

### 基础语音合成

1. **打开测试页面**: http://localhost:3001/index.html
2. **输入文本**：在"合成文本"框中输入要合成的内容
3. **选择语言**：选择对应的语言（支持自动检测）
4. **点击合成**：点击"🎤 开始合成"按钮

### 高级功能

#### 情感表达
在文本中添加情感标记：
```
我今天很开心！(happy) 但是有点累了。(tired)
```

#### 语调控制
```
请小声说话。(whispering) 不要大声喊叫！(shouting)
```

#### 特殊效果
```
哈哈哈，太有趣了！(laughing) 呜呜呜，好难过。(crying)
```

#### 声音克隆
1. 上传参考音频文件（WAV/MP3格式）
2. 输入参考音频对应的文本
3. 输入要合成的新文本
4. 系统会模仿参考音频的声音特征

### 支持的情感标记

**基础情感**：
- (happy) (sad) (angry) (excited) (surprised)
- (satisfied) (delighted) (scared) (worried) (upset)
- (nervous) (frustrated) (depressed) (empathetic)

**复杂情感**：
- (embarrassed) (disgusted) (moved) (proud) (relaxed)
- (grateful) (confident) (interested) (curious) (confused)
- (joyful) (disdainful) (unhappy) (anxious) (hysterical)

**语调控制**：
- (whispering) (shouting) (screaming) (soft tone) (in a hurry tone)

**特殊效果**：
- (laughing) (chuckling) (sobbing) (crying loudly) (sighing)
- (panting) (groaning) (crowd laughing) (background laughter)

## 🔧 API接口

### 健康检查
```bash
GET /api/health
```

### 获取配置
```bash
GET /api/config
```

### 语音合成
```bash
POST /api/fish-speech/synthesize
Content-Type: application/json

{
  "text": "要合成的文本",
  "language": "zh",
  "reference_audio": "base64编码的音频数据（可选）",
  "reference_text": "参考音频对应的文本（可选）"
}
```

## 🎯 最佳实践

### 文本优化
1. **使用标点符号**：正确的标点有助于语调表达
2. **适当断句**：长句子建议分段处理
3. **情感标记**：在合适的位置添加情感标记
4. **语言一致性**：保持文本语言与设置一致

### 声音克隆
1. **高质量音频**：使用清晰、无噪音的参考音频
2. **文本匹配**：参考文本要与音频内容完全一致
3. **合适长度**：参考音频建议3-10秒
4. **语言匹配**：参考音频语言要与合成语言一致

### 性能优化
1. **批量处理**：对于大量文本，建议分批处理
2. **缓存结果**：相同文本可以缓存合成结果
3. **GPU加速**：使用GPU可显著提升合成速度
4. **网络优化**：本地部署比在线服务更快更稳定

## 🐛 故障排除

### 常见问题

**Q: 服务无法启动**
A: 检查Python版本、依赖安装、端口占用

**Q: 合成失败**
A: 检查文本格式、语言设置、模型文件

**Q: 音质不佳**
A: 尝试调整参数、使用更好的参考音频

**Q: 速度较慢**
A: 使用GPU加速、减少文本长度、本地部署

### 日志查看
```bash
# 查看服务器日志
tail -f logs/fish-speech.log

# 查看API请求日志
curl http://localhost:3001/api/health
```

## 📚 更多资源

- **官方仓库**: https://github.com/fishaudio/fish-speech
- **模型下载**: https://huggingface.co/fishaudio/openaudio-s1-mini
- **文档**: https://speech.fish.audio/
- **社区**: https://github.com/fishaudio/fish-speech/discussions

## 🎉 开始体验

现在就访问测试页面开始体验Fish Speech的强大功能：

**🌐 测试地址**: http://localhost:3001/index.html

享受高质量的多语言语音合成体验！🚀
