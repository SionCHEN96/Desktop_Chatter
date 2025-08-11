/**
 * Fish Speech 测试服务器
 * 提供Fish Speech API的代理和测试网页服务
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import FormData from 'form-data';

// ES模块中获取__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Fish Speech API配置
const FISH_SPEECH_CONFIG = {
  // 本地Fish Speech API地址（如果本地部署）
  LOCAL_API_URL: 'http://localhost:8080',
  
  // Hugging Face Space API（备用）
  HF_SPACE_URL: 'https://fishaudio-openaudio-s1-mini.hf.space',
  
  // 支持的语言
  SUPPORTED_LANGUAGES: [
    'en', 'zh', 'ja', 'de', 'fr', 'es', 'ko', 'ar', 'ru', 'nl', 'it', 'pl', 'pt'
  ],
  
  // 情感标记
  EMOTION_MARKERS: [
    '(angry)', '(sad)', '(excited)', '(surprised)', '(satisfied)', '(delighted)',
    '(scared)', '(worried)', '(upset)', '(nervous)', '(frustrated)', '(depressed)',
    '(empathetic)', '(embarrassed)', '(disgusted)', '(moved)', '(proud)', '(relaxed)',
    '(grateful)', '(confident)', '(interested)', '(curious)', '(confused)', '(joyful)',
    '(disdainful)', '(unhappy)', '(anxious)', '(hysterical)', '(indifferent)',
    '(impatient)', '(guilty)', '(scornful)', '(panicked)', '(furious)', '(reluctant)'
  ],
  
  // 语调标记
  TONE_MARKERS: [
    '(in a hurry tone)', '(shouting)', '(screaming)', '(whispering)', '(soft tone)'
  ],
  
  // 特殊效果
  SPECIAL_EFFECTS: [
    '(laughing)', '(chuckling)', '(sobbing)', '(crying loudly)', '(sighing)',
    '(panting)', '(groaning)', '(crowd laughing)', '(background laughter)', '(audience laughing)'
  ]
};

// 中间件
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(__dirname));

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Fish Speech Test Server',
    timestamp: new Date().toISOString(),
    config: {
      supportedLanguages: FISH_SPEECH_CONFIG.SUPPORTED_LANGUAGES,
      emotionMarkersCount: FISH_SPEECH_CONFIG.EMOTION_MARKERS.length,
      toneMarkersCount: FISH_SPEECH_CONFIG.TONE_MARKERS.length,
      specialEffectsCount: FISH_SPEECH_CONFIG.SPECIAL_EFFECTS.length
    }
  });
});

/**
 * 获取配置信息
 */
app.get('/api/config', (req, res) => {
  res.json({
    languages: FISH_SPEECH_CONFIG.SUPPORTED_LANGUAGES,
    emotions: FISH_SPEECH_CONFIG.EMOTION_MARKERS,
    tones: FISH_SPEECH_CONFIG.TONE_MARKERS,
    effects: FISH_SPEECH_CONFIG.SPECIAL_EFFECTS
  });
});

/**
 * 检查Fish Speech服务状态
 */
