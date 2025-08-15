@echo off
chcp 65001 >nul 2>&1
title Fish Speech - Clean Mode

echo ========================================
echo Fish Speech API Server - Clean Mode
echo ========================================
echo.

echo [%time%] Initializing clean environment...
echo [%time%] Device: Auto-detect (CUDA/CPU)
echo [%time%] Port: 8081
echo [%time%] Mode: Optimized (Reduced Logging)
echo.

cd /d "%~dp0"

REM Check if virtual environment exists
if not exist "fish_speech_env\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found!
    echo Please run setup first.
    pause
    exit /b 1
)

REM Activate virtual environment
echo [%time%] Activating virtual environment...
call "fish_speech_env\Scripts\activate.bat" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Failed to activate virtual environment
    pause
    exit /b 1
)

REM Check if Fish Speech directory exists
if not exist "fish-speech\tools\api_server.py" (
    echo [ERROR] Fish Speech API server not found!
    echo Please check installation.
    pause
    exit /b 1
)

echo [%time%] Virtual environment activated successfully
echo [%time%] Starting optimized API server...
echo.

REM Set environment variables for clean output
set PYTHONIOENCODING=utf-8
set PYTHONUNBUFFERED=1
set TQDM_DISABLE=1
set TRANSFORMERS_VERBOSITY=error
set TOKENIZERS_PARALLELISM=false
set CUDA_LAUNCH_BLOCKING=0
set PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512
set HF_HUB_DISABLE_PROGRESS_BARS=1
set TRANSFORMERS_NO_ADVISORY_WARNINGS=1

REM Create logs directory
if not exist "logs" mkdir logs

echo [%time%] Environment configured
echo [%time%] Starting Fish Speech API server...
echo [%time%] Press Ctrl+C to stop the server
echo.
echo ========================================
echo Server Output (Filtered)
echo ========================================

REM Start the optimized API server
"fish_speech_env\Scripts\python.exe" start_optimized_api.py 2>logs\fish_speech_error.log

echo.
echo ========================================
echo [%time%] Fish Speech server stopped
echo ========================================
echo.
echo Check logs\fish_speech_error.log for detailed error information
echo Press any key to exit...
pause
