@echo off
echo ========================================
echo Desktop Chatter - Clean Start
echo ========================================
echo.

echo [1/4] Cleaning up ports...
echo Checking for processes using port 8080...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do (
    echo Terminating process %%a using port 8080...
    taskkill /f /pid %%a >nul 2>&1
)

echo Checking for processes using port 8081...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8081 ^| findstr LISTENING') do (
    echo Terminating process %%a using port 8081...
    taskkill /f /pid %%a >nul 2>&1
)

echo Checking for processes using port 3002...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3002 ^| findstr LISTENING') do (
    echo Terminating process %%a using port 3002...
    taskkill /f /pid %%a >nul 2>&1
)

echo Port cleanup completed.
echo.

echo [2/4] Checking Node.js dependencies...
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
    if errorlevel 1 (
        echo Error: Failed to install Node.js dependencies
        pause
        exit /b 1
    )
)

echo [3/4] Checking TTS dependencies...
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

echo [4/4] Starting application...
echo.
echo Starting Desktop Chatter with TTS...
echo - Fish Speech will use port 8081
echo - TTS proxy will use port 3002
echo - Please wait for all services to initialize
echo.

npm start

echo.
echo Application closed.
pause
