@echo off
echo ========================================
echo Desktop Chatter with TTS Integration
echo ========================================
echo.

echo [1/3] Checking Node.js dependencies...
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

echo [2/3] Checking Fish Speech TTS dependencies...
cd fish-speech-test
if not exist "node_modules" (
    echo Installing TTS server dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install TTS server dependencies
        pause
        exit /b 1
    )
)
cd ..

echo [3/3] Starting Desktop Chatter with TTS...
echo.
echo Starting application...
echo - TTS services will start automatically
echo - Please wait for all services to initialize
echo - Check console for service status
echo.

npm start

echo.
echo Application closed.
pause
