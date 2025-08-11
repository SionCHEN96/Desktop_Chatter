#!/usr/bin/env python3
"""
Fish Speech 修复版部署脚本
专门处理Python路径空格和版本兼容性问题
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def safe_run(cmd_list, cwd=None, timeout=300):
    """安全运行命令，处理路径空格问题"""
    try:
        print(f"Running: {' '.join(str(x) for x in cmd_list)}")
        result = subprocess.run(
            cmd_list, 
            cwd=cwd, 
            check=True, 
            capture_output=True, 
            text=True,
            timeout=timeout
        )
        if result.stdout.strip():
            print(result.stdout.strip())
        return True, result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Error (exit code {e.returncode}): {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False, e.stderr
    except subprocess.TimeoutExpired:
        print(f"Command timed out after {timeout} seconds")
        return False, "Timeout"

def check_python_version():
    """检查Python版本并给出建议"""
    version = sys.version_info
    print(f"Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version >= (3, 12):
        print("WARNING: Python 3.12+ may have compatibility issues with some packages")
        print("Recommended: Python 3.8-3.11")
        print("Continuing anyway...")
        return True
    elif version < (3, 8):
        print("ERROR: Python version too old. Minimum required: 3.8")
        return False
    else:
        print("OK: Python version is compatible")
        return True

def deploy_fish_speech():
    """部署Fish Speech"""
    print("Fish Speech Fixed Deploy")
    print("=" * 40)
    
    # Check Python version
    if not check_python_version():
        return False
    
    # Check Git
    success, _ = safe_run(["git", "--version"])
    if not success:
        print("ERROR: Git not found. Please install Git first.")
        return False
    print("OK: Git is available")
    
    # Setup paths
    base_dir = Path.cwd()
    venv_dir = base_dir / "fish_speech_env"
    fish_speech_dir = base_dir / "fish-speech"
    
    if platform.system() == "Windows":
        python_exe = venv_dir / "Scripts" / "python.exe"
        pip_exe = venv_dir / "Scripts" / "pip.exe"
    else:
        python_exe = venv_dir / "bin" / "python"
        pip_exe = venv_dir / "bin" / "pip"
    
    # Step 1: Create virtual environment
    print("\n1. Creating virtual environment...")
    if not venv_dir.exists():
        success, _ = safe_run([sys.executable, "-m", "venv", str(venv_dir)])
        if not success:
            print("ERROR: Failed to create virtual environment")
            print("This might be due to Python 3.13 compatibility issues")
            print("Try using Python 3.10 or 3.11 instead")
            return False
        print("OK: Virtual environment created")
    else:
        print("INFO: Virtual environment already exists")
    
    # Step 2: Upgrade pip
    print("\n2. Upgrading pip...")
    success, _ = safe_run([str(python_exe), "-m", "pip", "install", "--upgrade", "pip"])
    if not success:
        print("Warning: pip upgrade failed, continuing...")
    
    # Step 3: Clone repository
    print("\n3. Cloning Fish Speech repository...")
    if not fish_speech_dir.exists():
        success, _ = safe_run(["git", "clone", "https://github.com/fishaudio/fish-speech.git"], timeout=600)
        if not success:
            print("ERROR: Failed to clone repository")
            return False
        print("OK: Repository cloned")
    else:
        print("INFO: Repository already exists")
    
    # Step 4: Check GPU
    print("\n4. Checking for GPU...")
    gpu_available, _ = safe_run(["nvidia-smi"])
    if gpu_available:
        print("OK: NVIDIA GPU detected")
        device_type = "cuda"
    else:
        print("INFO: No GPU detected, will use CPU")
        device_type = "cpu"
    
    # Step 5: Install PyTorch
    print("\n5. Installing PyTorch...")
    if gpu_available:
        pytorch_cmd = [
            str(pip_exe), "install", 
            "torch", "torchvision", "torchaudio",
            "--index-url", "https://download.pytorch.org/whl/cu118"
        ]
    else:
        pytorch_cmd = [str(pip_exe), "install", "torch", "torchvision", "torchaudio"]
    
    success, _ = safe_run(pytorch_cmd, timeout=600)
    if not success:
        print("ERROR: PyTorch installation failed")
        print("This might be due to Python 3.13 compatibility")
        print("Try using an older Python version (3.10 or 3.11)")
        return False
    print("OK: PyTorch installed")
    
    # Step 6: Install Fish Speech
    print("\n6. Installing Fish Speech...")
    success, _ = safe_run([str(pip_exe), "install", "-e", "."], cwd=fish_speech_dir, timeout=300)
    if not success:
        print("ERROR: Fish Speech installation failed")
        return False
    print("OK: Fish Speech installed")
    
    # Step 7: Install dependencies
    print("\n7. Installing dependencies...")
    deps = ["gradio", "fastapi", "uvicorn", "huggingface_hub"]
    for dep in deps:
        print(f"Installing {dep}...")
        success, _ = safe_run([str(pip_exe), "install", dep], timeout=120)
        if not success:
            print(f"Warning: Failed to install {dep}")
    
    # Step 8: Create model directory
    print("\n8. Setting up model directory...")
    checkpoints_dir = fish_speech_dir / "checkpoints"
    checkpoints_dir.mkdir(exist_ok=True)
    
    # Step 9: Download model
    print("\n9. Downloading model...")
    model_dir = checkpoints_dir / "openaudio-s1-mini"
    if not model_dir.exists():
        print("Downloading model (this will take several minutes)...")
        download_script = f"""
