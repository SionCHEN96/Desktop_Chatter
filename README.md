# Desktop Chatter

桌面AI聊天助手，集成Fish Speech TTS功能和FBX角色渲染。

## 📦 安装指南

### 1. 环境准备

#### 安装CUDA（根据GPU选择版本）

**RTX 5080/5090用户（推荐）:**
```bash
# 下载并安装CUDA 12.8+
# https://developer.nvidia.com/cuda-downloads
```

**RTX 30/40系列用户:**
```bash
# 下载并安装CUDA 11.8+
# https://developer.nvidia.com/cuda-11-8-0-download-archive
```

#### 安装PyTorch（匹配CUDA版本）

**CUDA 12.8用户:**
```bash
pip install torch>=2.5.1 torchaudio --index-url https://download.pytorch.org/whl/cu128
```

**CUDA 11.8用户:**
```bash
pip install torch>=2.1.0 torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**CPU版本（不推荐，仅用于测试）:**
```bash
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cpu
```

### 2. 项目依赖安装

```bash
# 安装Node.js依赖
npm install

# 安装Fish Speech依赖
cd fish-speech-test
pip install -r requirements.txt  # 如果有的话
```

## 🚀 快速启动

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

### 基础要求
- **Python**: 3.8-3.11
- **Node.js**: 16+
- **内存**: 8GB+ RAM（推荐12GB+用于流畅推理）
- **存储**: 10GB+ 可用空间

### GPU和CUDA要求

#### 🎯 推荐配置（RTX 5080及以上）
- **GPU**: RTX 5080 / RTX 5090 / RTX 4080 / RTX 4090
- **CUDA**: 12.8+ (支持Compute Capability 8.9+)
- **PyTorch**: 2.5.1+ with CUDA 12.8
- **VRAM**: 12GB+ (RTX 5080: 16GB, RTX 5090: 32GB)
- **性能**: 最佳TTS合成速度，支持长文本实时合成

#### ⚡ 兼容配置（RTX 30/40系列）
- **GPU**: RTX 3060 / RTX 3070 / RTX 3080 / RTX 4060 / RTX 4070
- **CUDA**: 11.8+ (支持Compute Capability 8.6+)
- **PyTorch**: 2.1.0+ with CUDA 11.8
- **VRAM**: 8GB+ (推荐12GB+)
- **性能**: 良好的TTS合成速度，适合中等长度文本

#### 💻 最低配置（GTX 16/RTX 20系列）
- **GPU**: GTX 1660 / RTX 2060 / RTX 2070
- **CUDA**: 11.0+ (支持Compute Capability 7.5+)
- **PyTorch**: 2.0.0+ with CUDA 11.0
- **VRAM**: 6GB+ (可能需要调整batch size）
- **性能**: 基础TTS功能，较长文本需要分段处理

#### 🔍 检测当前系统配置

**方法1: 使用系统命令**
```bash
# 检测CUDA版本
nvcc --version

# 检测GPU信息和驱动版本
nvidia-smi
```

**方法2: 使用Python检测（推荐）**
```bash
# 进入fish-speech环境
cd fish-speech-test

# 检测PyTorch和CUDA兼容性
python -c "
import torch
print('='*50)
print('系统配置检测结果')
print('='*50)
print(f'PyTorch版本: {torch.__version__}')
print(f'CUDA可用: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA版本: {torch.version.cuda}')
    print(f'GPU型号: {torch.cuda.get_device_name(0)}')
    print(f'GPU内存: {torch.cuda.get_device_properties(0).total_memory / 1024**3:.1f}GB')
    print(f'计算能力: {torch.cuda.get_device_capability(0)}')
else:
    print('未检测到CUDA GPU')
print('='*50)
"
```

**配置建议生成器**
```bash
# 根据检测结果获取推荐配置
python -c "
import torch
if torch.cuda.is_available():
    gpu_name = torch.cuda.get_device_name(0)
    vram_gb = torch.cuda.get_device_properties(0).total_memory / 1024**3
    cuda_version = torch.version.cuda

    print(f'检测到: {gpu_name} ({vram_gb:.0f}GB VRAM)')
    print(f'当前CUDA: {cuda_version}')
    print()

    if '5080' in gpu_name or '5090' in gpu_name:
        print('🎯 推荐配置: RTX 50系列')
        print('CUDA: 12.8+')
        print('PyTorch: pip install torch>=2.5.1 torchaudio --index-url https://download.pytorch.org/whl/cu128')
        print('设置: 最高质量，启用--compile')
    elif '4080' in gpu_name or '4090' in gpu_name or '3080' in gpu_name or '3090' in gpu_name:
        print('⚡ 推荐配置: RTX 30/40系列高端')
        print('CUDA: 11.8+')
        print('PyTorch: pip install torch>=2.1.0 torchaudio --index-url https://download.pytorch.org/whl/cu118')
        print('设置: 高质量')
    elif vram_gb >= 8:
        print('💻 推荐配置: 中端GPU')
        print('CUDA: 11.8+')
        print('PyTorch: pip install torch>=2.1.0 torchaudio --index-url https://download.pytorch.org/whl/cu118')
        print('设置: 中等质量，可能需要调整batch size')
    else:
        print('⚠️ 警告: VRAM不足8GB')
        print('建议: 使用CPU模式或升级GPU')
else:
    print('❌ 未检测到CUDA GPU，将使用CPU模式（性能较差）')
