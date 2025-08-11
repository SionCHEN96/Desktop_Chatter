# 🐟 本地Fish Speech服务部署指南

## 🎯 目标
部署本地Fish Speech服务，替换演示音频，获得真实的高质量语音合成。

## 📋 系统要求

### 硬件要求
- **内存**: 至少8GB RAM（推荐16GB+）
- **显卡**: NVIDIA GPU（推荐4GB+ VRAM）
- **存储**: 至少10GB可用空间
- **CPU**: 支持AVX指令集

### 软件要求
- **Python**: 3.8-3.11（推荐3.10）
- **CUDA**: 11.8或12.1（如果使用GPU）
- **Git**: 用于克隆仓库

## 🚀 快速部署

### 方法一：自动化脚本（推荐）

我为您创建了自动化部署脚本：

```bash
# 在fish-speech-test目录下运行
python deploy_fish_speech.py
```

### 方法二：手动部署

#### 1. 创建Python环境
```bash
# 创建虚拟环境
python -m venv fish_speech_env

# 激活环境（Windows）
fish_speech_env\Scripts\activate

# 激活环境（Linux/Mac）
source fish_speech_env/bin/activate
```

#### 2. 克隆Fish Speech仓库
```bash
git clone https://github.com/fishaudio/fish-speech.git
cd fish-speech
```

#### 3. 安装依赖
```bash
# 安装PyTorch（GPU版本）
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118

# 安装Fish Speech
pip install -e .

# 安装额外依赖
pip install gradio fastapi uvicorn
```

#### 4. 下载模型
```bash
# 使用huggingface-cli下载
pip install huggingface_hub
huggingface-cli download fishaudio/fish-speech-1.4 --local-dir checkpoints/fish-speech-1.4

# 或下载轻量版本
huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
```

#### 5. 启动API服务
```bash
# 启动Fish Speech API服务器
python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cuda

# 如果没有GPU，使用CPU
python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cpu
```

## 🔧 配置验证

### 检查服务状态
```bash
# 测试API是否正常
curl http://localhost:8080/health

# 或访问Web界面
http://localhost:8080
```

### 测试语音合成
```bash
# 使用我们的测试服务器测试
curl -X POST http://localhost:3001/api/fish-speech/synthesize \
  -H "Content-Type: application/json" \
  -d '{"text":"你好，这是真实的Fish Speech合成！","language":"zh"}'
```

## 🎛️ 高级配置

### GPU优化
```bash
# 检查CUDA是否可用
python -c "import torch; print(torch.cuda.is_available())"

# 检查GPU内存
nvidia-smi
```

### 模型选择
- **fish-speech-1.4**: 最新版本，质量最高，需要更多资源
- **openaudio-s1-mini**: 轻量版本，速度快，质量良好

### 性能调优
```python
# 在启动时添加参数
--batch-size 4          # 批处理大小
--max-length 1000       # 最大文本长度
--temperature 0.7       # 生成温度
--top-p 0.8            # Top-p采样
```

## 🐛 常见问题

### Q: 安装失败
```bash
# 更新pip
python -m pip install --upgrade pip

# 清理缓存
pip cache purge

# 使用国内镜像
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple/ torch
```

### Q: CUDA错误
```bash
# 检查CUDA版本
nvcc --version

# 重新安装对应版本的PyTorch
pip uninstall torch torchvision torchaudio
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Q: 内存不足
```bash
# 使用CPU模式
python -m fish_speech.webui.api --device cpu

# 或减少批处理大小
python -m fish_speech.webui.api --batch-size 1
```

### Q: 模型下载慢
```bash
# 使用镜像站点
export HF_ENDPOINT=https://hf-mirror.com
huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
```

## 📊 性能对比

| 模式 | 质量 | 速度 | 资源需求 |
|------|------|------|----------|
| 演示模式 | ⭐⭐ | ⭐⭐⭐⭐⭐ | 极低 |
| CPU模式 | ⭐⭐⭐⭐ | ⭐⭐ | 中等 |
| GPU模式 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 高 |

## 🎉 部署完成后

### 验证步骤
1. ✅ Fish Speech服务在8080端口运行
2. ✅ 我们的测试服务器在3001端口运行
3. ✅ 访问 http://localhost:3001/index.html
4. ✅ 合成音频，听到真实的Fish Speech语音

### 享受高质量TTS
- 🎵 **真实语音**: 不再是演示音频
- 🎭 **情感表达**: 支持丰富的情感标记
- 🌍 **多语言**: 13种语言高质量合成
- 🎤 **声音克隆**: 上传参考音频克隆声音

---

**准备好开始部署了吗？运行自动化脚本或按照手动步骤操作！** 🚀
