"""
VITS文本处理模块
支持中日混合文本处理
"""

import re
import jieba
import torch
from typing import List, Tuple


# 基础符号表
_pad = '_'
_punctuation = ';:,.!?¡¿—…"«»"" '
_letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
_letters_ipa = "ɑɐɒæɓʙβɔɕçɗɖðʤəɘɚɛɜɝɞɟʄɡɠɢʛɦɧħɥʜɨɪʝɭɬɫɮʟɱɯɰŋɳɲɴøɵɸθœɶʘɹɺɾɻʀʁɽʂʃʈʧʉʊʋⱱʌɣɤʍχʎʏʑʐʒʔʡʕʢǀǁǂǃˈˌːˑʼʴʰʱʲʷˠˤ˞↓↑→↗↘'̩'ᵻ"


# 中文字符
_chinese_characters = "的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严"


# 日文字符
_japanese_characters = "あいうえおかきくけこがきぐげござしすせそざじずぜぞたちつてとだぢづでどなにぬねのはひふへほばびぶべぼぱぴぷぺぽまみむめもやゆよらりるれろわをんアイウエオカキクケコガキグゲゴザシスセソザジズゼゾタチツテトダヂヅデドナニヌネノハヒフヘホバビブベボパピプペポマミムメモヤユヨラリルレロワヲン"


# 符号映射
SYMBOL_TO_ID = {
    _pad: 0,
    **{s: i + 1 for i, s in enumerate(_punctuation)},
    **{s: i + 1 + len(_punctuation) for i, s in enumerate(_letters)},
    **{s: i + 1 + len(_punctuation) + len(_letters) for i, s in enumerate(_letters_ipa)},
    **{s: i + 1 + len(_punctuation) + len(_letters) + len(_letters_ipa) for i, s in enumerate(_chinese_characters[:100])},  # 限制中文字符数量
    **{s: i + 1 + len(_punctuation) + len(_letters) + len(_letters_ipa) + 100 for i, s in enumerate(_japanese_characters[:50])},  # 限制日文字符数量
}

ID_TO_SYMBOL = {v: k for k, v in SYMBOL_TO_ID.items()}


