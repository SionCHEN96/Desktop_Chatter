@echo off
echo Starting Fish Speech TTS Test Environment...
echo.

if not exist "fish-speech-test" (
    echo Error: fish-speech-test directory not found
    pause
    exit /b 1
)

cd fish-speech-test

if not exist "node_modules" (
    echo Installing Node.js dependencies...
    call npm install
    if errorlevel 1 (
        echo Node.js dependency installation failed
        pause
        exit /b 1
    )
)

echo Starting Fish Speech service...
start "Fish Speech Service" /min cmd /c start_fish_speech.bat

echo Waiting for Fish Speech service to start...
ping 127.0.0.1 -n 11 > nul

echo Starting Web server...
start "Web Server" /min cmd /c node server.js

echo Waiting for Web server to start...
ping 127.0.0.1 -n 6 > nul

echo Opening test page...
start http://localhost:3002/tts_test.html

echo.
echo TTS test environment started successfully!
echo.
echo Test page opened:
echo    - TTS Comprehensive Test: http://localhost:3002/tts_test.html
echo.
echo Press any key to stop all services and exit...
pause > nul

echo Stopping services...
taskkill /f /im python.exe 2>nul
taskkill /f /im node.exe 2>nul
echo Services stopped
