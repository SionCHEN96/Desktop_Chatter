@echo off
echo ========================================
echo Git LFS 状态检查
echo ========================================

echo.
echo 1. Git版本信息:
git --version

echo.
echo 2. Git LFS版本信息:
git lfs version

echo.
echo 3. 当前Git状态:
git status --porcelain

echo.
echo 4. LFS跟踪的文件类型:
git lfs track

echo.
echo 5. 已跟踪的LFS文件:
git lfs ls-files

echo.
echo 6. 检查大文件 (>10MB):
echo 正在扫描大文件...
for /r %%f in (*) do (
    if %%~zf gtr 10485760 (
        echo %%f - %%~zf bytes
    )
)

echo.
echo 7. Fish Speech相关文件状态:
echo 检查模型文件...
if exist "fish-speech-test\checkpoints\openaudio-s1-mini\model.pth" (
    echo ✓ 主模型文件存在
) else (
    echo ✗ 主模型文件不存在
)

if exist "fish-speech-test\checkpoints\openaudio-s1-mini\codec.pth" (
    echo ✓ 编解码器文件存在
) else (
    echo ✗ 编解码器文件不存在
)

if exist "fish-speech-test\ffmpeg.exe" (
    echo ✓ FFmpeg可执行文件存在
) else (
    echo ✗ FFmpeg可执行文件不存在
)

echo.
echo ========================================
echo 检查完成！
echo ========================================
pause
