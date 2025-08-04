# Git LFS 提交指南

## 🎯 当前状态

Fish Speech 测试环境已经设置完成，包含以下大文件：
- `fish-speech-test/checkpoints/openaudio-s1-mini/model.pth` (~1GB)
- `fish-speech-test/checkpoints/openaudio-s1-mini/codec.pth` (~100MB)
- `fish-speech-test/ffmpeg.exe` (~100MB)
- `fish-speech-test/ffprobe.exe` (~100MB)
- `fish-speech-test/asr-label-win-x64.exe` (~50MB)

## 📋 手动提交步骤

### 1. 检查LFS配置
```cmd
git lfs track
```

### 2. 添加文件到Git (可能需要较长时间)
```cmd
git add .
```

### 3. 检查LFS文件状态
```cmd
git lfs ls-files
```

### 4. 提交更改
```cmd
git commit -m "Add Fish Speech test environment with LFS support

- Added complete Fish Speech testing environment
- Configured Git LFS for model files and executables  
- Downloaded OpenAudio-S1-mini model files
- Set up Python virtual environment with all dependencies
- Added comprehensive documentation and guides
- Configured proper .gitignore for Python and Fish Speech files

Features:
- Zero-shot voice cloning
- Multi-language TTS support
- Emotion control
- WebUI interface
- CPU-compatible setup"
```

### 5. 推送到远程仓库
```cmd
git push origin main
```

## ⚠️ 注意事项

1. **大文件处理**: 模型文件很大，添加和推送可能需要较长时间
2. **网络要求**: 推送LFS文件需要稳定的网络连接
3. **存储配额**: GitHub LFS有存储和带宽限制
4. **分批提交**: 如果文件太大，可以考虑分批提交

## 🔧 故障排除

### 如果git add卡住
```cmd
# 取消当前操作
Ctrl+C

# 分批添加文件
git add fish-speech-test/checkpoints/
git add fish-speech-test/*.exe
git add fish-speech-test/docs/
git add fish-speech-test/tools/
git add fish-speech-test/*.md
git add fish-speech-test/*.py
git add fish-speech-test/*.bat
git add fish-speech-test/*.sh
```

### 如果LFS文件没有被正确跟踪
```cmd
# 手动添加LFS跟踪
git lfs track "fish-speech-test/checkpoints/**"
git lfs track "fish-speech-test/*.exe"
git lfs track "*.pth"
git lfs track "*.tiktoken"

# 重新添加文件
git add .gitattributes
git add fish-speech-test/
```

### 检查文件大小
```cmd
# 在PowerShell中检查大文件
Get-ChildItem -Recurse fish-speech-test/ | Where-Object {$_.Length -gt 10MB} | Select-Object Name, Length
```

## 📊 预期结果

提交成功后，你将拥有：
- ✅ 完整的Fish Speech测试环境
- ✅ 所有模型文件通过LFS管理
- ✅ 完整的文档和指南
- ✅ 可重现的环境设置

## 🚀 下次使用

克隆仓库时使用：
```cmd
git clone --recursive https://github.com/your-username/your-repo.git
cd your-repo
git lfs pull
```
