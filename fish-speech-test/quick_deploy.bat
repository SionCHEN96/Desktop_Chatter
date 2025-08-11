@echo off
echo Fish Speech Quick Deploy Script
echo ================================

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found
    echo Please install Python 3.8-3.11 first
    pause
    exit /b 1
)

echo OK: Python is installed

:: Check Git
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git not found
    echo Please install Git first
    pause
    exit /b 1
)

echo OK: Git is installed

:: Create virtual environment
echo.
echo Creating Python virtual environment...
if not exist fish_speech_env (
    python -m venv fish_speech_env
    echo OK: Virtual environment created
) else (
    echo INFO: Virtual environment already exists
)

:: Activate virtual environment
echo.
echo Activating virtual environment...
call fish_speech_env\Scripts\activate.bat

:: Upgrade pip
echo.
echo Upgrading pip...
python -m pip install --upgrade pip

:: Clone repository
echo.
echo Cloning Fish Speech repository...
if not exist fish-speech (
    git clone https://github.com/fishaudio/fish-speech.git
    echo OK: Repository cloned successfully
) else (
    echo INFO: Repository already exists
)

:: Install PyTorch
echo.
echo Installing PyTorch...
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo INFO: No NVIDIA GPU detected, installing CPU version
    pip install torch torchvision torchaudio
) else (
    echo OK: NVIDIA GPU detected, installing GPU version
    pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
)

:: Install Fish Speech
echo.
echo Installing Fish Speech...
cd fish-speech
pip install -e .
if errorlevel 1 (
    echo ERROR: Fish Speech installation failed
    pause
    exit /b 1
)

:: Install additional dependencies
echo.
echo Installing additional dependencies...
pip install gradio fastapi uvicorn huggingface_hub

:: Create checkpoints directory
echo.
echo Creating model directory...
if not exist checkpoints mkdir checkpoints

:: Download model
echo.
echo Downloading Fish Speech model...
echo WARNING: This may take several minutes, please wait...
if not exist checkpoints\openaudio-s1-mini (
    huggingface-cli download fishaudio/openaudio-s1-mini --local-dir checkpoints/openaudio-s1-mini
    if errorlevel 1 (
        echo ERROR: Model download failed, trying alternative method...
        python -c "from huggingface_hub import snapshot_download; snapshot_download('fishaudio/openaudio-s1-mini', local_dir='checkpoints/openaudio-s1-mini')"
    )
) else (
    echo INFO: Model already exists
)

:: Return to parent directory
cd ..

:: Create startup script
echo.
echo Creating startup script...
(
echo @echo off
echo echo Starting Fish Speech server...
echo echo Please wait for service to start...
echo echo.
echo cd /d "%~dp0fish-speech"
echo call ..\fish_speech_env\Scripts\activate.bat
echo.
echo :: Detect GPU
echo nvidia-smi ^>nul 2^>^&1
echo if errorlevel 1 ^(
echo     echo INFO: Using CPU mode
echo     python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cpu
echo ^) else ^(
echo     echo OK: Using GPU mode
echo     python -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cuda
echo ^)
echo.
echo pause
) > start_fish_speech.bat

:: Create test script
echo.
echo Creating test script...
(
echo @echo off
echo echo Testing Fish Speech installation...
echo call fish_speech_env\Scripts\activate.bat
echo python -c "import torch; print('PyTorch version:', torch.__version__); print('CUDA available:', torch.cuda.is_available())"
echo python -c "import fish_speech; print('OK: Fish Speech import successful')"
echo echo.
echo echo Testing API connection...
echo timeout /t 2 /nobreak ^>nul
echo curl -s http://localhost:8080/health ^|^| echo "WARNING: Service not started, please run start_fish_speech.bat first"
echo pause
) > test_fish_speech.bat

echo.
echo Fish Speech deployment completed!
echo.
echo Next steps:
echo 1. Run start_fish_speech.bat to start Fish Speech service
echo 2. Wait for service to start (first startup may take 1-2 minutes)
echo 3. Keep Fish Speech service running
echo 4. In another terminal run our test server: npm start
echo 5. Visit http://localhost:3001/index.html
echo 6. Now you should hear real Fish Speech voice!
echo.
echo Troubleshooting:
echo - If you encounter problems, run test_fish_speech.bat for diagnosis
echo - Check DEPLOY_LOCAL_FISH_SPEECH.md for detailed instructions
echo.
pause