from huggingface_hub import snapshot_download
import os
try:
    snapshot_download('fishaudio/openaudio-s1-mini', local_dir=r'{model_dir}')
    print('Model download completed successfully')
except Exception as e:
    print(f'Download failed: {{e}}')
    exit(1)
"""
        success, output = safe_run([str(python_exe), "-c", download_script], timeout=1800)  # 30 minutes
        if not success:
            print("ERROR: Model download failed")
            print("You can try downloading manually later")
            print("For now, the service will start but may not work properly")
        else:
            print("OK: Model downloaded")
    else:
        print("INFO: Model already exists")
    
    # Step 10: Create startup script
    print("\n10. Creating startup script...")
    if platform.system() == "Windows":
        startup_content = f'''@echo off
echo Starting Fish Speech server...
echo Device: {device_type}
echo.
cd /d "{fish_speech_dir}"
call "{venv_dir}\\Scripts\\activate.bat"
echo Activated virtual environment
echo Starting API server on port 8080...
"{python_exe}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device {device_type}
echo.
echo Server stopped. Press any key to exit.
pause
'''
        startup_file = base_dir / "start_fish_speech.bat"
    else:
        startup_content = f'''#!/bin/bash
echo "Starting Fish Speech server..."
echo "Device: {device_type}"
echo
cd "{fish_speech_dir}"
source "{venv_dir}/bin/activate"
echo "Activated virtual environment"
echo "Starting API server on port 8080..."
"{python_exe}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device {device_type}
'''
        startup_file = base_dir / "start_fish_speech.sh"
    
    with open(startup_file, 'w', encoding='utf-8') as f:
        f.write(startup_content)
    
    if platform.system() != "Windows":
        os.chmod(startup_file, 0o755)
    
    print(f"OK: Startup script created: {startup_file}")
    
    # Success message
    print("\n" + "=" * 50)
    print("🎉 Fish Speech deployment completed!")
    print("=" * 50)
    print(f"\nPython version: {sys.version_info.major}.{sys.version_info.minor}")
    print(f"Device type: {device_type}")
    print(f"Model status: {'Downloaded' if model_dir.exists() else 'Not downloaded'}")
    
    print("\nNext steps:")
    if platform.system() == "Windows":
        print("1. Run: start_fish_speech.bat")
    else:
        print("1. Run: ./start_fish_speech.sh")
    print("2. Wait for 'Server started' message (may take 1-2 minutes)")
    print("3. In another terminal: npm start")
    print("4. Visit: http://localhost:3001/index.html")
    print("5. Test with real Fish Speech voice!")
    
    if sys.version_info >= (3, 12):
        print("\n⚠️  Python 3.13 Notice:")
        print("If you encounter issues, consider using Python 3.10 or 3.11")
        print("Some packages may not be fully compatible with Python 3.13 yet")
    
    return True

if __name__ == "__main__":
    try:
        success = deploy_fish_speech()
        if not success:
            print("\n❌ Deployment failed")
            print("Common solutions:")
            print("1. Use Python 3.10 or 3.11 instead of 3.13")
            print("2. Check internet connection for downloads")
            print("3. Ensure sufficient disk space (10GB+)")
            sys.exit(1)
        else:
            print("\n✅ Deployment successful!")
    except KeyboardInterrupt:
        print("\n\nDeployment cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
