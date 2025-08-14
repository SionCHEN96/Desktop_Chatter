@echo off
chcp 65001 >nul
echo Starting Fish Speech server...
echo Device: cuda
echo.
cd /d "E:\Personal\Desktop_Chatter\fish-speech-test\fish-speech"
call "E:\Personal\Desktop_Chatter\fish-speech-test\fish_speech_env\Scripts\activate.bat"
echo Activated virtual environment
echo Starting API server on port 8081...

REM Set environment variables to reduce verbose output
set PYTHONIOENCODING=utf-8
set TQDM_DISABLE=1
set TRANSFORMERS_VERBOSITY=error
set TOKENIZERS_PARALLELISM=false

REM Start with reduced verbosity
"E:\Personal\Desktop_Chatter\fish-speech-test\fish_speech_env\Scripts\python.exe" tools/api_server.py --listen 0.0.0.0:8081 --device cuda --verbosity warning

echo.
echo Server stopped. Press any key to exit.
pause
