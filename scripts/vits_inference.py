#!/usr/bin/env python3
"""
VITS推理脚本
用于生成香菱的语音
"""

import argparse
import json
import os
import sys
import torch
import numpy as np
import soundfile as sf
from scipy.io.wavfile import write

# 添加VITS相关的导入
try:
    import commons
    import utils
    from models import SynthesizerTrn
    from text.symbols import symbols
    from text import text_to_sequence
except ImportError as e:
    print(f"Error importing VITS modules: {e}")
    print("Please ensure VITS dependencies are installed and the script is run from the correct directory")
    sys.exit(1)

def get_text(text, hps):
    """将文本转换为序列"""
    text_norm = text_to_sequence(text, hps.data.text_cleaners)
    if hps.data.add_blank:
        text_norm = commons.intersperse(text_norm, 0)
    text_norm = torch.LongTensor(text_norm)
    return text_norm

def load_model(config_path, model_path):
    """加载VITS模型"""
    try:
        # 加载配置
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        # 创建超参数对象
        hps = utils.get_hparams_from_file(config_path)
        
        # 创建模型
        net_g = SynthesizerTrn(
            len(symbols),
            hps.data.filter_length // 2 + 1,
            hps.train.segment_size // hps.data.hop_length,
            n_speakers=hps.data.n_speakers,
            **hps.model
        )
        
        # 加载模型权重
        checkpoint = torch.load(model_path, map_location='cpu')
        net_g.load_state_dict(checkpoint['model'])
        net_g.eval()
        
        print(f"Model loaded successfully from {model_path}")
        return net_g, hps
        
    except Exception as e:
        print(f"Error loading model: {e}")
        raise

def synthesize_speech(model, hps, text, speaker_id, output_path):
    """合成语音"""
    try:
        # 将文本转换为序列
        stn_tst = get_text(text, hps)
        
        with torch.no_grad():
            x_tst = stn_tst.unsqueeze(0)
            x_tst_lengths = torch.LongTensor([stn_tst.size(0)])
            
            # 如果是多说话人模型
            if hps.data.n_speakers > 1:
                sid = torch.LongTensor([speaker_id])
                audio = model.infer(x_tst, x_tst_lengths, sid=sid)[0][0, 0].data.cpu().float().numpy()
            else:
                audio = model.infer(x_tst, x_tst_lengths)[0][0, 0].data.cpu().float().numpy()
        
        # 保存音频文件
        write(output_path, hps.data.sampling_rate, audio)
        print(f"Audio saved to {output_path}")
        
        return output_path
        
    except Exception as e:
        print(f"Error during synthesis: {e}")
        raise

def main():
    parser = argparse.ArgumentParser(description='VITS语音合成推理脚本')
    parser.add_argument('--config', required=True, help='配置文件路径')
    parser.add_argument('--model', required=True, help='模型文件路径')
    parser.add_argument('--text', required=True, help='要合成的文本')
    parser.add_argument('--speaker', type=int, default=0, help='说话人ID')
    parser.add_argument('--output', required=True, help='输出音频文件路径')
    
    args = parser.parse_args()
    
    try:
        # 验证输入文件
        if not os.path.exists(args.config):
            raise FileNotFoundError(f"Config file not found: {args.config}")
        
        if not os.path.exists(args.model):
            raise FileNotFoundError(f"Model file not found: {args.model}")
        
        # 确保输出目录存在
        output_dir = os.path.dirname(args.output)
        if not os.path.exists(output_dir):
            os.makedirs(output_dir, exist_ok=True)
        
        print(f"Loading model from {args.model}")
        print(f"Using config from {args.config}")
        print(f"Speaker ID: {args.speaker}")
        print(f"Text: {args.text}")
        
        # 加载模型
        model, hps = load_model(args.config, args.model)
        
        # 合成语音
        output_path = synthesize_speech(model, hps, args.text, args.speaker, args.output)
        
        print(f"Speech synthesis completed successfully!")
        print(f"Output file: {output_path}")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
