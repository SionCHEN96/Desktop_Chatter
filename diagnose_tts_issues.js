/**
 * TTS问题诊断脚本
 * 用于检查和诊断TTS相关问题
 */

import fetch from 'node-fetch';

const FISH_SPEECH_URL = 'http://localhost:8081';
const TTS_PROXY_URL = 'http://localhost:3002';

async function checkService(url, serviceName) {
  try {
    console.log(`\n🔍 检查 ${serviceName} (${url})...`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal
    });
    const responseTime = Date.now() - startTime;
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      console.log(`✅ ${serviceName} 运行正常 (${response.status}, ${responseTime}ms)`);
      return true;
    } else {
      console.log(`⚠️ ${serviceName} 响应异常: ${response.status}`);
      return false;
    }
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log(`❌ ${serviceName} 连接超时 (>5秒)`);
    } else if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ${serviceName} 连接被拒绝 - 服务未运行`);
    } else {
      console.log(`❌ ${serviceName} 连接失败: ${error.message}`);
    }
    return false;
  }
}

async function testTTSSynthesis() {
  console.log('\n🎵 测试TTS合成功能...');
  
  const testTexts = [
    '你好',  // 短文本
    '你好！我是AI助手。',  // 中等文本
    '你好！我是你的智能助手，随时准备帮你解答问题、提供建议或陪你聊天～'  // 长文本
  ];
  
  for (let i = 0; i < testTexts.length; i++) {
    const text = testTexts[i];
    console.log(`\n测试文本 ${i + 1} (${text.length}字): ${text}`);
    
    try {
      const startTime = Date.now();
      
      const response = await fetch(`${TTS_PROXY_URL}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text,
          referenceAudio: null,
          referenceText: null
        }),
        signal: AbortSignal.timeout(30000) // 30秒超时
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ 合成成功 (${responseTime}ms): ${result.audioUrl}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(`❌ 合成失败 (${responseTime}ms): ${response.status} - ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      if (error.name === 'TimeoutError') {
        console.log(`❌ 合成超时 (>30秒)`);
      } else {
        console.log(`❌ 合成错误: ${error.message}`);
      }
    }
  }
}

async function checkEncodingIssues() {
  console.log('\n🔤 检查编码问题...');
  
  const testStrings = [
    '你好',
    '浣犲ソ鍛€',  // 编码错误的例子
    '鎴戞槸浣犵殑鏅鸿兘鍔╂墜'  // 编码错误的例子
  ];
  
  testStrings.forEach((str, index) => {
    console.log(`\n测试字符串 ${index + 1}: ${str}`);
    
    // 检查是否包含编码错误字符
    const encodingIssuePatterns = ['锛', '鍚', '浣', '鎴', '鍙', '甯', '瑙', '鐞', '闂', '鍚', '鍛€', '鏄', '鐨', '鏅', '鸿兘', '鍔╂墜'];
    const hasEncodingIssue = encodingIssuePatterns.some(pattern => str.includes(pattern));
    
    if (hasEncodingIssue) {
      console.log('❌ 检测到编码问题');
      
      try {
        // 尝试修复
        const buffer = Buffer.from(str, 'latin1');
        const fixed = buffer.toString('utf8');
        console.log(`🔧 修复后: ${fixed}`);
        
        // 检查修复效果
        const commonChars = ['你', '好', '是', '的', '我', '在', '有', '了', '不', '和'];
        const fixedScore = commonChars.reduce((score, char) => score + (fixed.includes(char) ? 1 : 0), 0);
        const originalScore = commonChars.reduce((score, char) => score + (str.includes(char) ? 1 : 0), 0);
        
        if (fixedScore > originalScore) {
          console.log('✅ 编码修复成功');
        } else {
          console.log('⚠️ 编码修复效果不明显');
        }
      } catch (error) {
        console.log(`❌ 编码修复失败: ${error.message}`);
      }
    } else {
      console.log('✅ 编码正常');
    }
  });
}

async function checkSystemResources() {
  console.log('\n💻 检查系统资源...');
  
  try {
    // 检查内存使用
    const memUsage = process.memoryUsage();
    console.log(`内存使用:`);
    console.log(`  RSS: ${Math.round(memUsage.rss / 1024 / 1024)}MB`);
    console.log(`  Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
    console.log(`  Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    
    // 检查CPU使用（简单估算）
    const startTime = process.hrtime();
    const startUsage = process.cpuUsage();
    
    // 等待100ms
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const endTime = process.hrtime(startTime);
    const endUsage = process.cpuUsage(startUsage);
    
    const cpuPercent = (endUsage.user + endUsage.system) / (endTime[0] * 1000000 + endTime[1] / 1000) * 100;
    console.log(`CPU使用率: ${cpuPercent.toFixed(2)}%`);
    
  } catch (error) {
    console.log(`❌ 系统资源检查失败: ${error.message}`);
  }
}

async function main() {
  console.log('🔍 TTS问题诊断工具');
  console.log('='.repeat(50));
  
  // 1. 检查服务状态
  console.log('\n📋 步骤1: 检查服务状态');
  const fishSpeechRunning = await checkService(FISH_SPEECH_URL, 'Fish Speech Service');
  const fishSpeechHealth = await checkService(`${FISH_SPEECH_URL}/v1/health`, 'Fish Speech Health');
  const ttsProxyRunning = await checkService(TTS_PROXY_URL, 'TTS Proxy Service');
  const ttsProxyHealth = await checkService(`${TTS_PROXY_URL}/api/health`, 'TTS Proxy Health');
  
  // 2. 检查编码问题
  await checkEncodingIssues();
  
  // 3. 检查系统资源
  await checkSystemResources();
  
  // 4. 测试TTS合成（如果服务正常）
  if (fishSpeechRunning && ttsProxyRunning) {
    await testTTSSynthesis();
  } else {
    console.log('\n⚠️ 跳过TTS合成测试 - 服务未运行');
  }
  
  // 5. 总结和建议
  console.log('\n📊 诊断总结');
  console.log('='.repeat(50));
  
  if (!fishSpeechRunning) {
    console.log('❌ Fish Speech服务未运行');
    console.log('💡 建议: 运行 start_fish_speech_clean.bat 启动服务');
  }
  
  if (!ttsProxyRunning) {
    console.log('❌ TTS代理服务未运行');
    console.log('💡 建议: 运行 node fish-speech-test/server.js 启动代理');
  }
  
  if (fishSpeechRunning && ttsProxyRunning) {
    console.log('✅ 所有服务运行正常');
    console.log('💡 如果仍有问题，可能是:');
    console.log('   - Fish Speech模型加载慢');
    console.log('   - GPU内存不足');
    console.log('   - 网络延迟');
    console.log('   - 文本编码问题');
  }
  
  console.log('\n🎯 优化建议:');
  console.log('1. 使用分段TTS减少单次合成时间');
  console.log('2. 检查GPU内存和CUDA状态');
  console.log('3. 确保文本编码正确');
  console.log('4. 考虑增加超时时间或重试次数');
}

// 运行诊断
main().catch(console.error);
