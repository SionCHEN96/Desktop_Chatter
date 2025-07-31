#!/usr/bin/env python3
"""
查找香菱在speakers列表中的位置
"""

import json
import sys

def find_xiangling_speaker_id():
    try:
        with open('public/VTS_Models/config.json', 'r', encoding='utf-8') as f:
            config = json.load(f)
        
        speakers = config.get('speakers', [])
        
        print(f"总共有 {len(speakers)} 个说话人")
        
        # 查找香菱相关的speaker
        xiangling_candidates = []
        
        for i, speaker in enumerate(speakers):
            if '香菱' in speaker:
                xiangling_candidates.append((i, speaker))
                print(f"找到香菱: ID={i}, Name={speaker}")
        
        if not xiangling_candidates:
            print("未找到香菱，显示前20个说话人:")
            for i, speaker in enumerate(speakers[:20]):
                print(f"ID={i}: {speaker}")
            
            print("\n显示包含'香'字的说话人:")
            for i, speaker in enumerate(speakers):
                if '香' in speaker:
                    print(f"ID={i}: {speaker}")
        
        return xiangling_candidates
        
    except Exception as e:
        print(f"错误: {e}")
        return []

if __name__ == "__main__":
    find_xiangling_speaker_id()
