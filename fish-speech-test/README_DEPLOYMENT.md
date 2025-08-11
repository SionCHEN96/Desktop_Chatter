# 🐟 Fish Speech 本地部署指南

## 🎯 解决音调问题

您说得对！当前的演示音频确实音调比较奇怪。为了获得真实的高质量Fish Speech语音，我们需要部署本地服务。

## 🚀 快速部署（推荐）

### 一键部署脚本

我为您准备了自动化部署脚本，只需运行：

```bash
# Windows用户（推荐）
quick_deploy.bat

# 或使用Python脚本
python deploy_fish_speech.py
```

### 部署步骤概览

1. **检查环境** - Python 3.8-3.11, Git
2. **创建虚拟环境** - 隔离依赖
3. **克隆仓库** - 下载Fish Speech源码
4. **安装依赖** - PyTorch + Fish Speech
5. **下载模型** - openaudio-s1-mini (约2GB)
6. **启动服务** - 在8080端口运行API

## 📋 系统要求

### 最低要求
- **内存**: 8GB RAM
- **存储**: 10GB 可用空间
- **Python**: 3.8-3.11
- **网络**: 用于下载模型

### 推荐配置
- **内存**: 16GB+ RAM
- **显卡**: NVIDIA GPU (4GB+ VRAM)
- **存储**: SSD硬盘
- **CUDA**: 11.8 或 12.1

## 🔧 手动部署步骤

如果自动脚本失败，可以手动执行：

### 1. 准备环境
```bash
# 创建虚拟环境
python -m venv fish_speech_env

# 激活环境 (Windows)
fish_speech_env\Scripts\activate

# 升级pip
python -m pip install --upgrade pip
```

### 2. 克隆和安装
```bash
# 克隆仓库
git clone https://github.com/fishaudio/fish-speech.git
cd fish-speech

# 安装PyTorch (GPU版本)
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 安装Fish Speech
pip install -e .

# 安装额外依赖
pip install gradio fastapi uvicorn huggingface_hub
```

### 3. 下载模型
```bash
# 下载轻量版模型
huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
```

### 4. 启动服务
```bash
# GPU模式 (推荐)
python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cuda

# CPU模式 (如果没有GPU)
python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cpu
```

## ✅ 验证部署

### 检查服务状态
```bash
# 方法1: 使用我们的检查脚本
node check_fish_speech.js

# 方法2: 直接测试API
curl http://localhost:8080/health

# 方法3: 访问Web界面
# 打开浏览器访问: http://localhost:8080
```

### 测试语音合成
1. 确保Fish Speech服务在8080端口运行
2. 确保我们的测试服务器在3001端口运行 (`npm start`)
3. 访问 http://localhost:3001/index.html
4. 输入文本进行合成
5. 现在应该听到真实的Fish Speech语音！

## 🎵 音质对比

| 模式 | 音质 | 特点 |
|------|------|------|
| 演示模式 | ⭐⭐ | 机械音调，仅用于功能演示 |
| Fish Speech | ⭐⭐⭐⭐⭐ | 自然人声，支持情感表达 |

## 🐛 常见问题

### Q: 部署失败怎么办？
```bash
# 检查Python版本
python --version

# 检查Git
git --version

# 清理并重试
rm -rf fish_speech_env fish-speech
quick_deploy.bat
```

### Q: 模型下载慢？
```bash
# 使用国内镜像
export HF_ENDPOINT=https://hf-mirror.com
huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
```

### Q: GPU内存不足？
```bash
# 使用CPU模式
python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cpu
```

### Q: 端口被占用？
```bash
# 检查端口占用
netstat -ano | findstr :8080

# 使用其他端口
python -m fish_speech.webui.api --listen 0.0.0.0:8081 --device cuda
# 然后修改我们服务器中的LOCAL_API_URL为http://localhost:8081
```

## 📊 性能优化

### GPU加速
- 确保安装CUDA版本的PyTorch
- 使用 `--device cuda` 参数
- 监控GPU使用率: `nvidia-smi`

### 内存优化
- 关闭不必要的程序
- 使用较小的批处理大小
- 考虑使用CPU模式

## 🎉 部署成功后

### 享受真实语音合成
- 🎵 **自然音质**: 告别机械音调
- 🎭 **情感表达**: 支持(happy) (sad)等标记
- 🌍 **多语言**: 13种语言高质量合成
- 🎤 **声音克隆**: 上传参考音频

### 下一步
1. 尝试不同的情感标记
2. 测试多种语言
3. 上传参考音频进行声音克隆
4. 调节合成参数获得最佳效果

---

## 🚀 立即开始

**Windows用户**: 双击运行 `quick_deploy.bat`

**其他用户**: 运行 `python deploy_fish_speech.py`

**需要帮助**: 查看 `DEPLOY_LOCAL_FISH_SPEECH.md` 获取详细说明

准备好享受真正的Fish Speech语音合成了吗？🎵
