/**
 * 分段TTS功能测试脚本
 * 用于验证分段合成和播放逻辑
 */

// 模拟文本分段函数
function segmentText(text, options = {}) {
  const {
    maxSegmentLength = 80,
    minSegmentLength = 8,
    preferredLength = 40
  } = options;

  const sentences = text.split(/[。！？.!?]+/).filter(s => s.trim());
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

// 模拟AudioQueue类
class MockAudioQueue {
  constructor() {
    this.queue = [];
    this.isPlaying = false;
    this.currentAudio = null;
    this.hasUserInteracted = true;
    this.maxDisplayTime = 30000;
    this.startTime = null;
    this.synthesizeFunction = null;
  }

  async startSegmentedSynthesis(textSegments, synthesizeFunction, callbacks = {}) {
    console.log(`[MockAudioQueue] Starting segmented synthesis for ${textSegments.length} segments`);
    
    this.onSegmentReady = callbacks.onSegmentReady;
    this.onAllComplete = callbacks.onAllComplete;
    this.onError = callbacks.onError;
    this.synthesizeFunction = synthesizeFunction;
    this.startTime = Date.now();
    
    // 初始化队列
    this.queue = textSegments.map((text, index) => ({
      id: `segment_${index}`,
      text,
      audioUrl: null,
      isReady: false,
      isPlayed: false,
      error: null,
      isPlaying: false
    }));

    // 开始顺序合成和播放
    this.startSequentialSynthesisAndPlayback();
  }

  async startSequentialSynthesisAndPlayback() {
    console.log('[MockAudioQueue] Starting sequential synthesis and playback');
    
    try {
      // 合成第一段
      await this.synthesizeSegment(this.queue[0].text, 0);
      
      // 第一段准备好，通知显示气泡
      if (this.queue[0].isReady) {
        console.log('[MockAudioQueue] First segment ready, notifying UI');
        if (this.onSegmentReady) {
          this.onSegmentReady(this.queue[0]);
        }
        
        // 开始播放第一段
        this.playSegment(this.queue[0], 0);
        
        // 在后台继续合成剩余段落
        this.continueBackgroundSynthesis();
      }
    } catch (error) {
      console.error('[MockAudioQueue] First segment synthesis failed:', error);
      if (this.onError) {
        this.onError(error);
      }
    }
  }

  async continueBackgroundSynthesis() {
    console.log('[MockAudioQueue] Starting background synthesis for remaining segments');
    
    // 从第二段开始合成
    for (let i = 1; i < this.queue.length; i++) {
      // 模拟异步合成
      setTimeout(async () => {
        try {
          await this.synthesizeSegment(this.queue[i].text, i);
          console.log(`[MockAudioQueue] Background segment ${i + 1} ready`);
        } catch (error) {
          console.error(`[MockAudioQueue] Background segment ${i + 1} failed:`, error);
        }
      }, i * 800); // 模拟合成时间间隔
    }
  }

  async synthesizeSegment(text, index) {
    console.log(`[MockAudioQueue] Synthesizing segment ${index + 1}: ${text.substring(0, 30)}...`);
    
    // 模拟合成时间
    const synthesisTime = 500 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, synthesisTime));
    
    if (this.queue[index]) {
      this.queue[index].audioUrl = `/mock/audio/segment_${index}.wav`;
      this.queue[index].isReady = true;
      console.log(`[MockAudioQueue] Segment ${index + 1} synthesis completed in ${synthesisTime.toFixed(0)}ms`);
    }
    
    return this.queue[index].audioUrl;
  }

  async playSegment(segment, index) {
    console.log(`[MockAudioQueue] Playing segment ${index + 1}: ${segment.text.substring(0, 30)}...`);
    
    segment.isPlaying = true;
    
    // 模拟播放时间
    const playTime = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, playTime));
    
    segment.isPlayed = true;
    segment.isPlaying = false;
    
    console.log(`[MockAudioQueue] Segment ${index + 1} playback completed`);
    
    // 播放下一段
    this.playNextSegment(index);
  }

  async playNextSegment(currentIndex) {
    const nextIndex = currentIndex + 1;
    
    if (nextIndex >= this.queue.length) {
      console.log('[MockAudioQueue] All segments played, completing');
      this.completePlayback();
      return;
    }
    
    const nextSegment = this.queue[nextIndex];
    
    // 等待下一段准备好
    const isReady = await this.waitForSegment(nextIndex);
    
    if (this.isTimeout()) {
      console.log('[MockAudioQueue] Display timeout reached, stopping playback');
      this.completePlayback();
      return;
    }
    
    if (isReady && nextSegment.isReady && !nextSegment.isPlayed) {
      await this.playSegment(nextSegment, nextIndex);
    } else {
      console.log(`[MockAudioQueue] Segment ${nextIndex + 1} not ready, trying next segment`);
      this.playNextSegment(nextIndex);
    }
  }

  async waitForSegment(index) {
    const maxWait = 5000; // 减少等待时间用于测试
    const startWait = Date.now();
    
    console.log(`[MockAudioQueue] Waiting for segment ${index + 1} to be ready...`);
    
    while (!this.queue[index]?.isReady && !this.queue[index]?.error) {
      if (Date.now() - startWait > maxWait) {
        console.warn(`[MockAudioQueue] Segment ${index + 1} synthesis timeout, skipping`);
        return false;
      }
      
      if (this.isTimeout()) {
        console.warn('[MockAudioQueue] Display timeout reached during wait');
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    if (this.queue[index]?.error) {
      console.warn(`[MockAudioQueue] Segment ${index + 1} has error, skipping:`, this.queue[index].error);
      return false;
    }
    
    console.log(`[MockAudioQueue] Segment ${index + 1} is ready`);
    return true;
  }

  completePlayback() {
    console.log('[MockAudioQueue] Playback completed');
    this.isPlaying = false;
    
    if (this.onAllComplete) {
      this.onAllComplete();
    }
  }

  isTimeout() {
    if (!this.startTime) return false;
    const elapsed = Date.now() - this.startTime;
    return elapsed > this.maxDisplayTime;
  }
}

// 测试函数
async function testSegmentedTTS() {
  console.log('🎵 开始分段TTS功能测试');
  console.log('='.repeat(50));
  
  const testText = `
你好！我是你的AI助手。今天天气真不错，阳光明媚，微风徐徐。
我可以帮你解答各种问题，比如学习、工作、生活等方面的疑问。
如果你有什么需要帮助的地方，请随时告诉我。
我会尽我所能为你提供准确、有用的信息和建议。
让我们一起度过愉快的时光吧！希望我们能成为很好的朋友。
  `.trim();

  // 1. 测试文本分段
  console.log('\n📝 步骤1: 文本分段');
  const segments = segmentText(testText, {
    maxSegmentLength: 80,
    minSegmentLength: 8,
    preferredLength: 40
  });
  
  console.log(`原文本长度: ${testText.length} 字符`);
  console.log(`分段结果: ${segments.length} 个段落`);
  segments.forEach((segment, index) => {
    console.log(`  段落 ${index + 1} (${segment.length}字): ${segment}`);
  });

  // 2. 测试分段TTS
  console.log('\n🎵 步骤2: 分段TTS测试');
  const audioQueue = new MockAudioQueue();
  
  let bubbleShown = false;
  let bubbleCleared = false;
  
  await audioQueue.startSegmentedSynthesis(
    segments,
    (text) => Promise.resolve(`/mock/audio/${Date.now()}.wav`),
    {
      onSegmentReady: (segment) => {
        console.log('✅ 第一段准备完成 - AI气泡应该显示');
        bubbleShown = true;
      },
      onAllComplete: () => {
        console.log('✅ 所有段落播放完成 - AI气泡应该消失');
        bubbleCleared = true;
      },
      onError: (error) => {
        console.error(`❌ 错误: ${error.message}`);
      }
    }
  );

  // 等待测试完成
  await new Promise(resolve => {
    const checkComplete = () => {
      if (bubbleCleared || audioQueue.isTimeout()) {
        resolve();
      } else {
        setTimeout(checkComplete, 500);
      }
    };
    checkComplete();
  });

  // 3. 测试结果
  console.log('\n📊 测试结果');
  console.log('='.repeat(50));
  console.log(`✅ 气泡显示: ${bubbleShown ? '成功' : '失败'}`);
  console.log(`✅ 气泡清除: ${bubbleCleared ? '成功' : '失败'}`);
  console.log(`✅ 超时处理: ${audioQueue.isTimeout() ? '触发超时' : '正常完成'}`);
  
  console.log('\n🎉 分段TTS功能测试完成！');
}

// 运行测试
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSegmentedTTS, segmentText, MockAudioQueue };
} else {
  // 在浏览器中运行
  testSegmentedTTS().catch(console.error);
}
