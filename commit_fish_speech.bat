@echo off
echo ========================================
echo Fish Speech Git LFS 提交脚本
echo ========================================

echo.
echo 1. 检查Git状态...
git status

echo.
echo 2. 添加所有文件到Git...
git add .

echo.
echo 3. 检查LFS跟踪的文件...
git lfs ls-files

echo.
echo 4. 提交更改...
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

echo.
echo 5. 推送到远程仓库...
git push origin main

echo.
echo ========================================
echo 提交完成！
echo ========================================
pause
