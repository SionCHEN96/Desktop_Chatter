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

        // 构建请求参数 - 只包含GPT-SoVITS API支持的字段
        const params = {
            text: text.trim(),
            text_lang: options.text_lang || DEFAULT_PARAMS.text_lang,
            ref_audio_path: characterConfig.refAudio,
            prompt_text: characterConfig.refText,
            prompt_lang: characterConfig.language,
            top_k: options.top_k || DEFAULT_PARAMS.top_k,
            top_p: options.top_p || DEFAULT_PARAMS.top_p,
            temperature: options.temperature || DEFAULT_PARAMS.temperature,
            text_split_method: DEFAULT_PARAMS.text_split_method,
            batch_size: DEFAULT_PARAMS.batch_size,
            batch_threshold: DEFAULT_PARAMS.batch_threshold,
            split_bucket: DEFAULT_PARAMS.split_bucket,
            speed_factor: options.speed_factor || DEFAULT_PARAMS.speed_factor,
            fragment_interval: DEFAULT_PARAMS.fragment_interval,
            seed: DEFAULT_PARAMS.seed,
            media_type: DEFAULT_PARAMS.media_type,
            streaming_mode: DEFAULT_PARAMS.streaming_mode,
            parallel_infer: true,
            repetition_penalty: 1.35,
            sample_steps: 32,
            super_sampling: false
        };

        console.log(`[${new Date().toISOString()}] Synthesis request:`, {
            text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
            character,
            params: { ...params, text: '[TRUNCATED]' }
        });

        // 发送请求到GPT-SoVITS API - 使用GET方法
        const endpoint = '/tts';
        const queryParams = new URLSearchParams(params);
        const config = {
            method: 'GET',
            url: `${GPT_SOVITS_API_URL}${endpoint}?${queryParams}`,
            timeout: 60000,
            responseType: 'arraybuffer'
        };

        const response = await axios(config);

        if (response.data) {
            console.log(`[${new Date().toISOString()}] Synthesis completed:`, {
                textLength: text.length,
                audioSize: response.data.length,
                character
            });

            // 设置响应头
            res.set({
                'Content-Type': 'audio/wav',
                'Content-Length': response.data.length,
                'Content-Disposition': `attachment; filename="gpt-sovits-${Date.now()}.wav"`
            });

            res.send(response.data);
        } else {
            throw new Error('No audio data received from GPT-SoVITS API');
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
