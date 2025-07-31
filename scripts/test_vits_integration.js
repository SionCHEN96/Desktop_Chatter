/**
 * VITS集成测试脚本
 * 测试语音合成功能是否正常工作
 */

import { VITSService } from '../src/core/audio/VITSService.js';
import { AudioService } from '../src/main/services/audioService.js';
import { createLogger } from '../src/utils/index.js';

const logger = createLogger('VITSIntegrationTest');

/**
 * 测试VITS服务
 */
async function testVITSService() {
  console.log('\n=== 测试VITS服务 ===');
  
  try {
    const vitsService = new VITSService();
    
    // 测试文本
    const testTexts = [
      '你好，我是香菱！',
      '今天要做什么好吃的呢？',
      '让我来为你准备美味的料理吧！'
    ];
    
    for (const text of testTexts) {
      console.log(`\n测试文本: "${text}"`);
      
      try {
        const audioPath = await vitsService.generateSpeech(text);
        console.log(`✓ 语音生成成功: ${audioPath}`);
      } catch (error) {
        console.error(`✗ 语音生成失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('VITS服务测试失败:', error);
  }
}

/**
 * 测试音频服务
 */
async function testAudioService() {
  console.log('\n=== 测试音频服务 ===');
  
  try {
    const audioService = new AudioService();
    
    // 测试AI响应处理
    const testResponses = [
      '你好！我是你的AI助手。',
      '今天天气真不错呢！',
      '有什么我可以帮助你的吗？'
    ];
    
    for (const response of testResponses) {
      console.log(`\n测试AI响应: "${response}"`);
      
      try {
        const audioPath = await audioService.generateSpeechForResponse(response);
        if (audioPath) {
          console.log(`✓ 语音生成成功: ${audioPath}`);
        } else {
          console.log('○ 语音生成跳过（可能是重复文本或TTS禁用）');
        }
      } catch (error) {
        console.error(`✗ 语音生成失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('音频服务测试失败:', error);
  }
}

/**
 * 测试文本清理功能
 */
function testTextCleaning() {
  console.log('\n=== 测试文本清理功能 ===');
  
  const audioService = new AudioService();
  
  const testCases = [
    {
      input: '**你好**，我是*AI助手*！',
      expected: '你好，我是AI助手！'
    },
    {
      input: '这是一个很长的文本'.repeat(20),
      expected: '长度应该被限制'
    },
    {
      input: '包含特殊字符@#$%的文本',
      expected: '应该移除特殊字符'
    }
  ];
  
  testCases.forEach((testCase, index) => {
    console.log(`\n测试用例 ${index + 1}:`);
    console.log(`输入: "${testCase.input.substring(0, 50)}${testCase.input.length > 50 ? '...' : ''}"`);
    
    const cleaned = audioService.cleanTextForTTS(testCase.input);
    console.log(`输出: "${cleaned}"`);
    console.log(`长度: ${cleaned.length} 字符`);
  });
}

/**
 * 测试香菱Speaker ID查找
 */
function testXianglingSpearerIdLookup() {
  console.log('\n=== 测试香菱Speaker ID查找 ===');
  
  try {
    const vitsService = new VITSService();
    const speakerId = vitsService.xianglingSpearerId;
    
    console.log(`香菱Speaker ID: ${speakerId}`);
    
    if (speakerId === 98) {
      console.log('✓ 香菱Speaker ID正确');
    } else {
      console.log('⚠ 香菱Speaker ID可能不正确，预期值为98');
    }
    
  } catch (error) {
    console.error('香菱Speaker ID查找失败:', error);
  }
}

/**
 * 主测试函数
 */
async function runTests() {
  console.log('🎵 VITS语音合成集成测试开始 🎵');
  console.log('=====================================');
  
  try {
    // 测试香菱Speaker ID查找
    testXianglingSpearerIdLookup();
    
    // 测试文本清理
    testTextCleaning();
    
    // 测试VITS服务
    await testVITSService();
    
    // 测试音频服务
    await testAudioService();
    
    console.log('\n=====================================');
    console.log('🎉 所有测试完成！');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 运行测试
runTests().catch(console.error);