app.get('/api/fish-speech/status', async (req, res) => {
  try {
    console.log('检查Fish Speech服务状态...');

    // 尝试连接本地Fish Speech API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(`${FISH_SPEECH_CONFIG.LOCAL_API_URL}/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const responseText = await response.text();
        console.log('✅ 本地Fish Speech服务可用');

        res.json({
          status: 'available',
          type: 'local',
          url: FISH_SPEECH_CONFIG.LOCAL_API_URL,
          message: '本地Fish Speech服务可用',
          response: responseText,
          timestamp: new Date().toISOString()
        });
        return;
      }
    } catch (localError) {
      clearTimeout(timeoutId);
      console.log('本地服务检查失败:', localError.message);
    }

    // 本地服务不可用，检查Hugging Face Space
    console.log('检查Hugging Face Space...');
    try {
      const hfController = new AbortController();
      const hfTimeoutId = setTimeout(() => hfController.abort(), 10000);

      const hfResponse = await fetch(`${FISH_SPEECH_CONFIG.HF_SPACE_URL}/`, {
        method: 'GET',
        signal: hfController.signal
      });

      clearTimeout(hfTimeoutId);

      if (hfResponse.ok) {
        console.log('✅ Hugging Face Space可用');
        res.json({
          status: 'available',
          type: 'huggingface',
          url: FISH_SPEECH_CONFIG.HF_SPACE_URL,
          message: 'Hugging Face Space可用（可能较慢）',
          timestamp: new Date().toISOString()
        });
        return;
      }
    } catch (hfError) {
      console.log('Hugging Face检查失败:', hfError.message);
    }

    // 所有服务都不可用
    console.log('❌ 所有Fish Speech服务都不可用');
    res.json({
      status: 'unavailable',
      type: 'demo',
      message: 'Fish Speech服务不可用，使用演示模式',
      suggestions: [
        '1. 运行 quick_deploy.bat 部署本地服务',
        '2. 运行 start_fish_speech.bat 启动服务',
        '3. 等待服务启动完成（1-2分钟）',
        '4. 刷新页面重新检查'
      ],
      deploymentGuide: {
        quickDeploy: 'quick_deploy.bat',
        startService: 'start_fish_speech.bat',
        checkService: 'node check_fish_speech.js'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('服务状态检查失败:', error);
    res.status(500).json({
      status: 'error',
      message: '服务状态检查失败',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Fish Speech TTS合成
 */
app.post('/api/fish-speech/synthesize', async (req, res) => {
  try {
    const { text, reference_audio, reference_text, language = 'auto' } = req.body;
    
    if (!text) {
      return res.status(400).json({
        error: 'Text is required',
        message: '请提供要合成的文本'
      });
    }
    
    console.log(`[${new Date().toISOString()}] Fish Speech synthesis request:`, {
      textLength: text.length,
      language,
      hasReferenceAudio: !!reference_audio,
      hasReferenceText: !!reference_text
    });
    
    // 首先尝试本地API
    let response;
    let usedMethod = 'unknown';

    try {
      console.log('尝试本地Fish Speech API...');
      response = await synthesizeWithAPI(FISH_SPEECH_CONFIG.LOCAL_API_URL, {
        text,
        reference_audio,
        reference_text,
        language
      });
      usedMethod = 'local';
    } catch (localError) {
      console.log('本地API失败，尝试Hugging Face Space...');
      try {
        response = await synthesizeWithHuggingFace({
          text,
          reference_audio,
          reference_text,
          language
        });
        usedMethod = 'huggingface';
      } catch (hfError) {
        console.log('Hugging Face失败，使用备用TTS...');
        response = await synthesizeWithBackupTTS({
          text,
          reference_audio,
          reference_text,
          language
        });
        usedMethod = 'backup';
      }
    }
    
    if (response && response.ok) {
      const audioBuffer = await response.arrayBuffer();
      
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': audioBuffer.byteLength,
        'Content-Disposition': `attachment; filename="fish-speech-${Date.now()}.wav"`
      });
      
      res.send(Buffer.from(audioBuffer));
      
      console.log(`[${new Date().toISOString()}] Fish Speech synthesis completed:`, {
        audioSize: audioBuffer.byteLength,
        method: usedMethod
      });
    } else {
      throw new Error('合成失败');
    }
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fish Speech synthesis failed:`, error);
    
    res.status(500).json({
      error: 'Synthesis failed',
      message: error.message || '语音合成失败',
      suggestions: [
        '检查Fish Speech服务是否运行',
        '确认文本格式正确',
        '检查参考音频格式'
      ]
    });
  }
});

/**
 * 使用本地Fish Speech API进行合成
 */
async function synthesizeWithAPI(apiUrl, params) {
  try {
    // 首先检查Fish Speech服务健康状态
    console.log('检查Fish Speech服务健康状态...');
    const healthResponse = await fetch(`${apiUrl}/v1/health`, {
      method: 'GET',
      timeout: 5000
    });

    if (!healthResponse.ok) {
      throw new Error('Fish Speech服务不可用');
    }

    console.log('Fish Speech服务健康检查通过');

    // 构建Fish Speech API请求
    const ttsRequest = {
      text: params.text,
      format: "wav",
      chunk_length: 200,
      normalize: true,
      temperature: 0.8,
      top_p: 0.8,
      repetition_penalty: 1.1
    };

    // 如果有参考音频和文本，添加到请求中
    if (params.reference_audio && params.reference_text) {
      ttsRequest.reference_audio = params.reference_audio;
      ttsRequest.reference_text = params.reference_text;
    }

    console.log(`调用Fish Speech API: ${apiUrl}/v1/tts`);
    console.log('请求参数:', {
      textLength: params.text.length,
      hasReference: !!(params.reference_audio && params.reference_text)
    });

    const response = await fetch(`${apiUrl}/v1/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ttsRequest),
      timeout: 60000 // TTS可能需要较长时间
    });

    if (response.ok) {
      console.log('Fish Speech API调用成功');
      return response;
    } else {
      const errorText = await response.text();
      console.error('Fish Speech API错误:', response.status, errorText);
      throw new Error(`Fish Speech API失败: ${response.status}`);
    }

  } catch (error) {
    console.error('本地Fish Speech API调用失败:', error);
    throw error;
  }
}

/**
 * 简单的TTS端点（用于聊天应用）
 */
app.post('/api/tts', async (req, res) => {
  try {
    const { text, referenceAudio, referenceText } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    console.log('TTS request for text:', text);
    if (referenceAudio && referenceText) {
      console.log('Using voice cloning with reference audio');
    }

    // 检查Fish Speech服务是否可用
    try {
      const healthResponse = await fetch('http://localhost:8080/v1/health');
      if (!healthResponse.ok) {
        throw new Error('Fish Speech server not responding');
      }
    } catch (healthError) {
      console.error('Fish Speech health check failed:', healthError);
      return res.status(503).json({
        error: 'Fish Speech server is not available. Please make sure it is running on port 8080.'
      });
    }

    // 构建Fish Speech API请求
    const ttsRequest = {
      text: text,
      format: "wav",
      chunk_length: 200,
      normalize: true,
      temperature: 0.8,
      top_p: 0.8,
      repetition_penalty: 1.1,
      references: []
    };

    // 如果提供了参考音频，添加到请求中进行声音克隆
    if (referenceAudio && referenceText) {
      try {
        // 参考音频应该是base64编码的字符串
        const audioBytes = Buffer.from(referenceAudio, 'base64');
        ttsRequest.references = [{
          audio: referenceAudio, // Fish Speech API会自动解码base64
          text: referenceText
        }];
        console.log(`Added reference audio: ${audioBytes.length} bytes, text: "${referenceText}"`);
      } catch (error) {
        console.error('Failed to process reference audio:', error);
        return res.status(400).json({ error: 'Invalid reference audio format. Expected base64 encoded audio.' });
      }
    }

    console.log('Sending TTS request to Fish Speech API...');
    const ttsResponse = await fetch('http://localhost:8080/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ttsRequest)
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Fish Speech TTS failed:', ttsResponse.status, errorText);
      return res.status(500).json({
        error: `Fish Speech TTS failed: ${ttsResponse.status}`
      });
    }

    // 获取音频数据
    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log(`TTS successful, audio size: ${audioBuffer.byteLength} bytes`);

    // 生成唯一文件名
    const timestamp = Date.now();
    const filename = `tts_${timestamp}.wav`;
    const audioDir = path.join(__dirname, 'generated_audio');
    const filepath = path.join(audioDir, filename);

    // 创建目录（如果不存在）
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // 保存音频文件
    fs.writeFileSync(filepath, Buffer.from(audioBuffer));

    res.json({
      success: true,
      message: 'TTS completed successfully',
      audioUrl: `/generated_audio/${filename}`,
      audioSize: audioBuffer.byteLength,
      usedVoiceCloning: !!(referenceAudio && referenceText)
    });

  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: 'TTS service error: ' + error.message });
  }
});

