@echo off
echo Fish Speech Simple Deploy
echo ========================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Please install Python 3.8-3.11
    pause
    exit /b 1
)
echo OK: Python found

:: Check Git
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not found. Please install Git
    pause
    exit /b 1
)
echo OK: Git found

:: Create virtual environment
echo.
echo Creating virtual environment...
if not exist fish_speech_env (
    python -m venv fish_speech_env
    echo OK: Virtual environment created
) else (
    echo INFO: Virtual environment exists
)

:: Activate environment
echo.
echo Activating environment...
call fish_speech_env\Scripts\activate.bat

:: Upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip

:: Clone repository
echo.
echo Cloning Fish Speech...
if not exist fish-speech (
    git clone https://github.com/fishaudio/fish-speech.git
    echo OK: Repository cloned
) else (
    echo INFO: Repository exists
)

:: Install PyTorch
echo.
echo Installing PyTorch...
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo INFO: Installing CPU version
    pip install torch torchvision torchaudio
) else (
    echo INFO: Installing GPU version
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
)

:: Install Fish Speech
echo.
echo Installing Fish Speech...
cd fish-speech
pip install -e .
if errorlevel 1 (
    echo ERROR: Installation failed
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
pip install gradio fastapi uvicorn huggingface_hub

:: Create model directory
if not exist checkpoints mkdir checkpoints

:: Download model
echo.
echo Downloading model (this may take several minutes)...
if not exist checkpoints\openaudio-s1-mini (
    huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
    if errorlevel 1 (
        echo Trying alternative download method...
        python -c "from huggingface_hub import snapshot_download; snapshot_download('fishaudio/openaudio-s1-mini', local_dir='checkpoints/openaudio-s1-mini')"
    )
) else (
    echo INFO: Model already exists
)

cd ..

:: Create startup script
echo.
echo Creating startup script...
echo @echo off > start_fish_speech.bat
echo echo Starting Fish Speech server... >> start_fish_speech.bat
echo cd /d "%%~dp0fish-speech" >> start_fish_speech.bat
echo call ..\fish_speech_env\Scripts\activate.bat >> start_fish_speech.bat
echo nvidia-smi ^>nul 2^>^&1 >> start_fish_speech.bat
echo if errorlevel 1 ^( >> start_fish_speech.bat
echo     echo Using CPU mode >> start_fish_speech.bat
echo     python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cpu >> start_fish_speech.bat
echo ^) else ^( >> start_fish_speech.bat
echo     echo Using GPU mode >> start_fish_speech.bat
echo     python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cuda >> start_fish_speech.bat
echo ^) >> start_fish_speech.bat
echo pause >> start_fish_speech.bat

echo.
echo ========================================
echo Fish Speech deployment completed!
echo ========================================
echo.
echo Next steps:
echo 1. Run: start_fish_speech.bat
echo 2. Wait for service to start (1-2 minutes)
echo 3. In another window run: npm start
echo 4. Visit: http://localhost:3001/index.html
echo 5. Enjoy real Fish Speech voice!
echo.
pause
