@echo off
chcp 65001 >nul
echo ========================================
echo Desktop Chatter - TTS 测试环境启动
echo ========================================
echo.

echo [1/3] 启动 Fish Speech TTS 服务...
cd /d "%~dp0fish-speech-test"
start "Fish Speech Server" cmd /c "fish_speech_env\Scripts\activate.bat && cd fish-speech && python tools/api_server.py --listen 0.0.0.0:8081 --device cpu && pause"

echo 等待 Fish Speech 服务启动...
timeout /t 5 /nobreak >nul

echo [2/3] 启动 Web 服务器...
start "Web Server" cmd /c "node server.js && pause"

echo 等待 Web 服务器启动...
timeout /t 3 /nobreak >nul

echo [3/3] 打开测试页面...
timeout /t 2 /nobreak >nul
start http://localhost:3003/tts_test.html

echo.
echo ========================================
echo 🚀 启动完成！
echo ========================================
echo 📝 测试页面: http://localhost:3003/tts_test.html
echo 🔧 Fish Speech API: http://localhost:8081
echo 💡 主应用TTS服务: http://localhost:3002
echo.
echo 按任意键关闭此窗口...
pause >nul