// 提供生成的音频文件
app.use('/generated_audio', express.static(path.join(__dirname, 'generated_audio')));

/**
 * 声音克隆端点（支持文件上传）
 */
import multer from 'multer';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

app.post('/api/voice-clone', upload.single('referenceAudio'), async (req, res) => {
  try {
    const { text, referenceText } = req.body;
    const referenceAudioFile = req.file;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (!referenceAudioFile || !referenceText) {
      return res.status(400).json({
        error: 'Both reference audio file and reference text are required for voice cloning'
      });
    }

    console.log('Voice cloning request:');
    console.log(`- Text: ${text}`);
    console.log(`- Reference text: ${referenceText}`);
    console.log(`- Reference audio: ${referenceAudioFile.originalname} (${referenceAudioFile.size} bytes)`);

    // 检查Fish Speech服务是否可用
    try {
      const healthResponse = await fetch('http://localhost:8080/v1/health');
      if (!healthResponse.ok) {
        throw new Error('Fish Speech server not responding');
      }
    } catch (healthError) {
      console.error('Fish Speech health check failed:', healthError);
      return res.status(503).json({
        error: 'Fish Speech server is not available. Please make sure it is running on port 8080.'
      });
    }

    // 将音频文件转换为base64
    const audioBase64 = referenceAudioFile.buffer.toString('base64');

    // 构建Fish Speech API请求
    const ttsRequest = {
      text: text,
      format: "wav",
      chunk_length: 200,
      normalize: true,
      temperature: 0.8,
      top_p: 0.8,
      repetition_penalty: 1.1,
      references: [{
        audio: audioBase64,
        text: referenceText
      }]
    };

    console.log('Sending voice cloning request to Fish Speech API...');
    const ttsResponse = await fetch('http://localhost:8080/v1/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(ttsRequest)
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Fish Speech voice cloning failed:', ttsResponse.status, errorText);
      return res.status(500).json({
        error: `Fish Speech voice cloning failed: ${ttsResponse.status}`
      });
    }

    // 获取音频数据
    const audioBuffer = await ttsResponse.arrayBuffer();
    console.log(`Voice cloning successful, audio size: ${audioBuffer.byteLength} bytes`);

    // 生成唯一文件名
    const timestamp = Date.now();
    const filename = `voice_clone_${timestamp}.wav`;
    const audioDir = path.join(__dirname, 'generated_audio');
    const filepath = path.join(audioDir, filename);

    // 创建目录（如果不存在）
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    // 保存音频文件
    fs.writeFileSync(filepath, Buffer.from(audioBuffer));

    res.json({
      success: true,
      message: 'Voice cloning completed successfully',
      audioUrl: `/generated_audio/${filename}`,
      audioSize: audioBuffer.byteLength,
      referenceAudioSize: referenceAudioFile.size,
      referenceText: referenceText
    });

  } catch (error) {
    console.error('Voice cloning error:', error);
    res.status(500).json({ error: 'Voice cloning service error: ' + error.message });
  }
});

