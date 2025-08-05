const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 9880;

// 启用CORS
app.use(cors());
app.use(express.json());

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        message: 'Mock GPT-SoVITS service is running',
        timestamp: new Date().toISOString()
    });
});

// 模拟GPT-SoVITS API端点
app.post('/api/gpt-sovits', (req, res) => {
    console.log('收到语音合成请求:', req.body);

    const { text, character, language, speed, temperature, top_p } = req.body;

    // 模拟处理时间
    setTimeout(() => {
        // 返回模拟的成功响应
        res.json({
            success: true,
            message: '语音合成完成 (模拟)',
            data: {
                audio_url: '/mock-audio.wav',
                text: text,
                character: character,
                language: language,
                duration: Math.random() * 10 + 2, // 随机2-12秒
                parameters: {
                    speed: speed,
                    temperature: temperature,
                    top_p: top_p
                }
            },
            timestamp: new Date().toISOString()
        });
    }, 1000 + Math.random() * 2000); // 1-3秒的模拟处理时间
});

// 兼容直接调用 /synthesize 端点
app.post('/synthesize', (req, res) => {
    console.log('收到语音合成请求 (/synthesize):', req.body);

    const { text, character, language, speed, temperature, top_p } = req.body;

    // 模拟处理时间
    setTimeout(() => {
        // 返回模拟的成功响应
        res.json({
            success: true,
            message: '语音合成完成 (模拟)',
            data: {
                audio_url: '/mock-audio.wav',
                text: text,
                character: character,
                language: language,
                duration: Math.random() * 10 + 2, // 随机2-12秒
                parameters: {
                    speed: speed,
                    temperature: temperature,
                    top_p: top_p
                }
            },
            timestamp: new Date().toISOString()
        });
    }, 1000 + Math.random() * 2000); // 1-3秒的模拟处理时间
});

// 兼容直接调用 /synthesize 端点
app.post('/synthesize', (req, res) => {
    console.log('收到语音合成请求 (/synthesize):', req.body);

    const { text, character, language, speed, temperature, top_p } = req.body;

    // 模拟处理时间
    setTimeout(() => {
        // 返回模拟的成功响应
        res.json({
            success: true,
            message: '语音合成完成 (模拟)',
            data: {
                audio_url: '/mock-audio.wav',
                text: text,
                character: character,
                language: language,
                duration: Math.random() * 10 + 2, // 随机2-12秒
                parameters: {
                    speed: speed,
                    temperature: temperature,
                    top_p: top_p
                }
            },
            timestamp: new Date().toISOString()
        });
    }, 1000 + Math.random() * 2000); // 1-3秒的模拟处理时间
});

// 模拟音频文件端点
app.get('/mock-audio.wav', (req, res) => {
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', 'inline; filename="mock-audio.wav"');

    // 创建一个简单的WAV文件头（44字节）+ 3秒的静音数据
    const sampleRate = 22050; // 22.05kHz
    const duration = 3; // 3秒
    const numSamples = sampleRate * duration;
    const numChannels = 1; // 单声道
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = numSamples * blockAlign;
    const fileSize = 36 + dataSize;

    // WAV文件头
    const header = Buffer.alloc(44);
    header.write('RIFF', 0);
    header.writeUInt32LE(fileSize, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16); // fmt chunk size
    header.writeUInt16LE(1, 20); // audio format (PCM)
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    // 创建静音数据（全为0）
    const audioData = Buffer.alloc(dataSize, 0);

    // 发送完整的WAV文件
    res.send(Buffer.concat([header, audioData]));
});

// 获取可用角色列表
app.get('/api/characters', (req, res) => {
    res.json({
        success: true,
        characters: [
            { id: 'xiangling', name: 'Xiangling', language: 'ZH' },
            { id: 'demo1', name: 'Demo Character 1', language: 'EN' },
            { id: 'demo2', name: 'Demo Character 2', language: 'ZH' }
        ]
    });
});

// 错误处理
app.use((err, req, res, next) => {
    console.error('服务器错误:', err);
    res.status(500).json({
        success: false,
        error: '服务器内部错误',
        message: err.message
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '端点不存在',
        message: `未找到路径: ${req.path}`
    });
});

app.listen(PORT, '127.0.0.1', () => {
    console.log(`🎭 Mock GPT-SoVITS 服务启动成功!`);
    console.log(`📍 服务地址: http://127.0.0.1:${PORT}`);
    console.log(`🔧 API端点: http://127.0.0.1:${PORT}/api/gpt-sovits`);
    console.log(`💚 健康检查: http://127.0.0.1:${PORT}/health`);
    console.log(`👥 角色列表: http://127.0.0.1:${PORT}/api/characters`);
    console.log('');
    console.log('⚠️  这是一个模拟服务，用于测试界面功能。');
    console.log('   真实的语音合成需要启动完整的GPT-SoVITS服务。');
});
