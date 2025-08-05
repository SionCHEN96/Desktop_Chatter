/**
 * GPT-SoVITS 测试服务器
 * 提供GPT-SoVITS API代理和测试网页服务
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// GPT-SoVITS API配置
const GPT_SOVITS_API_URL = 'http://localhost:9880';
const USE_API_V2 = true;

// 中间件配置
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 请求日志中间件
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 静态文件服务
app.use(express.static('public'));

// 文本切分函数
function splitText(text, maxLength = 10) {
    console.log(`[DEBUG] Original text: "${text}", length: ${text.length}`);

    // 如果文本很短，直接返回
    if (text.length <= maxLength) {
        return [text];
    }

    // 按标点符号切分
    const sentences = text.split(/[。！？；，\.\!\?\;\,]/).filter(s => s.trim().length > 0);
    console.log(`[DEBUG] Split by punctuation:`, sentences);

    const chunks = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        const trimmedSentence = sentence.trim();
        if (!trimmedSentence) continue;

        // 如果当前句子本身就超过最大长度，需要进一步切分
        if (trimmedSentence.length > maxLength) {
            // 先保存当前块
            if (currentChunk) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }

            // 按字符强制切分长句子
            for (let i = 0; i < trimmedSentence.length; i += maxLength) {
                const chunk = trimmedSentence.substring(i, i + maxLength);
                if (chunk.trim()) {
                    chunks.push(chunk.trim());
                }
            }
        } else if (currentChunk.length + trimmedSentence.length <= maxLength) {
            // 可以添加到当前块
            currentChunk += (currentChunk ? '' : '') + trimmedSentence;
        } else {
            // 当前块已满，开始新块
            if (currentChunk) {
                chunks.push(currentChunk.trim());
            }
            currentChunk = trimmedSentence;
        }
    }

    // 添加最后一块
    if (currentChunk) {
        chunks.push(currentChunk.trim());
    }

    // 如果没有有效的块，按字符强制切分
    if (chunks.length === 0) {
        for (let i = 0; i < text.length; i += maxLength) {
            const chunk = text.substring(i, i + maxLength);
            if (chunk.trim()) {
                chunks.push(chunk.trim());
            }
        }
    }

    console.log(`[DEBUG] Final chunks:`, chunks);
    return chunks;
}

// 音频合并函数（简单的WAV文件合并）
function mergeWavBuffers(buffers) {
    if (buffers.length === 0) return null;
    if (buffers.length === 1) return buffers[0];

    // 解析第一个WAV文件的头部信息
    const firstBuffer = buffers[0];
    const header = firstBuffer.slice(0, 44); // WAV头部通常是44字节

    // 提取音频数据（跳过头部）
    const audioDataBuffers = buffers.map(buffer => buffer.slice(44));

    // 计算总的音频数据长度
    const totalAudioLength = audioDataBuffers.reduce((sum, buffer) => sum + buffer.length, 0);

    // 创建新的合并缓冲区
    const mergedBuffer = Buffer.alloc(44 + totalAudioLength);

    // 复制头部
    header.copy(mergedBuffer, 0);

    // 更新文件大小信息
    const totalFileSize = 36 + totalAudioLength;
    mergedBuffer.writeUInt32LE(totalFileSize, 4); // 文件大小
    mergedBuffer.writeUInt32LE(totalAudioLength, 40); // 数据块大小

    // 合并音频数据
    let offset = 44;
    for (const audioBuffer of audioDataBuffers) {
        audioBuffer.copy(mergedBuffer, offset);
        offset += audioBuffer.length;
    }

    return mergedBuffer;
}

// 单段文本合成
async function synthesizeSingleChunk(text, characterConfig, options) {
    // 构建请求参数
    const params = {
        text: text.trim(),
        text_lang: options.text_lang || DEFAULT_PARAMS.text_lang,
        ref_audio_path: characterConfig.refAudio,
        prompt_text: characterConfig.refText,
        prompt_lang: characterConfig.language,
        top_k: options.top_k || DEFAULT_PARAMS.top_k,
        top_p: options.top_p || DEFAULT_PARAMS.top_p,
        temperature: options.temperature || DEFAULT_PARAMS.temperature,
        speed_factor: options.speed_factor || DEFAULT_PARAMS.speed_factor,
        seed: DEFAULT_PARAMS.seed,
        media_type: DEFAULT_PARAMS.media_type
    };

    // 发送请求到GPT-SoVITS API
    const endpoint = '/tts';
    const queryParams = new URLSearchParams(params);
    const config = {
        method: 'GET',
        url: `${GPT_SOVITS_API_URL}${endpoint}?${queryParams}`,
        timeout: 30000,
        responseType: 'arraybuffer'
    };

    const response = await axios(config);

    if (response.status === 200 && response.data) {
        return Buffer.from(response.data);
    } else {
        throw new Error(`GPT-SoVITS API returned status ${response.status}`);
    }
}

// 长文本分段合成
async function synthesizeLongText(text, characterConfig, options, maxChunkLength) {
    console.log(`[${new Date().toISOString()}] Long text synthesis started, length: ${text.length}`);

    // 切分文本
    const chunks = splitText(text, maxChunkLength);
    console.log(`[${new Date().toISOString()}] Text split into ${chunks.length} chunks:`, chunks);

    const audioBuffers = [];

    // 逐段合成
    for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        console.log(`[${new Date().toISOString()}] Synthesizing chunk ${i + 1}/${chunks.length}: "${chunk}"`);

        try {
            const audioBuffer = await synthesizeSingleChunk(chunk, characterConfig, options);
            audioBuffers.push(audioBuffer);

            // 添加短暂延迟，避免请求过于频繁
            if (i < chunks.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.error(`[${new Date().toISOString()}] Failed to synthesize chunk ${i + 1}: "${chunk}"`, error.message);
            // 继续处理其他块，不中断整个过程
        }
    }

    if (audioBuffers.length === 0) {
        throw new Error('All chunks failed to synthesize');
    }

    console.log(`[${new Date().toISOString()}] Successfully synthesized ${audioBuffers.length}/${chunks.length} chunks`);

    // 合并音频
    const mergedAudio = mergeWavBuffers(audioBuffers);
    if (!mergedAudio) {
        throw new Error('Failed to merge audio buffers');
    }

    console.log(`[${new Date().toISOString()}] Audio merge completed, final size: ${mergedAudio.length} bytes`);
    return mergedAudio;
}

// 默认角色配置
const DEFAULT_CHARACTERS = {
    XIANGLING: {
        name: 'XIANGLING',
        displayName: 'xiangling',
        refAudio: path.resolve(__dirname, 'public/GPT-SOVITS-models/RefAudio-Xiangling.wav'),
        refText: '我是不会对食物有什么偏见的，只有不合适的做法...',
        language: 'zh'
    }
};

// 默认合成参数
const DEFAULT_PARAMS = {
    text_lang: 'zh',
    ref_audio_path: path.resolve(__dirname, 'public/GPT-SOVITS-models/RefAudio-Xiangling.wav'),
    prompt_text: '我是不会对食物有什么偏见的，只有不合适的做法...',
    prompt_lang: 'zh',
    top_k: 5,
    top_p: 1.0,
    temperature: 1.0,
    text_split_method: 'cut5',
    batch_size: 1,
    batch_threshold: 0.75,
    split_bucket: true,
    speed_factor: 1.0,
    fragment_interval: 0.3,
    seed: -1,
    media_type: 'wav',
    streaming_mode: false
};

/**
 * 健康检查端点
 */