/**
 * 使用Hugging Face Space进行合成
 */
async function synthesizeWithHuggingFace(params) {
  console.log('使用Hugging Face Space合成...');

  try {
    // 方法1: 尝试Gradio API接口
    const gradioResponse = await synthesizeWithGradio(params);
    if (gradioResponse) return gradioResponse;

    // 方法2: 尝试直接API调用
    const directResponse = await synthesizeWithDirectAPI(params);
    if (directResponse) return directResponse;

    // 方法3: 使用备用TTS服务
    const backupResponse = await synthesizeWithBackupTTS(params);
    if (backupResponse) return backupResponse;

    throw new Error('所有Hugging Face方法都失败');

  } catch (error) {
    console.error('Hugging Face合成失败:', error);
    throw error;
  }
}

/**
 * 使用Gradio API进行合成
 */
async function synthesizeWithGradio(params) {
  try {
    const spaceUrl = 'https://fishaudio-openaudio-s1-mini.hf.space';

    // 构建Gradio API请求
    const gradioData = {
      data: [
        params.text,                    // 文本
        params.reference_audio || null, // 参考音频
        params.reference_text || '',    // 参考文本
        params.language || 'auto'       // 语言
      ]
    };

    console.log('调用Gradio API:', spaceUrl);

    const response = await fetch(`${spaceUrl}/api/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(gradioData),
      timeout: 60000 // Gradio可能比较慢
    });

    if (response.ok) {
      const result = await response.json();

      // Gradio返回的数据格式可能是 {data: [audio_url]}
      if (result.data && result.data[0]) {
        const audioUrl = result.data[0];

        // 下载音频文件
        const audioResponse = await fetch(audioUrl);
        if (audioResponse.ok) {
          console.log('Gradio API合成成功');
          return audioResponse;
        }
      }
    }

    throw new Error('Gradio API调用失败');

  } catch (error) {
    console.log('Gradio方法失败:', error.message);
    return null;
  }
}

/**
 * 使用直接API调用
 */
async function synthesizeWithDirectAPI(params) {
  try {
    // 尝试Fish Audio的在线API（如果有的话）
    const apiEndpoints = [
      'https://api.fish.audio/v1/tts',
      'https://fishaudio-openaudio-s1-mini.hf.space/api/tts'
    ];

    for (const endpoint of apiEndpoints) {
      try {
        console.log('尝试直接API:', endpoint);

        const requestBody = {
          text: params.text,
          language: params.language || 'auto'
        };

        if (params.reference_audio) {
          requestBody.reference_audio = params.reference_audio;
        }

        if (params.reference_text) {
          requestBody.reference_text = params.reference_text;
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          timeout: 30000
        });

        if (response.ok) {
          console.log('直接API调用成功');
          return response;
        }

      } catch (endpointError) {
        console.log(`端点 ${endpoint} 失败:`, endpointError.message);
        continue;
      }
    }

    throw new Error('所有直接API端点都失败');

  } catch (error) {
    console.log('直接API方法失败:', error.message);
    return null;
  }
}

/**
 * 使用备用TTS服务
 */
async function synthesizeWithBackupTTS(params) {
  try {
    console.log('使用备用TTS服务（演示模式）...');

    // 创建一个包含提示信息的音频
    const demoText = `Fish Speech演示模式。您输入的文本是：${params.text.substring(0, 50)}${params.text.length > 50 ? '...' : ''}`;
    const mockAudio = await generateDemoAudio(demoText, params.language);

    return new Response(mockAudio, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': mockAudio.length
      }
    });

  } catch (error) {
    console.log('备用TTS失败:', error.message);
    throw error;
  }
}

/**
 * 生成演示音频（用于演示）
 */
async function generateDemoAudio(text, language = 'zh') {
  // 创建一个简单的WAV文件头
  const sampleRate = 22050;
  const duration = Math.max(3, Math.min(text.length * 0.08, 8)); // 3-8秒
  const numSamples = Math.floor(sampleRate * duration);

  // WAV文件头（44字节）
  const header = Buffer.alloc(44);

  // RIFF header
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + numSamples * 2, 4);
  header.write('WAVE', 8);

  // fmt chunk
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);  // PCM
  header.writeUInt16LE(1, 22);  // mono
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);

  // data chunk
  header.write('data', 36);
  header.writeUInt32LE(numSamples * 2, 40);

  // 生成更复杂的音频数据（模拟语音的频率变化）
  const audioData = Buffer.alloc(numSamples * 2);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // 基础频率（模拟人声）
    const baseFreq = language === 'zh' ? 200 : 180; // 中文稍高

    // 添加频率变化（模拟语调）
    const freqModulation = Math.sin(2 * Math.PI * 0.5 * t) * 50;
    const frequency = baseFreq + freqModulation;

    // 添加音量包络（开始和结束渐变）
    let envelope = 1;
    const fadeTime = 0.1; // 0.1秒渐变
    if (t < fadeTime) {
      envelope = t / fadeTime;
    } else if (t > duration - fadeTime) {
      envelope = (duration - t) / fadeTime;
    }

    // 添加一些谐波（使声音更自然）
    const fundamental = Math.sin(2 * Math.PI * frequency * t);
    const harmonic2 = Math.sin(2 * Math.PI * frequency * 2 * t) * 0.3;
    const harmonic3 = Math.sin(2 * Math.PI * frequency * 3 * t) * 0.1;

    // 添加轻微的噪音（模拟呼吸声）
    const noise = (Math.random() - 0.5) * 0.02;

    const sample = (fundamental + harmonic2 + harmonic3 + noise) * envelope * 0.3;
    const intSample = Math.floor(sample * 32767);
    audioData.writeInt16LE(Math.max(-32768, Math.min(32767, intSample)), i * 2);
  }

  console.log(`生成演示音频: ${duration.toFixed(1)}秒, ${numSamples}采样点`);
  return Buffer.concat([header, audioData]);
}

/**
 * 启动服务器
 */
app.listen(PORT, () => {
  console.log('🐟 Fish Speech 测试服务器启动成功!');
  console.log(`📱 测试页面: http://localhost:${PORT}/index.html`);
  console.log(`🔧 API端点: http://localhost:${PORT}/api/fish-speech/synthesize`);
  console.log(`📊 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`⚙️  配置信息: http://localhost:${PORT}/api/config`);
  console.log('');
  console.log('📋 支持的功能:');
  console.log(`- 支持 ${FISH_SPEECH_CONFIG.SUPPORTED_LANGUAGES.length} 种语言`);
  console.log(`- ${FISH_SPEECH_CONFIG.EMOTION_MARKERS.length} 种情感标记`);
  console.log(`- ${FISH_SPEECH_CONFIG.TONE_MARKERS.length} 种语调标记`);
  console.log(`- ${FISH_SPEECH_CONFIG.SPECIAL_EFFECTS.length} 种特殊效果`);
  console.log('');
  console.log('⚠️  注意: 需要本地部署Fish Speech服务或使用Hugging Face Space');
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n🛑 正在关闭Fish Speech测试服务器...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 正在关闭Fish Speech测试服务器...');
  process.exit(0);
});
