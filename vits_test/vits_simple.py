#!/usr/bin/env python3
"""
简化的VITS推理实现
专注于解决模型加载和基础语音合成
"""

import os
import sys
import json
import argparse
import torch
import torch.nn as nn
import numpy as np
import soundfile as sf
from pathlib import Path

# 导入文本处理
try:
    from text_processing import text_processor, text_to_sequence
except ImportError:
    print("警告: 无法导入文本处理模块，使用简化版本")
    
    def text_to_sequence(text):
        # 超简化的文本处理
        return [ord(c) % 100 for c in text[:50]]  # 限制长度并映射到0-99


class SimpleVITSModel(nn.Module):
    """简化的VITS模型，用于加载预训练权重"""
    
    def __init__(self, vocab_size=1000, hidden_dim=192, n_speakers=804):
        super().__init__()
        self.vocab_size = vocab_size
        self.hidden_dim = hidden_dim
        self.n_speakers = n_speakers
        
        # 基础组件
        self.text_encoder = nn.Sequential(
            nn.Embedding(vocab_size, hidden_dim),
            nn.Linear(hidden_dim, hidden_dim * 2)
        )
        
        self.duration_predictor = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, 1)
        )
        
        self.decoder = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim * 4),
            nn.ReLU(),
            nn.Linear(hidden_dim * 4, 1)  # 输出音频
        )
        
        if n_speakers > 1:
            self.speaker_embedding = nn.Embedding(n_speakers, hidden_dim)
    
    def forward(self, text_ids, speaker_id=None):
        # 文本编码
        text_emb = self.text_encoder[0](text_ids)  # Embedding
        
        # 说话人条件
        if speaker_id is not None and hasattr(self, 'speaker_embedding'):
            speaker_emb = self.speaker_embedding(speaker_id)
            text_emb = text_emb + speaker_emb.unsqueeze(1)
        
        # 时长预测
        duration = self.duration_predictor(text_emb)
        duration = torch.clamp(duration, min=0.1, max=2.0)  # 限制时长范围
        
        # 扩展到音频长度
        total_frames = int(torch.sum(duration).item() * 22050 / 256)  # 假设hop_length=256
        total_frames = max(total_frames, text_emb.size(1) * 10)  # 最小长度
        
        # 简单的上采样
        audio_features = text_emb.repeat_interleave(
            torch.clamp(duration.squeeze(-1).long(), min=1), dim=1
        )
        
        # 截断或填充到目标长度
        if audio_features.size(1) > total_frames:
            audio_features = audio_features[:, :total_frames, :]
        elif audio_features.size(1) < total_frames:
            padding = total_frames - audio_features.size(1)
            audio_features = torch.cat([
                audio_features,
                audio_features[:, -1:, :].repeat(1, padding, 1)
            ], dim=1)
        
        # 解码为音频
        audio = self.decoder(audio_features).squeeze(-1)
        
        return audio


