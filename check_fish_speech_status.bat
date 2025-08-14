@echo off
chcp 65001 >nul 2>&1
title Fish Speech Status Check

echo ========================================
echo Fish Speech Service Status Check
echo ========================================
echo.

echo [%time%] Checking Fish Speech service on port 8081...
echo.

REM Check if port 8081 is in use
echo Checking port 8081...
netstat -ano | findstr :8081
if errorlevel 1 (
    echo [ERROR] No process found on port 8081
    echo Fish Speech service is not running
) else (
    echo [INFO] Process found on port 8081
)

echo.
echo Checking Fish Speech API health...

REM Try to connect to Fish Speech API
curl -s -o nul -w "HTTP Status: %%{http_code}\n" http://localhost:8081/v1/health
if errorlevel 1 (
    echo [ERROR] Cannot connect to Fish Speech API
    echo Please check if Fish Speech is running
) else (
    echo [INFO] Fish Speech API is responding
)

echo.
echo Checking TTS proxy service on port 3002...

REM Check if port 3002 is in use
netstat -ano | findstr :3002
if errorlevel 1 (
    echo [ERROR] No process found on port 3002
    echo TTS proxy service is not running
) else (
    echo [INFO] TTS proxy service is running on port 3002
)

echo.
echo ========================================
echo Status Check Complete
echo ========================================
echo.

echo To start Fish Speech service:
echo   cd fish-speech-test
echo   start_fish_speech_clean.bat
echo.

echo To start the main application:
echo   npm start
echo.

pause
