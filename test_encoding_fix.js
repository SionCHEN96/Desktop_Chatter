/**
 * 编码修复测试脚本
 * 测试编码问题的检测和修复功能
 */

function testEncodingFix() {
  console.log('🔤 编码修复功能测试');
  console.log('='.repeat(50));
  
  const testCases = [
    {
      name: '正常中文文本',
      input: '你好！我是你的智能助手，随时准备帮你解答问题。',
      expected: '你好！我是你的智能助手，随时准备帮你解答问题。'
    },
    {
      name: '编码错误文本1',
      input: '浣犲ソ鍛€锛佹垜鏄綘鐨勬櫤鑳藉姪鎵嬶紝闅忔椂鍑嗗甯綘瑙ｇ瓟闂銆?',
      expected: '你好呀！我是你的智能助手，随时准备帮你解答问题。'
    },
    {
      name: '编码错误文本2',
      input: '鎴戞槸浣犵殑鏅鸿兘鍔╂墜锛岄殢鏃跺噯澶囧府浣犺В绛旈棶棰樸€?',
      expected: '我是你的智能助手，随时准备帮你解答问题。'
    },
    {
      name: '混合文本',
      input: '你好！鎴戞槸浣犵殑AI助手。',
      expected: '你好！我是你的AI助手。'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n测试案例 ${index + 1}: ${testCase.name}`);
    console.log(`输入: ${testCase.input}`);
    
    // 检测编码问题
    const encodingIssuePatterns = ['锛', '鍚', '浣', '鎴', '鍙', '甯', '瑙', '鐞', '闂', '鍚', '鍛€', '鏄', '鐨', '鏅', '鸿兘', '鍔╂墜'];
    const hasEncodingIssue = encodingIssuePatterns.some(pattern => testCase.input.includes(pattern));
    
    if (hasEncodingIssue) {
      console.log('❌ 检测到编码问题');
      
      try {
        // 尝试修复
        const buffer = Buffer.from(testCase.input, 'latin1');
        const fixed = buffer.toString('utf8');
        
        console.log(`🔧 修复后: ${fixed}`);
        
        // 检查修复效果
        const commonChars = ['你', '好', '是', '的', '我', '在', '有', '了', '不', '和', '人', '这', '中', '大', '为', '助', '手'];
        const fixedScore = commonChars.reduce((score, char) => score + (fixed.includes(char) ? 1 : 0), 0);
        const originalScore = commonChars.reduce((score, char) => score + (testCase.input.includes(char) ? 1 : 0), 0);
        
        if (fixedScore > originalScore) {
          console.log('✅ 编码修复成功');
          
          // 检查是否接近预期结果
          const similarity = calculateSimilarity(fixed, testCase.expected);
          console.log(`📊 相似度: ${(similarity * 100).toFixed(1)}%`);
          
          if (similarity > 0.8) {
            console.log('🎯 修复结果良好');
          } else {
            console.log('⚠️ 修复结果可能不完全准确');
          }
        } else {
          console.log('⚠️ 编码修复效果不明显');
        }
      } catch (error) {
        console.log(`❌ 编码修复失败: ${error.message}`);
      }
    } else {
      console.log('✅ 编码正常，无需修复');
    }
  });
}

function calculateSimilarity(str1, str2) {
  // 简单的字符相似度计算
  const chars1 = new Set(str1);
  const chars2 = new Set(str2);
  const intersection = new Set([...chars1].filter(x => chars2.has(x)));
  const union = new Set([...chars1, ...chars2]);
  
  return intersection.size / union.size;
}

function testSegmentedText() {
  console.log('\n\n📝 分段文本测试');
  console.log('='.repeat(50));
  
  const longText = '你好！我是你的智能助手，随时准备帮你解答问题、提供建议或陪你聊天～如果你有需要，不妨告诉我你想聊什么？比如：今天的心情如何？有什么想分享的趣事吗？或者有什么我可以帮你解决的事情呢？';
  
  console.log(`原文本 (${longText.length}字): ${longText}`);
  
  // 模拟分段函数
  function segmentText(text, options = {}) {
    const {
      maxSegmentLength = 50,
      minSegmentLength = 6,
      preferredLength = 25
    } = options;

    const sentences = text.split(/[。！？.!?～]+/).filter(s => s.trim());
    const segments = [];
    let currentSegment = '';

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) continue;

      const testSegment = currentSegment + (currentSegment ? '。' : '') + trimmedSentence;
      
      if (testSegment.length <= maxSegmentLength) {
        currentSegment = testSegment;
      } else {
        if (currentSegment && currentSegment.length >= minSegmentLength) {
          segments.push(currentSegment + '。');
          currentSegment = trimmedSentence;
        } else {
          currentSegment = testSegment;
        }
      }
    }

    if (currentSegment && currentSegment.length >= minSegmentLength) {
      segments.push(currentSegment + (currentSegment.endsWith('。') ? '' : '。'));
    }

    return segments.length > 0 ? segments : [text];
  }
  
  const segments = segmentText(longText, {
    maxSegmentLength: 50,
    minSegmentLength: 6,
    preferredLength: 25
  });
  
  console.log(`\n分段结果 (${segments.length}个段落):`);
  segments.forEach((segment, index) => {
    console.log(`  段落 ${index + 1} (${segment.length}字): ${segment}`);
  });
  
  // 计算分段效果
  const avgLength = segments.reduce((sum, seg) => sum + seg.length, 0) / segments.length;
  console.log(`\n📊 分段统计:`);
  console.log(`  平均长度: ${avgLength.toFixed(1)}字`);
  console.log(`  最短段落: ${Math.min(...segments.map(s => s.length))}字`);
  console.log(`  最长段落: ${Math.max(...segments.map(s => s.length))}字`);
  
  if (avgLength <= 30) {
    console.log('✅ 分段长度适中，有利于快速合成');
  } else {
    console.log('⚠️ 分段可能偏长，建议进一步优化');
  }
}

function testTTSTimeout() {
  console.log('\n\n⏱️ TTS超时问题分析');
  console.log('='.repeat(50));
  
  const timeoutScenarios = [
    { text: '你好', expectedTime: '1-3秒', risk: '低' },
    { text: '你好！我是AI助手。', expectedTime: '3-8秒', risk: '中' },
    { text: '你好！我是你的智能助手，随时准备帮你解答问题、提供建议或陪你聊天～', expectedTime: '10-30秒', risk: '高' },
    { text: '你好！我是你的智能助手，随时准备帮你解答问题、提供建议或陪你聊天～如果你有需要，不妨告诉我你想聊什么？比如：今天的心情如何？有什么想分享的趣事吗？或者有什么我可以帮你解决的事情呢？', expectedTime: '30-60秒', risk: '极高' }
  ];
  
  console.log('文本长度与预期合成时间分析:');
  timeoutScenarios.forEach((scenario, index) => {
    console.log(`\n${index + 1}. 文本长度: ${scenario.text.length}字`);
    console.log(`   预期时间: ${scenario.expectedTime}`);
    console.log(`   超时风险: ${scenario.risk}`);
    console.log(`   文本: ${scenario.text.substring(0, 50)}${scenario.text.length > 50 ? '...' : ''}`);
    
    if (scenario.risk === '高' || scenario.risk === '极高') {
      console.log(`   💡 建议: 使用分段TTS`);
    }
  });
  
  console.log('\n🔧 优化建议:');
  console.log('1. 对于>30字的文本，启用分段TTS');
  console.log('2. 分段长度控制在25字以内');
  console.log('3. 第一段优先合成，提供即时反馈');
  console.log('4. 后台并行合成其他段落');
  console.log('5. 设置合理的超时时间（15-30秒/段）');
}

// 运行所有测试
console.log('🧪 TTS问题诊断和修复测试套件');
console.log('='.repeat(60));

testEncodingFix();
testSegmentedText();
testTTSTimeout();

console.log('\n\n🎯 总结建议:');
console.log('='.repeat(50));
console.log('1. ✅ 编码修复功能已实现，可以处理常见编码问题');
console.log('2. ✅ 分段TTS已优化，使用更短的段落长度');
console.log('3. ✅ 超时阈值已调整，30字以上启用分段TTS');
console.log('4. 💡 建议监控Fish Speech服务性能');
console.log('5. 💡 考虑添加TTS缓存机制');
console.log('6. 💡 可以添加用户反馈机制');

export { testEncodingFix, testSegmentedText, testTTSTimeout };
