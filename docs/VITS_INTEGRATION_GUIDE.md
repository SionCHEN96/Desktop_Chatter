# VITS语音合成集成指南

## 概述

本项目已成功集成VITS语音合成模型，实现了AI回复后自动播放香菱语音的功能。

## 功能特性

- ✅ **自动语音合成**: AI回复后自动生成香菱的语音
- ✅ **异步处理**: 语音合成不阻塞AI响应显示
- ✅ **音频管理**: 自动播放生成的语音文件
- ✅ **文件清理**: 自动清理旧的音频文件
- ✅ **错误处理**: 完善的错误处理和日志记录

## 技术架构

### 1. 音频服务架构

```
主进程 (Main Process)
├── AudioService - 音频服务管理
├── VITSService - VITS模型调用
└── Python脚本 - 语音合成推理

渲染进程 (Renderer Process)
├── AudioManager - 音频播放管理
└── App组件 - 音频事件处理
```

### 2. 核心组件

#### AudioService (src/main/services/audioService.js)
- 管理语音合成流程
- 调用VITSService进行语音生成
- 处理文本清理和预处理

#### VITSService (src/core/audio/VITSService.js)
- 封装VITS模型调用
- 管理Python脚本执行
- 处理音频文件生成

#### AudioManager (src/core/audio/AudioManager.js)
- 管理音频播放
- 控制音量和播放状态
- 处理音频事件

#### Python推理脚本 (scripts/vits_simple_inference.py)
- 执行VITS模型推理
- 生成WAV格式音频文件
- 支持多说话人模型

## 使用方法

### 1. 环境准备

确保已安装Python依赖：
```bash
pip install numpy scipy soundfile
```

### 2. 模型文件

项目已包含香菱的VITS模型文件：
- `public/VTS_Models/config.json` - 模型配置
- `public/VTS_Models/G_953000.pth` - 模型权重
- 香菱的Speaker ID: 98

### 3. 自动语音播放

当AI回复消息时，系统会自动：
1. 提取AI响应文本
2. 清理和预处理文本
3. 调用VITS模型生成香菱语音
4. 自动播放生成的音频

### 4. 手动测试

可以使用以下命令手动测试语音合成：

```bash
python scripts/vits_simple_inference.py \
  --config "public/VTS_Models/config.json" \
  --model "public/VTS_Models/G_953000.pth" \
  --text "你好，我是香菱！" \
  --speaker 98 \
  --output "public/generated_audio/test.wav"
```

## 配置选项

### 音频设置

在 `src/core/audio/AudioManager.js` 中可以调整：
- 默认音量: `this.volume = 0.8`
- 音频格式支持

在 `src/main/services/audioService.js` 中可以调整：
- TTS启用状态: `this.ttsEnabled = true`
- 文本长度限制: 200字符
- 清理间隔: 1小时

### VITS模型设置

在 `src/core/audio/VITSService.js` 中可以调整：
- 香菱Speaker ID: 98
- 输出目录: `public/generated_audio`
- 推理超时: 30秒

## 文件结构

```
src/
├── core/audio/
│   ├── AudioManager.js      # 音频播放管理
│   ├── VITSService.js       # VITS模型服务
│   └── index.js             # 模块导出
├── main/services/
│   └── audioService.js      # 主进程音频服务
└── renderer/components/
    └── App.js               # 音频事件处理

scripts/
├── vits_simple_inference.py # VITS推理脚本
├── find_xiangling.py        # 查找香菱Speaker ID
└── test_python.py           # Python环境测试

public/
├── VTS_Models/              # VITS模型文件
│   ├── config.json
│   └── G_953000.pth
└── generated_audio/         # 生成的音频文件
```

## 工作流程

1. **用户发送消息** → AI服务生成响应
2. **AI响应返回** → 触发语音合成
3. **文本预处理** → 清理和格式化文本
4. **VITS推理** → Python脚本生成音频
5. **音频播放** → 自动播放香菱语音

## 故障排除

### 常见问题

1. **Python依赖缺失**
   ```bash
   pip install numpy scipy soundfile
   ```

2. **音频文件无法播放**
   - 检查 `public/generated_audio/` 目录权限
   - 确认音频文件格式为WAV

3. **VITS推理失败**
   - 检查模型文件是否完整
   - 确认Python脚本路径正确

### 调试方法

1. **查看日志**: 检查控制台输出的详细日志
2. **测试Python脚本**: 手动运行推理脚本
3. **音频测试页面**: 使用 `tests/test_audio_functionality.html`

## 性能优化

- 音频文件自动清理（24小时）
- 异步语音合成，不阻塞UI
- 重复文本检测，避免重复生成
- 文本长度限制，控制生成时间

## 扩展功能

### 支持更多角色

要添加其他角色的语音：
1. 在 `scripts/find_xiangling.py` 中查找角色的Speaker ID
2. 修改 `VITSService.js` 中的speaker选择逻辑
3. 根据AI响应内容选择不同的角色语音

### 情感语音

可以根据AI响应的情感内容选择不同的语音风格：
- 开心时使用较高的语调
- 悲伤时使用较低的语调
- 兴奋时使用较快的语速

## 注意事项

1. **模型版权**: 请确保VITS模型的使用符合相关版权要求
2. **性能影响**: 语音合成会消耗一定的CPU资源
3. **存储空间**: 生成的音频文件会占用磁盘空间
4. **网络要求**: 无需网络连接，完全本地运行
