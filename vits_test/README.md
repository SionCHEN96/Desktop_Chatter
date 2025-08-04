# VITS TTS 测试环境

这是一个独立的VITS语音合成测试环境，用于验证模型和环境配置。

## 📁 文件结构

```
vits_test/
├── README.md              # 说明文档
├── requirements.txt       # Python依赖
├── test_environment.py    # 环境测试脚本
├── vits_inference.py      # VITS推理脚本
├── models.py             # 模型定义（简化版）
├── run_test.bat          # Windows启动脚本
└── outputs/              # 输出音频目录
```

## 🚀 快速开始

### 1. 环境准备

确保已安装Python 3.7+和PyTorch：

```bash
# 检查Python版本
python --version

# 检查PyTorch和CUDA
python -c "import torch; print(f'PyTorch: {torch.__version__}'); print(f'CUDA: {torch.cuda.is_available()}')"
```

### 2. 安装依赖

```bash
cd vits_test
pip install -r requirements.txt
```

### 3. 运行测试

#### 方式一：使用批处理脚本（Windows）
```bash
run_test.bat
```

#### 方式二：手动运行

**环境测试：**
```bash
python test_environment.py
```

**基础推理测试：**
```bash
python vits_inference.py --text "你好，这是VITS测试" --output test.wav
```

**列出说话人：**
```bash
python vits_inference.py --list-speakers
```

**指定说话人：**
```bash
python vits_inference.py --text "原神，启动！" --speaker 100 --output genshin.wav
```

## 📋 命令行参数

### vits_inference.py

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--config` | `../public/VTS_Models/config.json` | 配置文件路径 |
| `--model` | `../public/VTS_Models/G_953000.pth` | 模型文件路径 |
| `--text` | `你好，这是VITS语音合成测试。` | 要合成的文本 |
| `--speaker` | `0` | 说话人ID |
| `--output` | `output.wav` | 输出音频文件 |
| `--device` | `cuda` | 设备类型 (cuda/cpu) |
| `--list-speakers` | - | 列出所有说话人 |

## 🎯 支持的说话人

根据配置文件，该模型支持804个说话人，包括：

- **赛马娘角色**：特别周、无声铃鹿、东海帝皇等
- **原神角色**：琴、空、丽莎、芭芭拉、凯亚等  
- **崩坏3角色**：琪亚娜、雷电芽衣、布洛妮娅等
- **日语配音**：同角色的日语版本

## 🔧 环境测试项目

`test_environment.py` 会检查以下项目：

1. **Python版本** - 确保>=3.7
2. **PyTorch环境** - 版本、CUDA支持、GPU信息
3. **音频处理库** - NumPy、SciPy、Librosa、SoundFile
4. **模型文件** - 配置文件和模型权重文件
5. **系统信息** - 操作系统、内存等
6. **简单合成** - 基础的文本到语音转换

## 📊 预期输出

成功运行后，你应该看到：

```
=== VITS TTS 推理测试 ===
设备: cuda
配置文件: ../public/VTS_Models/config.json
模型文件: ../public/VTS_Models/G_953000.pth
配置加载完成
支持的说话人数量: 804
采样率: 22050
正在合成文本: 你好，这是VITS测试
说话人ID: 0
文本序列长度: 12
音频生成完成，时长: 1.20秒
音频已保存到: test.wav

合成完成！
输出文件: test.wav
音频时长: 1.20秒
```

## ⚠️ 注意事项

### 当前限制

1. **简化实现**：当前版本是简化的测试实现，生成的是模拟音频（正弦波）
2. **模型加载**：真实的VITS模型加载需要完整的模型定义
3. **文本处理**：文本预处理功能简化，不支持复杂的语音学特征

### 下一步开发

1. **完整模型**：实现完整的VITS模型架构
2. **文本处理**：添加中文分词、拼音转换、语音学特征
3. **性能优化**：模型量化、推理加速
4. **Web界面**：Gradio或FastAPI接口

## 🐛 故障排除

### 常见问题

**Q: CUDA不可用**
```bash
# 检查CUDA安装
nvidia-smi
# 重新安装PyTorch CUDA版本
pip install torch torchaudio --index-url https://download.pytorch.org/whl/cu118
```

**Q: 模型文件不存在**
```bash
# 检查模型文件路径
ls -la ../public/VTS_Models/
# 确保模型文件在正确位置
```

**Q: 依赖安装失败**
```bash
# 使用conda环境
conda create -n vits python=3.9
conda activate vits
pip install -r requirements.txt
```

**Q: 音频播放问题**
```bash
# 安装音频播放器
pip install pygame  # 或使用系统默认播放器
```

## 📚 参考资料

- [VITS官方论文](https://arxiv.org/abs/2106.06103)
- [VITS官方代码](https://github.com/jaywalnut310/vits)
- [PyTorch官方文档](https://pytorch.org/docs/)

## 🤝 贡献

欢迎提交Issue和Pull Request来改进这个测试环境！
