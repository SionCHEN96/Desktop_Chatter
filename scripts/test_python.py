#!/usr/bin/env python3
"""
测试Python环境和依赖
"""

import sys
import os

def test_basic_imports():
    """测试基础导入"""
    try:
        import numpy as np
        print("✓ NumPy available")
        
        import scipy
        print("✓ SciPy available")
        
        return True
    except ImportError as e:
        print(f"✗ Missing dependency: {e}")
        return False

def main():
    print("=== Python环境测试 ===")
    print(f"Python版本: {sys.version}")
    print(f"当前工作目录: {os.getcwd()}")
    
    if test_basic_imports():
        print("✓ 基础依赖检查通过")
    else:
        print("✗ 基础依赖检查失败")
    
    print("=== 测试完成 ===")

if __name__ == "__main__":
    main()