"
```

## 📁 项目结构

```
Desktop_Chatter/
├── src/                   # 主应用源码
│   ├── main/             # Electron主进程
│   ├── renderer/         # 渲染进程
│   ├── core/             # 核心功能
│   │   ├── character/    # FBX角色系统
│   │   ├── animation/    # 动画状态机
│   │   └── rendering/    # 高质量渲染器
│   └── config/           # 配置文件
├── public/               # 静态资源
│   ├── models/          # FBX模型文件
│   └── Audio/           # 音频资源
├── fish-speech-test/     # TTS服务
│   ├── fish-speech/     # Fish Speech核心
│   ├── generated_audio/ # 生成的音频文件
│   └── server.js        # TTS代理服务器
├── package.json         # Node.js依赖（无VRM）
└── README.md           # 项目说明
```

## 🎭 功能特性

- **🤖 AI聊天**: 智能对话系统，支持上下文记忆
- **🎵 TTS语音合成**: Fish Speech高质量语音合成
- **🎨 FBX角色渲染**: 3D角色显示和动画
- **🔊 语音克隆**: 基于参考音频的声音克隆
- **⚡ 分段TTS**: 长文本智能分段，提升合成速度
- **🎮 动画系统**: 丰富的角色动画和表情
- **💾 记忆系统**: ChromaDB向量数据库存储对话历史

## ⚡ 性能优化建议

### RTX 5080/5090用户
```bash
# 启用编译优化（10倍速度提升）
python tools/run_webui.py --compile

# 使用最新CUDA优化
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
```

### RTX 30/40系列用户
```bash
# 调整batch size以适应VRAM
# 在fish-speech配置中设置较小的chunk_length
chunk_length: 100  # 默认200，可降低到100

# 启用混合精度
--half  # 使用FP16减少VRAM使用
```

### 低端GPU用户
```bash
# 强制CPU模式（应急使用）
--device cpu

# 或使用更小的模型
--model-size small
```

## 🔧 故障排除

### CUDA相关问题

**问题**: `RuntimeError: CUDA out of memory`
```bash
# 解决方案1: 降低batch size
export PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:256

# 解决方案2: 使用分段TTS
# 在配置中启用自动分段，单段长度<50字符
```

**问题**: `CUDA version mismatch`
```bash
# 检查CUDA和PyTorch版本兼容性
python -c "import torch; print(torch.version.cuda)"
nvcc --version

# 重新安装匹配的PyTorch版本
pip uninstall torch torchaudio
pip install torch==2.5.1 torchaudio --index-url https://download.pytorch.org/whl/cu128
```

### TTS服务问题

**问题**: Fish Speech启动失败
```bash
# 检查端口占用
netstat -ano | findstr :8081

# 清理进程
taskkill /f /im python.exe
```

**问题**: 音频合成超时
```bash
# 启用分段TTS（推荐）
# 文本长度>30字符自动分段
# 单段合成时间<15秒
```

## 📊 性能基准测试

| GPU型号 | VRAM | CUDA | PyTorch | 短文本(10字) | 长文本(100字) | 推荐设置 |
|---------|------|------|---------|-------------|--------------|----------|
| RTX 5090 | 32GB | 12.8 | 2.5.1 | <1秒 | <5秒 | 最高质量 |
| RTX 5080 | 16GB | 12.8 | 2.5.1 | <1秒 | <8秒 | 高质量 |
| RTX 4090 | 24GB | 11.8 | 2.1.0 | <2秒 | <10秒 | 高质量 |
| RTX 4080 | 16GB | 11.8 | 2.1.0 | <2秒 | <12秒 | 中等质量 |
| RTX 3080 | 10GB | 11.8 | 2.1.0 | <3秒 | <15秒 | 中等质量 |
| RTX 3060 | 8GB | 11.8 | 2.1.0 | <5秒 | <25秒 | 基础质量 |

## 🔄 更新日志

### v2.0.0 (当前版本)
- ✅ **重大更新**: 从VRM模型迁移到FBX模型
- ✅ **依赖优化**: 移除@pixiv/three-vrm依赖，减少包体积
- ✅ **CUDA支持**: 添加RTX 5080/5090 CUDA 12.8支持
- ✅ **性能提升**: 优化TTS合成速度和内存使用
- ✅ **文档完善**: 详细的CUDA/PyTorch兼容性说明

### v1.x.x (历史版本)
- ✅ 基础TTS功能实现
- ✅ VRM角色渲染（已废弃）
- ✅ 分段TTS优化
- ✅ 语音克隆功能

## 🤝 贡献指南

### 开发环境设置
```bash
# 克隆项目
git clone <repository-url>
cd Desktop_Chatter

# 安装依赖
npm install

# 开发模式启动
npm run dev
```

### 代码规范
- **JavaScript**: 使用ES6+模块语法
- **Python**: 遵循PEP 8规范
- **提交**: 使用语义化提交信息

### 测试
```bash
# 运行主应用
npm start

# 测试TTS功能
cd fish-speech-test
node server.js
```

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Fish Speech](https://github.com/fishaudio/fish-speech) - 高质量TTS引擎
- [Three.js](https://threejs.org/) - 3D渲染引擎
- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [ChromaDB](https://www.trychroma.com/) - 向量数据库

---

**注意**: 本项目需要NVIDIA GPU支持。CPU模式仅供测试使用，性能较差。推荐使用RTX 30系列及以上GPU获得最佳体验。