class VITSInference:
    """VITS推理类"""
    
    def __init__(self, config_path, model_path, device='cuda'):
        self.device = device
        self.config_path = config_path
        self.model_path = model_path
        
        # 加载配置
        self.config = self.load_config(config_path)
        self.speakers = self.config.get('speakers', [])
        self.sampling_rate = self.config['data']['sampling_rate']
        
        # 初始化模型
        self.model = None
        
        print(f"配置加载完成")
        print(f"支持的说话人数量: {len(self.speakers)}")
        print(f"采样率: {self.sampling_rate}")
        
    def load_config(self, config_path):
        """加载配置文件"""
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
            return config
        except Exception as e:
            print(f"配置文件加载失败: {e}")
            return {'data': {'sampling_rate': 22050}, 'speakers': []}
    
    def load_model(self):
        """加载模型"""
        try:
            print(f"正在加载模型: {self.model_path}")
            
            # 检查文件是否为Git LFS指针
            if self.is_git_lfs_pointer(self.model_path):
                print("⚠️  检测到Git LFS指针文件，模型未下载")
                print("请运行: python download_models.py")
                return False
            
            # 尝试加载模型
            checkpoint = torch.load(self.model_path, map_location=self.device, weights_only=False)
            print(f"✓ 模型检查点加载成功")
            
            # 分析检查点结构
            if isinstance(checkpoint, dict):
                print(f"检查点包含的键: {list(checkpoint.keys())}")
                
                # 尝试获取模型状态
                if 'model' in checkpoint:
                    model_state = checkpoint['model']
                elif 'state_dict' in checkpoint:
                    model_state = checkpoint['state_dict']
                else:
                    model_state = checkpoint
                
                print(f"模型状态键数量: {len(model_state)}")
                
                # 创建简化模型
                vocab_size = len(self.config.get('symbols', [])) or 1000
                n_speakers = len(self.speakers) or 1
                
                self.model = SimpleVITSModel(
                    vocab_size=vocab_size,
                    n_speakers=n_speakers
                ).to(self.device)
                
                # 尝试加载兼容的权重
                self.load_compatible_weights(model_state)
                
                self.model.eval()
                print("✓ 模型加载完成")
                return True
            else:
                print("✗ 未知的检查点格式")
                return False
                
        except Exception as e:
            print(f"✗ 模型加载失败: {e}")
            print("将使用随机初始化的模型进行测试")

            # 创建随机初始化的模型
            vocab_size = len(self.config.get('symbols', [])) or 1000
            n_speakers = len(self.speakers) or 1

            self.model = SimpleVITSModel(
                vocab_size=vocab_size,
                n_speakers=n_speakers
            ).to(self.device)

            self.model.eval()
            print("✓ 使用随机初始化模型")
            return True

    def create_fallback_model(self):
        """创建备用模型"""
        vocab_size = len(self.config.get('symbols', [])) or 1000
        n_speakers = len(self.speakers) or 1

        self.model = SimpleVITSModel(
            vocab_size=vocab_size,
            n_speakers=n_speakers
        ).to(self.device)

        self.model.eval()
        print("✓ 创建备用模型完成")
    
    def is_git_lfs_pointer(self, file_path):
        """检查是否为Git LFS指针文件"""
        try:
            file_size = os.path.getsize(file_path)
            if file_size < 1000:  # LFS指针文件通常很小
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return content.startswith("version https://git-lfs.github.com/spec/v1")
            return False
        except:
            return False
    
    def load_compatible_weights(self, state_dict):
        """加载兼容的权重"""
        model_dict = self.model.state_dict()
        compatible_dict = {}
        
        for name, param in model_dict.items():
            # 尝试找到匹配的权重
            found = False
            for key, value in state_dict.items():
                if name in key or key.endswith(name.split('.')[-1]):
                    if param.shape == value.shape:
                        compatible_dict[name] = value
                        found = True
                        break
            
            if not found:
                print(f"未找到匹配权重: {name} {param.shape}")
        
        print(f"加载了 {len(compatible_dict)}/{len(model_dict)} 个权重")
        self.model.load_state_dict(compatible_dict, strict=False)
    
    def synthesize(self, text, speaker_id=0, noise_scale=0.667, length_scale=1.0):
        """合成语音"""
        try:
            print(f"正在合成文本: {text}")
            print(f"说话人ID: {speaker_id}")
            
            if self.model is None:
                print("✗ 模型未加载")
                return None, None
            
            # 文本预处理
            text_ids = text_to_sequence(text)
            text_tensor = torch.LongTensor(text_ids).unsqueeze(0).to(self.device)
            
            # 说话人ID
            speaker_tensor = torch.LongTensor([speaker_id]).to(self.device) if speaker_id > 0 else None
            
            print(f"文本序列长度: {len(text_ids)}")
            
            # 模型推理
            with torch.no_grad():
                audio = self.model(text_tensor, speaker_tensor)
                audio = audio.squeeze(0).cpu().numpy()
            
            # 后处理
            audio = np.clip(audio, -1.0, 1.0)
            
            # 调整长度
            target_length = int(len(text) * 0.1 * self.sampling_rate)
            if len(audio) != target_length:
                # 简单的重采样
                indices = np.linspace(0, len(audio) - 1, target_length)
                audio = np.interp(indices, np.arange(len(audio)), audio)
            
            print(f"音频生成完成，时长: {len(audio) / self.sampling_rate:.2f}秒")
            return audio, self.sampling_rate
            
        except Exception as e:
            print(f"语音合成失败: {e}")
            import traceback
            traceback.print_exc()
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
    parser = argparse.ArgumentParser(description='简化VITS TTS 推理')
    parser.add_argument('--config', type=str, default='../public/VTS_Models/config.json',
                       help='配置文件路径')
    parser.add_argument('--model', type=str, default='../public/VTS_Models/G_953000.pth',
                       help='模型文件路径')
    parser.add_argument('--text', type=str, default='你好，这是VITS语音合成测试。',
                       help='要合成的文本')
    parser.add_argument('--speaker', type=int, default=0,
                       help='说话人ID')
    parser.add_argument('--output', type=str, default='output_simple.wav',
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
    
    print("=== 简化VITS TTS 推理 ===")
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
        print("模型加载失败，创建备用模型进行测试")
        tts.create_fallback_model()
    
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
