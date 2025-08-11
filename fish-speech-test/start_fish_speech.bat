@echo off
echo Starting Fish Speech server...
echo Device: cuda
echo.
cd /d "E:\Personal\Desktop_Chatter\fish-speech-test\fish-speech"
call "E:\Personal\Desktop_Chatter\fish-speech-test\fish_speech_env\Scripts\activate.bat"
echo Activated virtual environment
echo Starting API server on port 8080...
"E:\Personal\Desktop_Chatter\fish-speech-test\fish_speech_env\Scripts\python.exe" tools/api_server.py --listen 0.0.0.0:8080 --device cuda
echo.
echo Server stopped. Press any key to exit.
pause
