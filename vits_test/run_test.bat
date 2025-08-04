@echo off
echo ========================================
echo VITS TTS 测试环境启动脚本
echo ========================================

cd /d "%~dp0"

echo 当前目录: %CD%
echo Python版本检查...
python --version

echo.
echo ========================================
echo 1. 环境测试
echo ========================================
python test_environment.py

echo.
echo ========================================
echo 2. 基础推理测试
echo ========================================
python vits_inference.py --text "你好，这是VITS测试" --speaker 0 --output test_basic.wav

echo.
echo ========================================
echo 3. 列出可用说话人
echo ========================================
python vits_inference.py --list-speakers

echo.
echo ========================================
echo 4. 多说话人测试
echo ========================================
python vits_inference.py --text "原神，启动！" --speaker 100 --output test_speaker100.wav
python vits_inference.py --text "崩坏三，出击！" --speaker 200 --output test_speaker200.wav

echo.
echo ========================================
echo 测试完成！
echo ========================================
echo 生成的音频文件：
dir *.wav

echo.
echo 按任意键退出...
pause >nul
