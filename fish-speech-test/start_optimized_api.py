#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
优化的Fish Speech API服务器启动脚本
减少不必要的输出和修复编码问题
"""

import os
import sys
import subprocess
import time
from pathlib import Path

# 添加当前目录到Python路径
current_dir = Path(__file__).parent
fish_speech_dir = current_dir / "fish-speech"
sys.path.insert(0, str(fish_speech_dir))

# 导入优化模块
try:
    from optimize_output import setup_clean_environment, patch_tqdm, suppress_output
    setup_clean_environment()
    patch_tqdm()
except ImportError:
    print("Warning: Could not import optimization modules")

def detect_device():
    """检测可用的设备类型"""
    try:
        import torch
        if torch.cuda.is_available():
            return "cuda"
        else:
            return "cpu"
    except ImportError:
        return "cpu"

def start_api_server():
    """启动优化的API服务器"""

    device = detect_device()

    print(f"[{time.strftime('%H:%M:%S')}] Starting optimized Fish Speech API server...")
    print(f"[{time.strftime('%H:%M:%S')}] Working directory: {fish_speech_dir}")
    print(f"[{time.strftime('%H:%M:%S')}] Device: {device.upper()}")
    print(f"[{time.strftime('%H:%M:%S')}] Port: 8081")
    print()
    
    # 设置环境变量
    env = os.environ.copy()
    env.update({
        'PYTHONIOENCODING': 'utf-8',
        'PYTHONUNBUFFERED': '1',
        'TQDM_DISABLE': '1',
        'TRANSFORMERS_VERBOSITY': 'error',
        'TOKENIZERS_PARALLELISM': 'false',
        'CUDA_LAUNCH_BLOCKING': '0',
        'PYTORCH_CUDA_ALLOC_CONF': 'max_split_size_mb:512',
        'HF_HUB_DISABLE_PROGRESS_BARS': '1',
        'TRANSFORMERS_NO_ADVISORY_WARNINGS': '1'
    })
    
    # 构建命令
    python_exe = sys.executable
    api_script = fish_speech_dir / "tools" / "api_server.py"
    
    cmd = [
        python_exe,
        str(api_script),
        "--listen", "0.0.0.0:8081",
        "--device", device
    ]
    
    print(f"[{time.strftime('%H:%M:%S')}] Command: {' '.join(cmd)}")
    print(f"[{time.strftime('%H:%M:%S')}] Starting server...")
    print()
    
    try:
        # 启动进程
        process = subprocess.Popen(
            cmd,
            cwd=str(fish_speech_dir),
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding='utf-8',
            errors='replace'
        )
        
        print(f"[{time.strftime('%H:%M:%S')}] Server process started (PID: {process.pid})")
        print(f"[{time.strftime('%H:%M:%S')}] Monitoring output...")
        print()
        
        # 监控输出
        while True:
            # 读取stdout
            if process.stdout:
                line = process.stdout.readline()
                if line:
                    clean_line = line.strip()
                    if should_log_output(clean_line):
                        print(f"[{time.strftime('%H:%M:%S')}] {clean_line}")
            
            # 读取stderr
            if process.stderr:
                line = process.stderr.readline()
                if line:
                    clean_line = line.strip()
                    if should_log_error(clean_line):
                        print(f"[{time.strftime('%H:%M:%S')}] ERROR: {clean_line}")
            
            # 检查进程是否还在运行
            if process.poll() is not None:
                break
                
            time.sleep(0.1)
    
    except KeyboardInterrupt:
        print(f"\n[{time.strftime('%H:%M:%S')}] Received interrupt signal")
        if process:
            print(f"[{time.strftime('%H:%M:%S')}] Terminating server process...")
            process.terminate()
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print(f"[{time.strftime('%H:%M:%S')}] Force killing process...")
                process.kill()
        print(f"[{time.strftime('%H:%M:%S')}] Server stopped")
    
    except Exception as e:
        print(f"[{time.strftime('%H:%M:%S')}] Error: {e}")
    
    finally:
        if process and process.poll() is None:
            process.terminate()

def should_log_output(line):
    """Determine if output should be logged"""
    if not line:
        return False

    # Filter patterns
    skip_patterns = [
        '%|',  # Progress bar
        'it/s',  # Iteration speed
        'ETA:',  # Estimated time
        '锟斤拷',  # Encoding error
        'tqdm',  # tqdm related
        'Loading checkpoint',  # Loading checkpoint (unless important)
        'Downloading',  # Download info
        '[A',  # ANSI escape sequence
        '\x1b',  # ANSI escape sequence
    ]

    for pattern in skip_patterns:
        if pattern in line:
            return False

    # Keep important information
    important_patterns = [
        'Running on',
        'Server started',
        'Model loaded',
        'Error',
        'Warning',
        'Failed',
        'Success'
    ]

    for pattern in important_patterns:
        if pattern.lower() in line.lower():
            return True

    # If line is short and has no important info, might be part of progress bar
    if len(line) < 10:
        return False

    return True

def should_log_error(line):
    """Determine if error should be logged"""
    if not line:
        return False

    # Filter unimportant errors
    skip_patterns = [
        '%|',  # Progress bar
        'it/s',  # Iteration speed
        '锟斤拷',  # Encoding error
        'UserWarning',  # User warning (in some cases)
        'FutureWarning',  # Future warning
        'tqdm',  # tqdm related
    ]

    for pattern in skip_patterns:
        if pattern in line:
            return False

    return True

if __name__ == "__main__":
    start_api_server()
