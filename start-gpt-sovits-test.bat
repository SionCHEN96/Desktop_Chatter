@echo off
echo ========================================
echo   GPT-SoVITS 测试服务器启动脚本
echo ========================================
echo.

echo 正在启动GPT-SoVITS测试服务器...
echo.

echo 📋 使用说明:
echo 1. 确保GPT-SoVITS服务运行在 http://localhost:9880
echo 2. 服务启动后会自动打开测试页面
echo 3. 按 Ctrl+C 停止服务器
echo.

echo 🚀 启动中...
node gpt-sovits-server.js

pause
