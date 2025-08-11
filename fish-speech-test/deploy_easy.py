#!/usr/bin/env python3
"""
Fish Speech 简易部署脚本
避免批处理文件编码问题
"""

import os
import sys
import subprocess
import platform
from pathlib import Path

def run_command(cmd, cwd=None, use_shell=True):
    """运行命令"""
    try:
        print(f"Running: {cmd}")

        # 如果是字符串且包含空格的路径，转换为列表
        if isinstance(cmd, str) and not use_shell:
            cmd = cmd.split()

        result = subprocess.run(cmd, shell=use_shell, cwd=cwd, check=True,
                              capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Error: {e}")
        if e.stderr:
            print(f"Error output: {e.stderr}")
        return False

def check_requirements():
    """检查系统要求"""
    print("=== Checking Requirements ===")
    
    # Check Python
    python_version = sys.version_info
    print(f"Python version: {python_version.major}.{python_version.minor}.{python_version.micro}")
    
    if python_version < (3, 8) or python_version >= (3, 12):
        print("WARNING: Recommended Python version is 3.8-3.11")
    else:
        print("OK: Python version is compatible")
    
    # Check Git
    if run_command("git --version"):
        print("OK: Git is installed")
    else:
        print("ERROR: Git not found. Please install Git first.")
        return False
    
    return True

def deploy_fish_speech():
    """部署Fish Speech"""
    print("\n=== Fish Speech Easy Deploy ===")
    
    if not check_requirements():
        return False
    
    base_dir = Path.cwd()
    venv_dir = base_dir / "fish_speech_env"
    fish_speech_dir = base_dir / "fish-speech"
    
    # Create virtual environment
    print("\n1. Creating virtual environment...")
    if not venv_dir.exists():
        # 使用列表形式避免路径空格问题
        venv_cmd = [sys.executable, "-m", "venv", "fish_speech_env"]
        try:
            print(f"Running: {' '.join(venv_cmd)}")
            result = subprocess.run(venv_cmd, cwd=base_dir, check=True,
                                  capture_output=True, text=True)
            if result.stdout:
                print(result.stdout)
            print("OK: Virtual environment created")
        except subprocess.CalledProcessError as e:
            print(f"Error: {e}")
            if e.stderr:
                print(f"Error output: {e.stderr}")
            print("ERROR: Failed to create virtual environment")
            return False
    else:
        print("INFO: Virtual environment already exists")
    
    # Get paths
    if platform.system() == "Windows":
        python_exe = venv_dir / "Scripts" / "python.exe"
        pip_exe = venv_dir / "Scripts" / "pip.exe"
        activate_script = venv_dir / "Scripts" / "activate.bat"
    else:
        python_exe = venv_dir / "bin" / "python"
        pip_exe = venv_dir / "bin" / "pip"
        activate_script = venv_dir / "bin" / "activate"
    
    # Upgrade pip
    print("\n2. Upgrading pip...")
    pip_upgrade_cmd = [str(python_exe), "-m", "pip", "install", "--upgrade", "pip"]
    try:
        print(f"Running: {' '.join(pip_upgrade_cmd)}")
        subprocess.run(pip_upgrade_cmd, check=True, capture_output=True, text=True)
        print("OK: pip upgraded")
    except subprocess.CalledProcessError as e:
        print(f"Warning: pip upgrade failed: {e}")
        # 继续执行，pip升级失败不是致命错误
    
    # Clone repository
    print("\n3. Cloning Fish Speech repository...")
    if not fish_speech_dir.exists():
        if run_command("git clone https://github.com/fishaudio/fish-speech.git"):
            print("OK: Repository cloned")
        else:
            print("ERROR: Failed to clone repository")
            return False
    else:
        print("INFO: Repository already exists")
    
    # Check GPU
    print("\n4. Checking GPU...")
    gpu_available = run_command("nvidia-smi")
    
    # Install PyTorch
    print("\n5. Installing PyTorch...")
    if gpu_available:
        print("INFO: Installing GPU version")
        pytorch_cmd = [str(pip_exe), "install", "torch", "torchvision", "torchaudio",
                      "--index-url", "https://download.pytorch.org/whl/cu118"]
    else:
        print("INFO: Installing CPU version")
        pytorch_cmd = [str(pip_exe), "install", "torch", "torchvision", "torchaudio"]

    try:
        print(f"Running: {' '.join(pytorch_cmd)}")
        subprocess.run(pytorch_cmd, check=True, capture_output=True, text=True)
        print("OK: PyTorch installed")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: PyTorch installation failed: {e}")
        return False
    
    # Install Fish Speech
    print("\n6. Installing Fish Speech...")
    fish_install_cmd = [str(pip_exe), "install", "-e", "."]
    try:
        print(f"Running: {' '.join(fish_install_cmd)}")
        subprocess.run(fish_install_cmd, cwd=fish_speech_dir, check=True,
                      capture_output=True, text=True)
        print("OK: Fish Speech installed")
    except subprocess.CalledProcessError as e:
        print(f"ERROR: Fish Speech installation failed: {e}")
        return False

    # Install dependencies
    print("\n7. Installing dependencies...")
    deps = ["gradio", "fastapi", "uvicorn", "huggingface_hub"]
    for dep in deps:
        dep_cmd = [str(pip_exe), "install", dep]
        try:
            print(f"Installing {dep}...")
            subprocess.run(dep_cmd, check=True, capture_output=True, text=True)
        except subprocess.CalledProcessError as e:
            print(f"Warning: Failed to install {dep}: {e}")
    
    # Create checkpoints directory
    checkpoints_dir = fish_speech_dir / "checkpoints"
    checkpoints_dir.mkdir(exist_ok=True)
    
    # Download model
    print("\n8. Downloading model...")
    model_dir = checkpoints_dir / "openaudio-s1-mini"
    if not model_dir.exists():
        print("This may take several minutes...")
        download_script = f"from huggingface_hub import snapshot_download; snapshot_download('fishaudio/openaudio-s1-mini', local_dir=r'{model_dir}')"
        download_cmd = [str(python_exe), "-c", download_script]
        try:
            print(f"Downloading model to: {model_dir}")
            subprocess.run(download_cmd, check=True, capture_output=True, text=True)
            print("OK: Model downloaded")
        except subprocess.CalledProcessError as e:
            print(f"ERROR: Model download failed: {e}")
            return False
    else:
        print("INFO: Model already exists")
    
    # Create startup script
    print("\n9. Creating startup script...")
    if platform.system() == "Windows":
        startup_content = f"""@echo off
echo Starting Fish Speech server...
cd /d "{fish_speech_dir}"
call "{activate_script}"
nvidia-smi >nul 2>&1
if errorlevel 1 (
    echo Using CPU mode
    "{python_exe}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cpu
) else (
    echo Using GPU mode
    "{python_exe}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cuda
)
pause
"""
        startup_file = base_dir / "start_fish_speech.bat"
    else:
        startup_content = f"""#!/bin/bash
echo "Starting Fish Speech server..."
cd "{fish_speech_dir}"
source "{activate_script}"
if command -v nvidia-smi &> /dev/null; then
    echo "Using GPU mode"
    "{python_exe}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cuda
else
    echo "Using CPU mode"
    "{python_exe}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device cpu
fi
"""
        startup_file = base_dir / "start_fish_speech.sh"
    
    with open(startup_file, 'w', encoding='utf-8') as f:
        f.write(startup_content)
    
    if platform.system() != "Windows":
        os.chmod(startup_file, 0o755)
    
    print(f"OK: Startup script created: {startup_file}")
    
    # Success message
    print("\n" + "="*50)
    print("🎉 Fish Speech deployment completed!")
    print("="*50)
    print("\nNext steps:")
    if platform.system() == "Windows":
        print("1. Run: start_fish_speech.bat")
    else:
        print("1. Run: ./start_fish_speech.sh")
    print("2. Wait for service to start (1-2 minutes)")
    print("3. In another terminal run: npm start")
    print("4. Visit: http://localhost:3001/index.html")
    print("5. Enjoy real Fish Speech voice!")
    
    return True

if __name__ == "__main__":
    try:
        success = deploy_fish_speech()
        if not success:
            print("\nDeployment failed. Please check the errors above.")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\nDeployment cancelled by user.")
        sys.exit(1)
    except Exception as e:
        print(f"\nUnexpected error: {e}")
        sys.exit(1)
