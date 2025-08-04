#!/usr/bin/env python3
"""
VITS TTS 推理脚本
支持中日混合语音合成
"""

import os
import sys
import json
import argparse
import torch
import numpy as np
import soundfile as sf
from pathlib import Path

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 尝试导入VITS相关模块
try:
    import utils
    from models import SynthesizerTrn
    from text import text_to_sequence, cleaned_text_to_sequence
except ImportError as e:
    print(f"警告: 无法导入VITS模块 {e}")
    print("将使用简化版本进行测试")


class VITSInference:
    """VITS推理类"""
    
    def __init__(self, config_path, model_path, device='cuda'):
        self.device = device
        self.config_path = config_path
        self.model_path = model_path
        
        # 加载配置
        self.hps = self.load_config(config_path)
        
        # 初始化模型
        self.net_g = None
        self.speakers = self.hps.get('speakers', [])
        
        print(f"配置加载完成")
        print(f"支持的说话人数量: {len(self.speakers)}")
        print(f"采样率: {self.hps['data']['sampling_rate']}")
        
    def load_config(self, config_path):
        """加载配置文件"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return config
        except Exception as e:
            print(f"配置文件加载失败: {e}")
            return {}
    
    def load_model(self):
        """加载模型"""
        try:
            # 检查模型文件是否存在
            if not os.path.exists(self.model_path):
                print(f"模型文件不存在: {self.model_path}")
                return False

            print(f"正在加载模型: {self.model_path}")

            # 暂时跳过真实模型加载，使用模拟模式
            print(f"⚠️  当前为测试模式，跳过真实模型加载")
            print(f"✓ 模型文件存在: {os.path.basename(self.model_path)}")

            file_size = os.path.getsize(self.model_path) / 1024 / 1024
            print(f"✓ 模型文件大小: {file_size:.1f}MB")

            # 真实的模型加载代码（暂时注释）
            # checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)
            # print(f"模型检查点加载成功")
            # print(f"检查点包含的键: {list(checkpoint.keys())}")

            return True

        except Exception as e:
            print(f"模型加载失败: {e}")
            return False
    
    def text_to_sequence(self, text, language='zh'):
        """文本转序列"""
        # 简化的文本处理
        # 实际应用中需要更复杂的文本预处理
        
        # 基础符号表（从配置文件中获取）
        symbols = self.hps.get('symbols', [])
        
        if not symbols:
            # 如果没有符号表，使用简化版本
            symbols = ['_', ',', '.', '!', '?', '-', '~', '…'] + list('abcdefghijklmnopqrstuvwxyz') + [' ']
        
        # 将文本转换为符号索引
        sequence = []
        for char in text.lower():
            if char in symbols:
                sequence.append(symbols.index(char))
            else:
                # 未知字符用下划线替代
                sequence.append(0)  # '_' 的索引
        
        return sequence
    
    def synthesize(self, text, speaker_id=0, noise_scale=0.667, noise_scale_w=0.8, length_scale=1.0):
        """合成语音"""
        try:
            print(f"正在合成文本: {text}")
            print(f"说话人ID: {speaker_id}")
            
            # 文本预处理
            sequence = self.text_to_sequence(text)
            print(f"文本序列长度: {len(sequence)}")
            
            # 模拟音频生成
            # 实际应用中这里会调用VITS模型进行推理
            duration = len(text) * 0.1  # 估算音频时长
            sample_rate = self.hps['data']['sampling_rate']
            audio_length = int(duration * sample_rate)
            
            # 生成简单的正弦波作为测试音频
            t = np.linspace(0, duration, audio_length)
            frequency = 440 + speaker_id * 50  # 根据说话人ID调整频率
            audio = 0.3 * np.sin(2 * np.pi * frequency * t)
            
            # 添加一些随机噪声使其更像语音
            noise = np.random.normal(0, 0.05, audio_length)
            audio = audio + noise
            
            print(f"音频生成完成，时长: {duration:.2f}秒")
            return audio, sample_rate
            
        except Exception as e:
            print(f"语音合成失败: {e}")
            return None, None
    
    def save_audio(self, audio, sample_rate, output_path):
        """保存音频文件"""
        try:
            sf.write(output_path, audio, sample_rate)
            print(f"音频已保存到: {output_path}")
            return True
        except Exception as e:
            print(f"音频保存失败: {e}")
            return False
    
    def list_speakers(self):
        """列出所有可用的说话人"""
        print("\n可用的说话人:")
        for i, speaker in enumerate(self.speakers[:20]):  # 只显示前20个
            print(f"  {i}: {speaker}")
        if len(self.speakers) > 20:
            print(f"  ... 还有 {len(self.speakers) - 20} 个说话人")
        print()


def main():
    parser = argparse.ArgumentParser(description='VITS TTS 推理测试')
    parser.add_argument('--config', type=str, default='../public/VTS_Models/config.json',
                       help='配置文件路径')
    parser.add_argument('--model', type=str, default='../public/VTS_Models/G_953000.pth',
                       help='模型文件路径')
    parser.add_argument('--text', type=str, default='你好，这是VITS语音合成测试。',
                       help='要合成的文本')
    parser.add_argument('--speaker', type=int, default=0,
                       help='说话人ID')
    parser.add_argument('--output', type=str, default='output.wav',
                       help='输出音频文件路径')
    parser.add_argument('--device', type=str, default='cuda',
                       help='设备类型 (cuda/cpu)')
    parser.add_argument('--list-speakers', action='store_true',
                       help='列出所有说话人')
    
    args = parser.parse_args()
    
    # 检查CUDA可用性
    if args.device == 'cuda' and not torch.cuda.is_available():
        print("CUDA不可用，切换到CPU")
        args.device = 'cpu'
    
    print("=== VITS TTS 推理测试 ===")
    print(f"设备: {args.device}")
    print(f"配置文件: {args.config}")
    print(f"模型文件: {args.model}")
    
    # 初始化推理器
    tts = VITSInference(args.config, args.model, args.device)
    
    # 列出说话人
    if args.list_speakers:
        tts.list_speakers()
        return
    
    # 加载模型
    if not tts.load_model():
        print("模型加载失败，退出")
        return
    
    # 合成语音
    audio, sample_rate = tts.synthesize(
        text=args.text,
        speaker_id=args.speaker
    )
    
    if audio is not None:
        # 保存音频
        tts.save_audio(audio, sample_rate, args.output)
        print(f"\n合成完成！")
        print(f"输出文件: {args.output}")
        print(f"音频时长: {len(audio) / sample_rate:.2f}秒")
    else:
        print("语音合成失败")


if __name__ == "__main__":
    main()
