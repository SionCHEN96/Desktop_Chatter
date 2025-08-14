#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Fish Speech 输出优化脚本
用于减少不必要的日志输出和修复编码问题
"""

import os
import sys
import logging
from contextlib import contextmanager

# 设置环境变量以减少输出
os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['TQDM_DISABLE'] = '1'
os.environ['TRANSFORMERS_VERBOSITY'] = 'error'
os.environ['TOKENIZERS_PARALLELISM'] = 'false'

# 配置日志级别
logging.getLogger('transformers').setLevel(logging.ERROR)
logging.getLogger('torch').setLevel(logging.ERROR)
logging.getLogger('torchaudio').setLevel(logging.ERROR)

@contextmanager
def suppress_output():
    """上下文管理器，用于抑制不必要的输出"""
    try:
        # 保存原始的stdout和stderr
        original_stdout = sys.stdout
        original_stderr = sys.stderr
        
        # 创建一个过滤器类
        class OutputFilter:
            def __init__(self, original_stream):
                self.original_stream = original_stream
                self.buffer = ""
            
            def write(self, text):
                # 过滤掉进度条和不必要的输出
                if self.should_output(text):
                    self.original_stream.write(text)
                    self.original_stream.flush()
            
            def flush(self):
                self.original_stream.flush()
            
            def should_output(self, text):
                """Determine if text should be output"""
                # Filter patterns
                skip_patterns = [
                    '%|',  # Progress bar
                    'it/s',  # Iteration speed
                    'ETA',  # Estimated time
                    '锟斤拷',  # Encoding error
                    'tqdm',  # tqdm related
                    'Loading checkpoint',  # Loading checkpoint
                    'Downloading',  # Download info
                ]

                for pattern in skip_patterns:
                    if pattern in text:
                        return False

                # Filter empty lines or whitespace-only lines
                if text.strip() == '':
                    return False

                return True
        
        # 替换stdout和stderr
        sys.stdout = OutputFilter(original_stdout)
        sys.stderr = OutputFilter(original_stderr)
        
        yield
        
    finally:
        # 恢复原始的stdout和stderr
        sys.stdout = original_stdout
        sys.stderr = original_stderr

def setup_clean_environment():
    """Setup clean runtime environment"""

    # Set encoding
    if sys.platform.startswith('win'):
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.detach())
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.detach())

    # Disable various progress bars and verbose output
    import warnings
    warnings.filterwarnings('ignore')

    # Set PyTorch related environment variables
    os.environ['CUDA_LAUNCH_BLOCKING'] = '0'
    os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512'

    # Disable HuggingFace progress bars
    try:
        from transformers import logging as hf_logging
        hf_logging.set_verbosity_error()
    except ImportError:
        pass

    # Disable tqdm
    try:
        import tqdm
        tqdm.tqdm.__init__ = lambda *args, **kwargs: None
        tqdm.tqdm.update = lambda *args, **kwargs: None
        tqdm.tqdm.close = lambda *args, **kwargs: None
    except ImportError:
        pass

def patch_tqdm():
    """Patch tqdm to reduce output"""
    try:
        import tqdm

        # Create a silent tqdm class
        class SilentTqdm:
            def __init__(self, *args, **kwargs):
                pass

            def update(self, *args, **kwargs):
                pass

            def close(self, *args, **kwargs):
                pass

            def __enter__(self):
                return self

            def __exit__(self, *args):
                pass

        # Replace tqdm
        tqdm.tqdm = SilentTqdm
        tqdm.trange = lambda *args, **kwargs: range(args[0] if args else 0)

    except ImportError:
        pass

if __name__ == "__main__":
    print("Setting up optimized Fish Speech environment...")
    setup_clean_environment()
    patch_tqdm()
    print("Environment optimization complete.")