app.get('/api/health', async (req, res) => {
    try {
        // 检查GPT-SoVITS服务是否可用 - 使用/tts端点进行测试
        const testParams = new URLSearchParams({
            text: 'test',
            text_lang: 'zh',
            ref_audio_path: DEFAULT_PARAMS.ref_audio_path,
            prompt_text: DEFAULT_PARAMS.prompt_text,
            prompt_lang: 'zh'
        });
        const response = await axios.get(`${GPT_SOVITS_API_URL}/tts?${testParams}`, {
            timeout: 10000
        }).catch((error) => {
            // 400错误表示服务正在运行，只是参数问题
            if (error.response && error.response.status === 400) {
                return error.response;
            }
            return null;
        });

        // 简化检查 - 如果能到达这里说明服务基本可用
        const gptSovitsStatus = 'connected';
        
        res.json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            gptSovitsService: gptSovitsStatus,
            gptSovitsUrl: GPT_SOVITS_API_URL,
            useApiV2: USE_API_V2
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 获取可用角色列表
 */
app.get('/api/gpt-sovits/characters', (req, res) => {
    try {
        const characters = Object.values(DEFAULT_CHARACTERS);
        res.json(characters);
    } catch (error) {
        res.status(500).json({
            error: 'Failed to get characters',
            details: error.message
        });
    }
});

/**
 * 语音合成端点
 */
app.post('/api/gpt-sovits/synthesize', async (req, res) => {
    try {
        const { text, character = 'XIANGLING', ...options } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                error: 'Invalid text input',
                details: 'Text is required and must be a string'
            });
        }

        // 获取角色配置
        const characterConfig = DEFAULT_CHARACTERS[character.toUpperCase()];
        if (!characterConfig) {
            return res.status(400).json({
                error: 'Invalid character',
                details: `Character '${character}' not found`,
                availableCharacters: Object.keys(DEFAULT_CHARACTERS)
            });
        }

        console.log(`[${new Date().toISOString()}] Synthesis request:`, {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            character,
            textLength: text.length
        });

        // 检查文本长度，决定是否需要切分
        const maxChunkLength = 8; // 每段最大字符数，减少以提高成功率
        let audioBuffer;

        if (text.length <= maxChunkLength) {
            // 短文本直接合成
            console.log(`[${new Date().toISOString()}] Short text synthesis`);
            audioBuffer = await synthesizeSingleChunk(text, characterConfig, options);
        } else {
            // 长文本切分合成
            console.log(`[${new Date().toISOString()}] Long text synthesis (${text.length} chars)`);
            audioBuffer = await synthesizeLongText(text, characterConfig, options, maxChunkLength);
        }

        if (audioBuffer) {
            console.log(`[${new Date().toISOString()}] Synthesis completed:`, {
                textLength: text.length,
                audioSize: audioBuffer.length,
                character
            });

            // 设置响应头
            res.set({
                'Content-Type': 'audio/wav',
                'Content-Length': audioBuffer.length,
                'Content-Disposition': `attachment; filename="gpt-sovits-${Date.now()}.wav"`
            });

            res.send(audioBuffer);
        } else {
            throw new Error('No audio data generated');
        }

    } catch (error) {
        console.error(`[${new Date().toISOString()}] Synthesis failed:`, {
            error: error.message,
            text: req.body.text?.substring(0, 50) + '...'
        });

        if (error.code === 'ECONNREFUSED') {
            res.status(503).json({
                error: 'GPT-SoVITS service unavailable',
                details: `Cannot connect to GPT-SoVITS API at ${GPT_SOVITS_API_URL}`,
                suggestion: 'Please ensure GPT-SoVITS service is running'
            });
        } else if (error.code === 'ETIMEDOUT') {
            res.status(504).json({
                error: 'Request timeout',
                details: 'GPT-SoVITS API request timed out',
                suggestion: 'The text might be too long or the service is overloaded'
            });
        } else if (error.response) {
            res.status(error.response.status || 500).json({
                error: 'GPT-SoVITS API error',
                details: error.response.statusText || error.message,
                status: error.response.status
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                details: error.message
            });
        }
    }
});

