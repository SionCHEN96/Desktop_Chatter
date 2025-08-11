/**
 * Fish Speech 服务检查脚本
 * 检查本地Fish Speech服务是否正常运行
 */

const FISH_SPEECH_URL = 'http://localhost:8080';

async function checkFishSpeechService() {
    console.log('🔍 检查Fish Speech服务状态...\n');
    
    try {
        // 1. 检查服务是否响应
        console.log('1️⃣ 检查服务连接...');
        const healthResponse = await fetch(`${FISH_SPEECH_URL}/health`, {
            timeout: 5000
        });
        
        if (healthResponse.ok) {
            console.log('✅ Fish Speech服务正在运行');
            const healthData = await healthResponse.text();
            console.log(`📊 响应: ${healthData}`);
        } else {
            console.log(`⚠️ 服务响应异常: ${healthResponse.status}`);
        }
        
        // 2. 检查API端点
        console.log('\n2️⃣ 检查API端点...');
        const endpoints = ['/health', '/docs', '/api', '/v1'];
        
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(`${FISH_SPEECH_URL}${endpoint}`, {
                    timeout: 3000
                });
                console.log(`${endpoint}: ${response.ok ? '✅' : '❌'} (${response.status})`);
            } catch (error) {
                console.log(`${endpoint}: ❌ (${error.message})`);
            }
        }
        
        // 3. 测试TTS功能
        console.log('\n3️⃣ 测试TTS功能...');
        await testTTSFunction();
        
        console.log('\n🎉 Fish Speech服务检查完成！');
        
    } catch (error) {
        console.log('❌ Fish Speech服务未运行或无法连接');
        console.log(`错误: ${error.message}`);
        console.log('\n💡 解决方案:');
        console.log('1. 确保已运行 start_fish_speech.bat');
        console.log('2. 等待服务完全启动（可能需要1-2分钟）');
        console.log('3. 检查8080端口是否被占用');
        console.log('4. 查看Fish Speech服务的控制台输出');
    }
}

async function testTTSFunction() {
    const testEndpoints = [
        '/v1/tts',
        '/api/tts', 
        '/tts',
        '/synthesize'
    ];
    
    const testData = {
        text: '你好，这是Fish Speech测试',
        language: 'zh'
    };
    
    for (const endpoint of testEndpoints) {
        try {
            console.log(`测试端点: ${endpoint}`);
            
            const response = await fetch(`${FISH_SPEECH_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(testData),
                timeout: 10000
            });
            
            if (response.ok) {
                const contentType = response.headers.get('content-type');
                console.log(`✅ ${endpoint}: 成功 (${contentType})`);
                
                // 如果返回音频，检查大小
                if (contentType && contentType.includes('audio')) {
                    const audioBlob = await response.blob();
                    console.log(`   音频大小: ${audioBlob.size} bytes`);
                }
                
                return true; // 找到可用端点就返回
            } else {
                console.log(`❌ ${endpoint}: ${response.status} ${response.statusText}`);
            }
            
        } catch (error) {
            console.log(`❌ ${endpoint}: ${error.message}`);
        }
    }
    
    console.log('⚠️ 所有TTS端点都不可用');
    return false;
}

async function checkOurTestServer() {
    console.log('\n🔍 检查我们的测试服务器...');
    
    try {
        const response = await fetch('http://localhost:3001/api/health');
        if (response.ok) {
            console.log('✅ 测试服务器正在运行');
            const data = await response.json();
            console.log(`📊 服务: ${data.service}`);
        } else {
            console.log('❌ 测试服务器未运行');
            console.log('💡 请运行: npm start');
        }
    } catch (error) {
        console.log('❌ 测试服务器未运行');
        console.log('💡 请运行: npm start');
    }
}

async function fullSystemCheck() {
    console.log('🔍 完整系统检查\n');
    
    await checkFishSpeechService();
    await checkOurTestServer();
    
    console.log('\n📋 系统状态总结:');
    console.log('- Fish Speech服务: 检查上方结果');
    console.log('- 测试服务器: 检查上方结果');
    console.log('- 测试页面: http://localhost:3001/index.html');
    
    console.log('\n🎯 如果两个服务都正常运行:');
    console.log('1. 访问 http://localhost:3001/index.html');
    console.log('2. 输入文本进行语音合成');
    console.log('3. 应该能听到真实的Fish Speech语音！');
}

// 如果直接运行此脚本
if (typeof window === 'undefined') {
    // Node.js环境
    const { fetch } = await import('node-fetch');
    global.fetch = fetch;
    fullSystemCheck();
} else {
    // 浏览器环境
    window.checkFishSpeech = checkFishSpeechService;
    window.fullSystemCheck = fullSystemCheck;
}
