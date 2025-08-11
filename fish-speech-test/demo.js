/**
 * Fish Speech API 演示脚本
 * 用于测试Fish Speech API的基本功能
 */

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
    console.log('🐟 Fish Speech API 测试开始...\n');
    
    try {
        // 1. 健康检查
        console.log('1️⃣ 测试健康检查...');
        const healthResponse = await fetch(`${API_BASE}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ 健康检查成功:', healthData.status);
        console.log('📊 服务信息:', healthData.service);
        console.log('');
        
        // 2. 获取配置
        console.log('2️⃣ 获取配置信息...');
        const configResponse = await fetch(`${API_BASE}/config`);
        const configData = await configResponse.json();
        console.log('✅ 配置获取成功:');
        console.log(`   - 支持语言: ${configData.languages.length} 种`);
        console.log(`   - 情感标记: ${configData.emotions.length} 种`);
        console.log(`   - 语调标记: ${configData.tones.length} 种`);
        console.log(`   - 特殊效果: ${configData.effects.length} 种`);
        console.log('');
        
        // 3. 检查Fish Speech服务状态
        console.log('3️⃣ 检查Fish Speech服务状态...');
        const statusResponse = await fetch(`${API_BASE}/fish-speech/status`);
        const statusData = await statusResponse.json();
        console.log(`📡 服务状态: ${statusData.status}`);
        console.log(`🔧 服务类型: ${statusData.type || 'unknown'}`);
        console.log(`💬 状态信息: ${statusData.message}`);
        console.log('');
        
        // 4. 测试语音合成（模拟）
        console.log('4️⃣ 测试语音合成API...');
        const synthesizeData = {
            text: "你好，这是Fish Speech的测试。(happy) 我很高兴为您服务！",
            language: "zh"
        };
        
        console.log('📝 合成文本:', synthesizeData.text);
        console.log('🌍 语言设置:', synthesizeData.language);
        
        const synthesizeResponse = await fetch(`${API_BASE}/fish-speech/synthesize`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(synthesizeData)
        });
        
        if (synthesizeResponse.ok) {
            const audioBlob = await synthesizeResponse.blob();
            console.log('✅ 合成请求成功');
            console.log(`📊 音频大小: ${audioBlob.size} bytes`);
            console.log(`🎵 音频类型: ${audioBlob.type}`);
        } else {
            const errorData = await synthesizeResponse.json();
            console.log('⚠️ 合成请求失败（预期行为）');
            console.log(`❌ 错误信息: ${errorData.message}`);
            console.log('💡 这是正常的，因为还没有部署Fish Speech服务');
        }
        console.log('');
        
        // 5. 显示示例用法
        console.log('5️⃣ 示例用法:');
        console.log('');
        console.log('🎭 情感表达示例:');
        console.log('   "我今天很开心！(happy) 但是有点累了。(tired)"');
        console.log('   "哇，太惊讶了！(surprised) 这真是太棒了！(excited)"');
        console.log('');
        console.log('🎵 语调控制示例:');
        console.log('   "请小声说话。(whispering) 不要大声喊叫！(shouting)"');
        console.log('   "我们需要快点。(in a hurry tone)"');
        console.log('');
        console.log('✨ 特殊效果示例:');
        console.log('   "哈哈哈，太有趣了！(laughing)"');
        console.log('   "呜呜呜，好难过。(crying loudly)"');
        console.log('   "唉，算了吧。(sighing)"');
        console.log('');
        
        console.log('🎉 API测试完成！');
        console.log('🌐 现在可以访问 http://localhost:3001/index.html 进行完整测试');
        
    } catch (error) {
        console.error('❌ API测试失败:', error.message);
    }
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
    // Node.js环境
    const { fetch } = await import('node-fetch');
    global.fetch = fetch;
    testAPI();
} else {
    // 浏览器环境
    window.testFishSpeechAPI = testAPI;
}