class TextProcessor:
    """文本处理器"""
    
    def __init__(self):
        self.symbol_to_id = SYMBOL_TO_ID
        self.id_to_symbol = ID_TO_SYMBOL
        
        # 初始化jieba
        jieba.initialize()
    
    def clean_text(self, text: str) -> str:
        """清理文本"""
        # 移除多余的空格
        text = re.sub(r'\s+', ' ', text)
        # 移除首尾空格
        text = text.strip()
        return text
    
    def detect_language(self, text: str) -> str:
        """检测文本语言"""
        chinese_count = sum(1 for char in text if char in _chinese_characters)
        japanese_count = sum(1 for char in text if char in _japanese_characters)
        english_count = sum(1 for char in text if char in _letters)
        
        total_chars = len(text)
        if total_chars == 0:
            return 'unknown'
        
        chinese_ratio = chinese_count / total_chars
        japanese_ratio = japanese_count / total_chars
        english_ratio = english_count / total_chars
        
        if chinese_ratio > 0.3:
            return 'zh'
        elif japanese_ratio > 0.3:
            return 'ja'
        elif english_ratio > 0.3:
            return 'en'
        else:
            return 'mixed'
    
    def segment_chinese(self, text: str) -> List[str]:
        """中文分词"""
        return list(jieba.cut(text))
    
    def text_to_phonemes(self, text: str, language: str = 'auto') -> List[str]:
        """文本转音素（简化版）"""
        if language == 'auto':
            language = self.detect_language(text)
        
        # 简化的音素转换
        phonemes = []
        
        if language == 'zh':
            # 中文处理：字符级别
            for char in text:
                if char in self.symbol_to_id:
                    phonemes.append(char)
                elif char.isspace():
                    phonemes.append(' ')
                else:
                    phonemes.append(_pad)  # 未知字符用pad替代
        
        elif language == 'ja':
            # 日文处理：字符级别
            for char in text:
                if char in self.symbol_to_id:
                    phonemes.append(char)
                elif char.isspace():
                    phonemes.append(' ')
                else:
                    phonemes.append(_pad)
        
        elif language == 'en':
            # 英文处理：字符级别（简化）
            for char in text.lower():
                if char in self.symbol_to_id:
                    phonemes.append(char)
                elif char.isspace():
                    phonemes.append(' ')
                else:
                    phonemes.append(_pad)
        
        else:
            # 混合或未知语言：字符级别
            for char in text:
                if char in self.symbol_to_id:
                    phonemes.append(char)
                elif char.isspace():
                    phonemes.append(' ')
                else:
                    phonemes.append(_pad)
        
        return phonemes
    
    def phonemes_to_ids(self, phonemes: List[str]) -> List[int]:
        """音素转ID"""
        ids = []
        for phoneme in phonemes:
            if phoneme in self.symbol_to_id:
                ids.append(self.symbol_to_id[phoneme])
            else:
                ids.append(self.symbol_to_id[_pad])  # 未知音素用pad替代
        return ids
    
    def ids_to_phonemes(self, ids: List[int]) -> List[str]:
        """ID转音素"""
        phonemes = []
        for id_val in ids:
            if id_val in self.id_to_symbol:
                phonemes.append(self.id_to_symbol[id_val])
            else:
                phonemes.append(_pad)
        return phonemes
    
    def text_to_sequence(self, text: str, language: str = 'auto', add_blank: bool = True) -> List[int]:
        """文本转序列"""
        # 清理文本
        text = self.clean_text(text)
        
        # 转换为音素
        phonemes = self.text_to_phonemes(text, language)
        
        # 转换为ID
        sequence = self.phonemes_to_ids(phonemes)
        
        # 添加空白符（用于对齐）
        if add_blank:
            sequence = self.intersperse(sequence, 0)
        
        return sequence
    
    def sequence_to_text(self, sequence: List[int]) -> str:
        """序列转文本"""
        phonemes = self.ids_to_phonemes(sequence)
        # 移除pad符号
        phonemes = [p for p in phonemes if p != _pad]
        return ''.join(phonemes)
    
    def intersperse(self, lst: List[int], item: int) -> List[int]:
        """在列表元素间插入指定项"""
        result = [item] * (len(lst) * 2 + 1)
        result[1::2] = lst
        return result
    
    def get_vocab_size(self) -> int:
        """获取词汇表大小"""
        return len(self.symbol_to_id)


# 全局文本处理器实例
text_processor = TextProcessor()


def text_to_sequence(text: str, language: str = 'auto') -> torch.LongTensor:
    """便捷函数：文本转序列张量"""
    sequence = text_processor.text_to_sequence(text, language)
    return torch.LongTensor(sequence)


def cleaned_text_to_sequence(cleaned_text: str) -> torch.LongTensor:
    """便捷函数：已清理文本转序列张量"""
    sequence = text_processor.text_to_sequence(cleaned_text)
    return torch.LongTensor(sequence)


def sequence_to_text(sequence: torch.LongTensor) -> str:
    """便捷函数：序列张量转文本"""
    return text_processor.sequence_to_text(sequence.tolist())


# 导出符号表信息
symbols = list(SYMBOL_TO_ID.keys())
n_symbols = len(symbols)


if __name__ == "__main__":
    # 测试文本处理
    processor = TextProcessor()
    
    test_texts = [
        "你好世界",
        "Hello World",
        "こんにちは",
        "你好，Hello，こんにちは！",
        "原神，启动！"
    ]
    
    print("=== 文本处理测试 ===")
    for text in test_texts:
        print(f"\n原文: {text}")
        language = processor.detect_language(text)
        print(f"语言: {language}")
        
        sequence = processor.text_to_sequence(text)
        print(f"序列长度: {len(sequence)}")
        print(f"序列: {sequence[:20]}...")  # 只显示前20个
        
        recovered = processor.sequence_to_text(sequence)
        print(f"恢复: {recovered}")
    
    print(f"\n词汇表大小: {processor.get_vocab_size()}")
