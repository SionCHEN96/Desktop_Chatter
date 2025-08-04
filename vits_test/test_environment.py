#!/usr/bin/env python3
"""
VITS环境测试脚本
检查所有必要的依赖和硬件环境
"""

import sys
import os
import json
import platform
from pathlib import Path


def test_python_version():
    """测试Python版本"""
    print("=== Python环境测试 ===")
    version = sys.version_info
    print(f"Python版本: {version.major}.{version.minor}.{version.micro}")
    
    if version.major >= 3 and version.minor >= 7:
        print("✓ Python版本符合要求 (>=3.7)")
        return True
    else:
        print("✗ Python版本过低，需要3.7或更高版本")
        return False


def test_pytorch():
    """测试PyTorch环境"""
    print("\n=== PyTorch环境测试 ===")
    try:
        import torch
        import torchaudio
        
        print(f"PyTorch版本: {torch.__version__}")
        print(f"TorchAudio版本: {torchaudio.__version__}")
        
        # 测试CUDA
        cuda_available = torch.cuda.is_available()
        print(f"CUDA可用: {cuda_available}")
        
        if cuda_available:
            print(f"CUDA版本: {torch.version.cuda}")
            print(f"GPU数量: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                gpu_name = torch.cuda.get_device_name(i)
                gpu_memory = torch.cuda.get_device_properties(i).total_memory / 1024**3
                print(f"  GPU {i}: {gpu_name} ({gpu_memory:.1f}GB)")
        
        # 测试基本张量操作
        x = torch.randn(2, 3)
        if cuda_available:
            x_cuda = x.cuda()
            print("✓ CUDA张量操作正常")
        
        print("✓ PyTorch环境正常")
        return True
        
    except ImportError as e:
        print(f"✗ PyTorch导入失败: {e}")
        return False
    except Exception as e:
        print(f"✗ PyTorch测试失败: {e}")
        return False


def test_audio_libraries():
    """测试音频处理库"""
    print("\n=== 音频库测试 ===")
    libraries = [
        ('numpy', 'NumPy'),
        ('scipy', 'SciPy'),
        ('librosa', 'Librosa'),
        ('soundfile', 'SoundFile'),
    ]
    
    all_ok = True
    for lib_name, display_name in libraries:
        try:
            lib = __import__(lib_name)
            version = getattr(lib, '__version__', 'unknown')
            print(f"✓ {display_name}: {version}")
        except ImportError:
            print(f"✗ {display_name}: 未安装")
            all_ok = False
    
    return all_ok


def test_model_files():
    """测试模型文件"""
    print("\n=== 模型文件测试 ===")
    
    # 模型文件路径
    model_dir = Path("../public/VTS_Models")
    config_file = model_dir / "config.json"
    model_files = [
        "G_953000.pth",
        "G_0.pth", 
        "G_0-p.pth"
    ]
    
    # 检查目录
    if not model_dir.exists():
        print(f"✗ 模型目录不存在: {model_dir}")
        return False
    
    print(f"模型目录: {model_dir.absolute()}")
    
    # 检查配置文件
    if config_file.exists():
        print(f"✓ 配置文件存在: {config_file.name}")
        try:
            with open(config_file, 'r', encoding='utf-8') as f:
                config = json.load(f)
            
            print(f"  - 采样率: {config['data']['sampling_rate']}")
            print(f"  - 说话人数量: {config['data']['n_speakers']}")
            print(f"  - 文本清理器: {config['data']['text_cleaners']}")
            
        except Exception as e:
            print(f"✗ 配置文件解析失败: {e}")
            return False
    else:
        print(f"✗ 配置文件不存在: {config_file}")
        return False
    
    # 检查模型文件
    found_models = []
    for model_file in model_files:
        model_path = model_dir / model_file
        if model_path.exists():
            size_mb = model_path.stat().st_size / 1024 / 1024
            print(f"✓ 模型文件: {model_file} ({size_mb:.1f}MB)")
            found_models.append(model_file)
        else:
            print(f"- 模型文件: {model_file} (不存在)")
    
    if found_models:
        print(f"找到 {len(found_models)} 个模型文件")
        return True
    else:
        print("✗ 没有找到任何模型文件")
        return False


def test_system_info():
    """测试系统信息"""
    print("\n=== 系统信息 ===")
    print(f"操作系统: {platform.system()} {platform.release()}")
    print(f"处理器: {platform.processor()}")
    print(f"Python路径: {sys.executable}")
    
    # 内存信息（Windows）
    if platform.system() == "Windows":
        try:
            import psutil
            memory = psutil.virtual_memory()
            print(f"总内存: {memory.total / 1024**3:.1f}GB")
            print(f"可用内存: {memory.available / 1024**3:.1f}GB")
        except ImportError:
            print("psutil未安装，无法获取内存信息")


def test_simple_synthesis():
    """测试简单的语音合成"""
    print("\n=== 简单合成测试 ===")
    try:
        # 导入推理脚本
        sys.path.append(os.path.dirname(os.path.abspath(__file__)))
        from vits_inference import VITSInference
        
        # 初始化推理器
        config_path = "../public/VTS_Models/config.json"
        model_path = "../public/VTS_Models/G_953000.pth"
        
        if not os.path.exists(config_path):
            print(f"✗ 配置文件不存在: {config_path}")
            return False
            
        tts = VITSInference(config_path, model_path, device='cpu')
        
        # 测试文本处理
        test_text = "你好世界"
        sequence = tts.text_to_sequence(test_text)
        print(f"✓ 文本处理正常: '{test_text}' -> {len(sequence)} tokens")
        
        # 测试音频生成
        audio, sample_rate = tts.synthesize(test_text, speaker_id=0)
        if audio is not None:
            print(f"✓ 音频生成正常: {len(audio)} samples @ {sample_rate}Hz")
            
            # 保存测试音频
            output_path = "test_output.wav"
            if tts.save_audio(audio, sample_rate, output_path):
                print(f"✓ 测试音频已保存: {output_path}")
                return True
        
        return False
        
    except Exception as e:
        print(f"✗ 合成测试失败: {e}")
        return False


def main():
    """主函数"""
    print("VITS TTS 环境测试工具")
    print("=" * 50)
    
    tests = [
        ("Python版本", test_python_version),
        ("PyTorch环境", test_pytorch),
        ("音频处理库", test_audio_libraries),
        ("模型文件", test_model_files),
        ("系统信息", test_system_info),
        ("简单合成", test_simple_synthesis),
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"✗ {test_name}测试出错: {e}")
            results.append((test_name, False))
    
    # 总结
    print("\n" + "=" * 50)
    print("测试结果总结:")
    
    passed = 0
    for test_name, result in results:
        status = "✓ 通过" if result else "✗ 失败"
        print(f"  {test_name}: {status}")
        if result:
            passed += 1
    
    print(f"\n通过率: {passed}/{len(results)} ({passed/len(results)*100:.1f}%)")
    
    if passed == len(results):
        print("\n🎉 所有测试通过！环境配置正常，可以开始使用VITS TTS。")
    elif passed >= len(results) * 0.7:
        print("\n⚠️  大部分测试通过，环境基本可用，但建议修复失败的项目。")
    else:
        print("\n❌ 多个测试失败，请检查环境配置。")
    
    return passed == len(results)


if __name__ == "__main__":
    main()
