#!/usr/bin/env python3
"""
Fish Speech 自动化部署脚本
自动下载、安装和配置Fish Speech本地服务
"""

import os
import sys
import subprocess
import platform
import shutil
import urllib.request
import json
from pathlib import Path

class FishSpeechDeployer:
    def __init__(self):
        self.system = platform.system()
        self.python_exe = sys.executable
        self.base_dir = Path.cwd()
        self.fish_speech_dir = self.base_dir / "fish-speech"
        self.venv_dir = self.base_dir / "fish_speech_env"
        
    def print_step(self, step, message):
        print(f"\n{'='*60}")
        print(f"步骤 {step}: {message}")
        print('='*60)
    
    def run_command(self, command, cwd=None, check=True):
        """运行命令并处理错误"""
        try:
            print(f"执行命令: {command}")
            if isinstance(command, str):
                result = subprocess.run(command, shell=True, cwd=cwd, 
                                      capture_output=True, text=True, check=check)
            else:
                result = subprocess.run(command, cwd=cwd, 
                                      capture_output=True, text=True, check=check)
            
            if result.stdout:
                print(f"输出: {result.stdout}")
            if result.stderr and result.returncode != 0:
                print(f"错误: {result.stderr}")
            
            return result
        except subprocess.CalledProcessError as e:
            print(f"命令执行失败: {e}")
            print(f"错误输出: {e.stderr}")
            return None
    
    def check_requirements(self):
        """检查系统要求"""
        self.print_step(1, "检查系统要求")
        
        # 检查Python版本
        python_version = sys.version_info
        print(f"Python版本: {python_version.major}.{python_version.minor}.{python_version.micro}")
        
        if python_version < (3, 8) or python_version >= (3, 12):
            print("⚠️ 警告: 推荐使用Python 3.8-3.11")
        else:
            print("✅ Python版本符合要求")
        
        # 检查Git
        git_result = self.run_command("git --version", check=False)
        if git_result and git_result.returncode == 0:
            print("✅ Git已安装")
        else:
            print("❌ Git未安装，请先安装Git")
            return False
        
        # 检查可用空间
        free_space = shutil.disk_usage(self.base_dir).free / (1024**3)
        print(f"可用磁盘空间: {free_space:.1f} GB")
        
        if free_space < 10:
            print("❌ 磁盘空间不足，需要至少10GB")
            return False
        else:
            print("✅ 磁盘空间充足")
        
        return True
    
    def create_virtual_environment(self):
        """创建Python虚拟环境"""
        self.print_step(2, "创建Python虚拟环境")
        
        if self.venv_dir.exists():
            print("虚拟环境已存在，跳过创建")
            return True
        
        result = self.run_command([self.python_exe, "-m", "venv", str(self.venv_dir)])
        if result and result.returncode == 0:
            print("✅ 虚拟环境创建成功")
            return True
        else:
            print("❌ 虚拟环境创建失败")
            return False
    
    def get_venv_python(self):
        """获取虚拟环境中的Python路径"""
        if self.system == "Windows":
            return self.venv_dir / "Scripts" / "python.exe"
        else:
            return self.venv_dir / "bin" / "python"
    
    def get_venv_pip(self):
        """获取虚拟环境中的pip路径"""
        if self.system == "Windows":
            return self.venv_dir / "Scripts" / "pip.exe"
        else:
            return self.venv_dir / "bin" / "pip"
    
    def clone_fish_speech(self):
        """克隆Fish Speech仓库"""
        self.print_step(3, "克隆Fish Speech仓库")
        
        if self.fish_speech_dir.exists():
            print("Fish Speech仓库已存在，跳过克隆")
            return True
        
        result = self.run_command([
            "git", "clone", 
            "https://github.com/fishaudio/fish-speech.git",
            str(self.fish_speech_dir)
        ])
        
        if result and result.returncode == 0:
            print("✅ Fish Speech仓库克隆成功")
            return True
        else:
            print("❌ Fish Speech仓库克隆失败")
            return False
    
    def install_dependencies(self):
        """安装依赖"""
        self.print_step(4, "安装依赖")
        
        venv_pip = self.get_venv_pip()
        
        # 升级pip
        print("升级pip...")
        self.run_command([str(venv_pip), "install", "--upgrade", "pip"])
        
        # 检查CUDA是否可用
        cuda_available = self.check_cuda()
        
        # 安装PyTorch
        if cuda_available:
            print("安装GPU版本PyTorch...")
            torch_command = [
                str(venv_pip), "install", "torch", "torchvision", "torchaudio",
                "--index-url", "https://download.pytorch.org/whl/cu118"
            ]
        else:
            print("安装CPU版本PyTorch...")
            torch_command = [
                str(venv_pip), "install", "torch", "torchvision", "torchaudio"
            ]
        
        result = self.run_command(torch_command)
        if not result or result.returncode != 0:
            print("❌ PyTorch安装失败")
            return False
        
        # 安装Fish Speech
        print("安装Fish Speech...")
        result = self.run_command([
            str(venv_pip), "install", "-e", "."
        ], cwd=self.fish_speech_dir)
        
        if not result or result.returncode != 0:
            print("❌ Fish Speech安装失败")
            return False
        
        # 安装额外依赖
        print("安装额外依赖...")
        extra_deps = ["gradio", "fastapi", "uvicorn", "huggingface_hub"]
        for dep in extra_deps:
            self.run_command([str(venv_pip), "install", dep])
        
        print("✅ 依赖安装完成")
        return True
    
    def check_cuda(self):
        """检查CUDA是否可用"""
        try:
            result = self.run_command("nvidia-smi", check=False)
            if result and result.returncode == 0:
                print("✅ 检测到NVIDIA GPU")
                return True
            else:
                print("ℹ️ 未检测到NVIDIA GPU，将使用CPU模式")
                return False
        except:
            print("ℹ️ 无法检测GPU，将使用CPU模式")
            return False
    
    def download_models(self):
        """下载模型"""
        self.print_step(5, "下载模型")
        
        venv_python = self.get_venv_python()
        
        # 创建checkpoints目录
        checkpoints_dir = self.fish_speech_dir / "checkpoints"
        checkpoints_dir.mkdir(exist_ok=True)
        
        # 下载轻量版模型
        model_dir = checkpoints_dir / "openaudio-s1-mini"
        if model_dir.exists():
            print("模型已存在，跳过下载")
            return True

        print("下载Fish Speech模型（这可能需要几分钟）...")

        # 尝试使用huggingface-cli
        result = self.run_command([
            str(self.get_venv_pip()), "install", "huggingface_hub[cli]"
        ])

        # 使用huggingface-cli下载
        hf_cli_path = self.venv_dir / ("Scripts" if self.system == "Windows" else "bin") / ("huggingface-cli" + (".exe" if self.system == "Windows" else ""))

        result = self.run_command([
            str(hf_cli_path), "download",
            "fishaudio/openaudio-s1-mini",
            "--local-dir", str(model_dir)
        ])
        
        if result and result.returncode == 0:
            print("✅ 模型下载成功")
            return True
        else:
            print("❌ 模型下载失败")
            return False
    
    def create_startup_script(self):
        """创建启动脚本"""
        self.print_step(6, "创建启动脚本")
        
        venv_python = self.get_venv_python()
        cuda_available = self.check_cuda()
        device = "cuda" if cuda_available else "cpu"
        
        if self.system == "Windows":
            script_content = f"""@echo off
echo 启动Fish Speech服务器...
cd /d "{self.fish_speech_dir}"
"{venv_python}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device {device}
pause
"""
            script_path = self.base_dir / "start_fish_speech.bat"
        else:
            script_content = f"""#!/bin/bash
echo "启动Fish Speech服务器..."
cd "{self.fish_speech_dir}"
"{venv_python}" -m fish_speech.webui.api --listen 0.0.0.0:8080 --device {device}
"""
            script_path = self.base_dir / "start_fish_speech.sh"
        
        with open(script_path, 'w', encoding='utf-8') as f:
            f.write(script_content)
        
        if self.system != "Windows":
            os.chmod(script_path, 0o755)
        
        print(f"✅ 启动脚本已创建: {script_path}")
        return True
    
    def test_installation(self):
        """测试安装"""
        self.print_step(7, "测试安装")
        
        venv_python = self.get_venv_python()
        
        # 测试导入
        test_script = """
import torch
print(f"PyTorch版本: {torch.__version__}")
print(f"CUDA可用: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"CUDA版本: {torch.version.cuda}")
    print(f"GPU数量: {torch.cuda.device_count()}")

try:
    import fish_speech
    print("✅ Fish Speech导入成功")
except ImportError as e:
    print(f"❌ Fish Speech导入失败: {e}")
"""
        
        with open(self.base_dir / "test_import.py", 'w') as f:
            f.write(test_script)
        
        result = self.run_command([str(venv_python), "test_import.py"])
        
        # 清理测试文件
        os.remove(self.base_dir / "test_import.py")
        
        if result and result.returncode == 0:
            print("✅ 安装测试通过")
            return True
        else:
            print("❌ 安装测试失败")
            return False
    
    def deploy(self):
        """执行完整部署"""
        print("🐟 Fish Speech 自动化部署开始")
        print(f"部署目录: {self.base_dir}")
        
        steps = [
            self.check_requirements,
            self.create_virtual_environment,
            self.clone_fish_speech,
            self.install_dependencies,
            self.download_models,
            self.create_startup_script,
            self.test_installation
        ]
        
        for i, step in enumerate(steps, 1):
            if not step():
                print(f"\n❌ 部署在步骤{i}失败")
                return False
        
        print("\n🎉 Fish Speech部署成功!")
        print("\n📋 下一步:")
        if self.system == "Windows":
            print("1. 运行 start_fish_speech.bat 启动服务")
        else:
            print("1. 运行 ./start_fish_speech.sh 启动服务")
        print("2. 等待服务启动（首次启动可能较慢）")
        print("3. 访问 http://localhost:3001/index.html 测试")
        print("4. 现在应该能听到真实的Fish Speech语音了！")
        
        return True

if __name__ == "__main__":
    deployer = FishSpeechDeployer()
    success = deployer.deploy()
    
    if not success:
        print("\n💡 如果遇到问题，请查看 DEPLOY_LOCAL_FISH_SPEECH.md 获取详细说明")
        sys.exit(1)
