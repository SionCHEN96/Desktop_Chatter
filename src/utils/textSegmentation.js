/**
 * 文本分段工具
 * 用于将长文本智能分段，便于语音合成
 */

/**
 * 文本分段器类
 */
export class TextSegmenter {
  constructor(options = {}) {
    this.maxSegmentLength = options.maxSegmentLength || 100; // 每段最大字符数
    this.minSegmentLength = options.minSegmentLength || 10;  // 每段最小字符数
    this.preferredLength = options.preferredLength || 50;    // 首选长度
  }

  /**
   * 将文本分段
   * @param {string} text - 原始文本
   * @returns {Array<string>} 分段后的文本数组
   */
  segmentText(text) {
    if (!text || typeof text !== 'string') {
      return [];
    }

    // 清理文本
    const cleanedText = this.cleanText(text);
    if (cleanedText.length === 0) {
      return [];
    }

    // 如果文本很短，直接返回
    if (cleanedText.length <= this.maxSegmentLength) {
      return [cleanedText];
    }

    // 按标点符号分段
    const segments = this.splitByPunctuation(cleanedText);
    
    // 合并过短的段落
    const mergedSegments = this.mergeShortSegments(segments);
    
    // 拆分过长的段落
    const finalSegments = this.splitLongSegments(mergedSegments);
    
    return finalSegments.filter(segment => segment.trim().length > 0);
  }

  /**
   * 清理文本
   * @private
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanText(text) {
    return text
      .replace(/\s+/g, ' ')  // 合并多个空格
      .trim();
  }

  /**
   * 按标点符号分段
   * @private
   * @param {string} text - 文本
   * @returns {Array<string>} 分段结果
   */
  splitByPunctuation(text) {
    // 中文和英文标点符号
    const punctuationRegex = /([。！？；：\.\!\?\;\:])/g;
    
    // 按标点符号分割
    const parts = text.split(punctuationRegex);
    const segments = [];
    
    for (let i = 0; i < parts.length; i += 2) {
      const content = parts[i];
      const punctuation = parts[i + 1] || '';
      
      if (content && content.trim()) {
        segments.push((content + punctuation).trim());
      }
    }
    
    return segments;
  }

  /**
   * 合并过短的段落
   * @private
   * @param {Array<string>} segments - 原始段落
   * @returns {Array<string>} 合并后的段落
   */
  mergeShortSegments(segments) {
    const merged = [];
    let currentSegment = '';
    
    for (const segment of segments) {
      const testSegment = currentSegment ? currentSegment + ' ' + segment : segment;
      
      if (testSegment.length <= this.maxSegmentLength) {
        currentSegment = testSegment;
      } else {
        // 如果当前段落不为空，先保存
        if (currentSegment) {
          merged.push(currentSegment);
        }
        currentSegment = segment;
      }
    }
    
    // 添加最后一个段落
    if (currentSegment) {
      merged.push(currentSegment);
    }
    
    return merged;
  }

  /**
   * 拆分过长的段落
   * @private
   * @param {Array<string>} segments - 段落数组
   * @returns {Array<string>} 拆分后的段落
   */
  splitLongSegments(segments) {
    const result = [];
    
    for (const segment of segments) {
      if (segment.length <= this.maxSegmentLength) {
        result.push(segment);
      } else {
        // 按逗号或其他次要标点符号拆分
        const subSegments = this.splitBySecondaryPunctuation(segment);
        result.push(...subSegments);
      }
    }
    
    return result;
  }

  /**
   * 按次要标点符号拆分
   * @private
   * @param {string} text - 文本
   * @returns {Array<string>} 拆分结果
   */
  splitBySecondaryPunctuation(text) {
    // 次要标点符号：逗号、顿号等
    const secondaryPunctuationRegex = /([，、,])/g;
    
    const parts = text.split(secondaryPunctuationRegex);
    const segments = [];
    let currentSegment = '';
    
    for (let i = 0; i < parts.length; i += 2) {
      const content = parts[i];
      const punctuation = parts[i + 1] || '';
      const part = (content + punctuation).trim();
      
      if (!part) continue;
      
      const testSegment = currentSegment ? currentSegment + part : part;
      
      if (testSegment.length <= this.maxSegmentLength) {
        currentSegment = testSegment;
      } else {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        currentSegment = part;
      }
    }
    
    if (currentSegment) {
      segments.push(currentSegment);
    }
    
    // 如果还是太长，强制按长度拆分
    const finalSegments = [];
    for (const segment of segments) {
      if (segment.length <= this.maxSegmentLength) {
        finalSegments.push(segment);
      } else {
        finalSegments.push(...this.forceSpitByLength(segment));
      }
    }
    
    return finalSegments;
  }

  /**
   * 强制按长度拆分
   * @private
   * @param {string} text - 文本
   * @returns {Array<string>} 拆分结果
   */
  forceSpitByLength(text) {
    const segments = [];
    let start = 0;
    
    while (start < text.length) {
      let end = start + this.maxSegmentLength;
      
      // 尝试在单词边界处断开（对于包含英文的情况）
      if (end < text.length) {
        const spaceIndex = text.lastIndexOf(' ', end);
        if (spaceIndex > start + this.minSegmentLength) {
          end = spaceIndex;
        }
      }
      
      segments.push(text.substring(start, end).trim());
      start = end;
    }
    
    return segments.filter(segment => segment.length > 0);
  }

  /**
   * 获取分段统计信息
   * @param {Array<string>} segments - 分段结果
   * @returns {Object} 统计信息
   */
  getSegmentStats(segments) {
    const lengths = segments.map(s => s.length);
    
    return {
      totalSegments: segments.length,
      totalLength: lengths.reduce((sum, len) => sum + len, 0),
      averageLength: lengths.length > 0 ? lengths.reduce((sum, len) => sum + len, 0) / lengths.length : 0,
      minLength: Math.min(...lengths),
      maxLength: Math.max(...lengths),
      segments: segments.map((segment, index) => ({
        index: index + 1,
        text: segment,
        length: segment.length
      }))
    };
  }
}

/**
 * 默认文本分段器实例
 */
export const defaultSegmenter = new TextSegmenter({
  maxSegmentLength: 80,   // 适合语音合成的长度
  minSegmentLength: 8,    // 最小长度
  preferredLength: 40     // 首选长度
});

/**
 * 快速分段函数
 * @param {string} text - 要分段的文本
 * @param {Object} options - 分段选项
 * @returns {Array<string>} 分段结果
 */
export function segmentText(text, options = {}) {
  const segmenter = new TextSegmenter(options);
  return segmenter.segmentText(text);
}
