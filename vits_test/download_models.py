#!/usr/bin/env python3
"""
VITS模型下载和管理脚本
处理Git LFS文件和模型下载
"""

import os
import sys
import hashlib
import requests
from pathlib import Path
from tqdm import tqdm


class ModelDownloader:
    """模型下载器"""
    
    def __init__(self):
        self.model_dir = Path("../public/VTS_Models")
        self.temp_dir = Path("./temp_models")
        self.temp_dir.mkdir(exist_ok=True)
        
        # 预定义的模型下载链接（示例）
        self.model_urls = {
            "G_953000.pth": {
                "url": "https://huggingface.co/spaces/zomehwh/vits-uma-genshin-bh3/resolve/main/model/G_953000.pth",
                "sha256": "0c54396a7a9027952e4d72fceb7e1da1f003d108837138927c2054a33eda0292",
                "size": 479276657
            }
        }
    
    def check_git_lfs_file(self, file_path):
        """检查是否为Git LFS指针文件"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            return content.startswith("version https://git-lfs.github.com/spec/v1")
        except:
            return False
    
    def parse_lfs_pointer(self, file_path):
        """解析Git LFS指针文件"""
        info = {}
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith("oid sha256:"):
                        info['sha256'] = line.split(":", 1)[1].strip()
                    elif line.startswith("size "):
                        info['size'] = int(line.split(" ", 1)[1].strip())
            return info
        except Exception as e:
            print(f"解析LFS指针文件失败: {e}")
            return None
    
    def verify_file(self, file_path, expected_sha256, expected_size):
        """验证文件完整性"""
        if not os.path.exists(file_path):
            return False
        
        # 检查文件大小
        actual_size = os.path.getsize(file_path)
        if actual_size != expected_size:
            print(f"文件大小不匹配: 期望 {expected_size}, 实际 {actual_size}")
            return False
        
        # 检查SHA256
        sha256_hash = hashlib.sha256()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                sha256_hash.update(chunk)
        
        actual_sha256 = sha256_hash.hexdigest()
        if actual_sha256 != expected_sha256:
            print(f"SHA256不匹配: 期望 {expected_sha256}, 实际 {actual_sha256}")
            return False
        
        return True
    
    def download_file(self, url, output_path, expected_size=None):
        """下载文件并显示进度"""
        try:
            response = requests.get(url, stream=True)
            response.raise_for_status()
            
            total_size = int(response.headers.get('content-length', 0))
            if expected_size and total_size != expected_size:
                print(f"警告: 下载大小不匹配 期望:{expected_size} 实际:{total_size}")
            
            with open(output_path, 'wb') as f:
                with tqdm(total=total_size, unit='B', unit_scale=True, desc=f"下载 {os.path.basename(output_path)}") as pbar:
                    for chunk in response.iter_content(chunk_size=8192):
                        if chunk:
                            f.write(chunk)
                            pbar.update(len(chunk))
            
            print(f"✓ 下载完成: {output_path}")
            return True
            
        except Exception as e:
            print(f"✗ 下载失败: {e}")
            return False
    
    def check_and_download_models(self):
        """检查并下载所需的模型"""
        print("=== VITS模型检查和下载 ===")
        
        # 检查模型目录
        if not self.model_dir.exists():
            print(f"✗ 模型目录不存在: {self.model_dir}")
            return False
        
        models_to_download = []
        
        # 检查每个模型文件
        for model_name, model_info in self.model_urls.items():
            model_path = self.model_dir / model_name
            
            if not model_path.exists():
                print(f"✗ 模型文件不存在: {model_name}")
                models_to_download.append(model_name)
                continue
            
            # 检查是否为LFS指针文件
            if self.check_git_lfs_file(model_path):
                print(f"⚠️  发现Git LFS指针文件: {model_name}")
                lfs_info = self.parse_lfs_pointer(model_path)
                
                if lfs_info:
                    print(f"   - SHA256: {lfs_info.get('sha256', 'unknown')}")
                    print(f"   - 大小: {lfs_info.get('size', 'unknown')} bytes")
                    models_to_download.append(model_name)
                else:
                    print(f"✗ 无法解析LFS指针文件: {model_name}")
                continue
            
            # 验证现有文件
            if self.verify_file(model_path, model_info['sha256'], model_info['size']):
                print(f"✓ 模型文件完整: {model_name}")
            else:
                print(f"✗ 模型文件损坏: {model_name}")
                models_to_download.append(model_name)
        
        # 下载缺失或损坏的模型
        if models_to_download:
            print(f"\n需要下载 {len(models_to_download)} 个模型文件:")
            for model_name in models_to_download:
                print(f"  - {model_name}")
            
            confirm = input("\n是否开始下载? (y/N): ").lower().strip()
            if confirm != 'y':
                print("取消下载")
                return False
            
            for model_name in models_to_download:
                if model_name in self.model_urls:
                    model_info = self.model_urls[model_name]
                    temp_path = self.temp_dir / model_name
                    final_path = self.model_dir / model_name
                    
                    print(f"\n下载 {model_name}...")
                    if self.download_file(model_info['url'], temp_path, model_info['size']):
                        # 验证下载的文件
                        if self.verify_file(temp_path, model_info['sha256'], model_info['size']):
                            # 移动到最终位置
                            if final_path.exists():
                                final_path.unlink()  # 删除旧文件
                            temp_path.rename(final_path)
                            print(f"✓ {model_name} 安装完成")
                        else:
                            print(f"✗ {model_name} 验证失败")
                            return False
                    else:
                        print(f"✗ {model_name} 下载失败")
                        return False
                else:
                    print(f"✗ 未知模型: {model_name}")
                    return False
        
        print("\n✓ 所有模型文件就绪!")
        return True
    
    def create_dummy_model(self, model_name="G_953000.pth"):
        """创建一个虚拟模型用于测试"""
        print(f"创建虚拟模型: {model_name}")
        
        # 创建一个简单的PyTorch模型状态字典
        import torch
        import torch.nn as nn
        
        # 简化的模型状态
        dummy_state = {
            'model': {
                'enc_p.emb.weight': torch.randn(100, 192),  # 简化的embedding
                'dec.conv_pre.weight': torch.randn(512, 192, 7),
                'dec.conv_pre.bias': torch.randn(512),
                'dec.conv_post.weight': torch.randn(1, 64, 7),
            },
            'iteration': 953000,
            'learning_rate': 2e-4,
            'optimizer': {}  # 空的优化器状态
        }
        
        dummy_path = self.temp_dir / f"dummy_{model_name}"
        torch.save(dummy_state, dummy_path)
        
        print(f"✓ 虚拟模型已创建: {dummy_path}")
        return dummy_path


def main():
    """主函数"""
    downloader = ModelDownloader()
    
    print("VITS模型管理工具")
    print("=" * 50)
    
    # 检查和下载模型
    success = downloader.check_and_download_models()
    
    if not success:
        print("\n模型下载失败，是否创建虚拟模型用于测试? (y/N): ", end="")
        create_dummy = input().lower().strip()
        
        if create_dummy == 'y':
            dummy_path = downloader.create_dummy_model()
            print(f"\n可以使用虚拟模型进行基础测试:")
            print(f"python vits_inference.py --model {dummy_path} --text '测试文本'")
    
    return success


if __name__ == "__main__":
    main()
