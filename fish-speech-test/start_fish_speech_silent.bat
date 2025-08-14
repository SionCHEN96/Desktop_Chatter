@echo off
chcp 65001 >nul 2>&1

echo [%time%] Starting Fish Speech server (Silent Mode)...
echo [%time%] Device: cuda
echo [%time%] Port: 8081
echo.

cd /d "E:\Personal\Desktop_Chatter\fish-speech-test\fish-speech"

REM Activate virtual environment
call "E:\Personal\Desktop_Chatter\fish-speech-test\fish_speech_env\Scripts\activate.bat" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

echo [%time%] Virtual environment activated
echo [%time%] Starting API server...

REM Set environment variables for clean output
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1
set TQDM_DISABLE=1
set TRANSFORMERS_VERBOSITY=error
set TOKENIZERS_PARALLELISM=false
set CUDA_LAUNCH_BLOCKING=0
set PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512

REM Create log directory if it doesn't exist
if not exist "logs" mkdir logs

REM Start Fish Speech with minimal output
echo [%time%] Fish Speech is starting, please wait...
echo [%time%] Logs will be written to logs/fish_speech.log
echo [%time%] Use Ctrl+C to stop the server
echo.

"E:\Personal\Desktop_Chatter\fish-speech-test\fish_speech_env\Scripts\python.exe" tools/api_server.py ^
    --listen 0.0.0.0:8081 ^
    --device cuda ^
    --verbosity error ^
    2>logs/fish_speech_error.log

echo.
echo [%time%] Fish Speech server stopped
echo Press any key to exit...
pause