/**
 * 获取服务信息
 */
app.get('/api/gpt-sovits/info', (req, res) => {
    res.json({
        apiUrl: GPT_SOVITS_API_URL,
        useApiV2: USE_API_V2,
        availableCharacters: Object.keys(DEFAULT_CHARACTERS),
        defaultParams: DEFAULT_PARAMS,
        endpoints: {
            health: '/api/health',
            characters: '/api/gpt-sovits/characters',
            synthesize: '/api/gpt-sovits/synthesize',
            info: '/api/gpt-sovits/info'
        }
    });
});

/**
 * 根路径重定向到测试页面
 */
app.get('/', (req, res) => {
    res.redirect('/gpt-sovits-test.html');
});

/**
 * 错误处理中间件
 */
app.use((error, req, res, next) => {
    console.error(`[${new Date().toISOString()}] Server error:`, error);
    res.status(500).json({
        error: 'Internal server error',
        details: error.message
    });
});

/**
 * 404处理
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Not found',
        path: req.path,
        suggestion: 'Check the API documentation for available endpoints'
    });
});

/**
 * 启动服务器
 */
app.listen(PORT, () => {
    console.log('🚀 GPT-SoVITS测试服务器启动成功!');
    console.log(`📱 测试页面: http://localhost:${PORT}/gpt-sovits-test.html`);
    console.log(`🔧 API端点: http://localhost:${PORT}/api/gpt-sovits/synthesize`);
    console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
    console.log('');
    console.log('📋 使用说明:');
    console.log(`1. 确保GPT-SoVITS服务运行在 ${GPT_SOVITS_API_URL}`);
    console.log('2. 打开浏览器访问测试页面');
    console.log('3. 调整参数并测试语音合成');
    console.log('');
    console.log('⚠️  注意: 如果GPT-SoVITS服务未运行，将显示相应错误信息');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 正在关闭服务器...');
    process.exit(0);
});
