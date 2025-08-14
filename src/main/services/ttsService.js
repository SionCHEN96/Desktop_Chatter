/**
 * TTS (Text-to-Speech) 服务
 * 负责语音合成功能，集成Fish Speech API
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { TTS_CONFIG } from '../../config/config.js';
import { processTextForTTS } from '../../utils/textUtils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * TTS服务类
 * 封装Fish Speech TTS相关的所有操作
 */
export class TTSService {
  constructor() {
    this.isServiceRunning = false;
    this.ttsServerProcess = null;
    this.fishSpeechProcess = null;
    this.healthCheckInterval = null;
    this.referenceAudioBase64 = null;
    
    this.initializeReferenceAudio();
  }

  /**
   * 初始化参考音频
   * @private
   */
  async initializeReferenceAudio() {
    try {
      const projectRoot = path.resolve(__dirname, '../../../');
      const audioPath = path.resolve(projectRoot, TTS_CONFIG.VOICE_CLONING.REFERENCE_AUDIO_PATH);
      
      if (fs.existsSync(audioPath)) {
        const audioBuffer = fs.readFileSync(audioPath);
        this.referenceAudioBase64 = audioBuffer.toString('base64');
        console.log('[TTSService] Reference audio loaded successfully');
      } else {
        console.warn('[TTSService] Reference audio file not found:', audioPath);
      }
    } catch (error) {
      console.error('[TTSService] Failed to load reference audio:', error);
    }
  }

  /**
   * 启动TTS服务
   * @returns {Promise<boolean>} 启动是否成功
   */
  async startService() {
    try {
      console.log('[TTSService] Starting TTS service...');

      // 启动Fish Speech TTS服务器
      await this.startFishSpeechServer();
      
      // 启动TTS代理服务器
      await this.startTTSProxyServer();
      
      // 开始健康检查
      this.startHealthCheck();
      
      this.isServiceRunning = true;
      console.log('[TTSService] TTS service started successfully');
      return true;
    } catch (error) {
      console.error('[TTSService] Failed to start TTS service:', error);
      await this.stopService();
      return false;
    }
  }

  /**
   * 启动Fish Speech服务器
   * @private
   */
  async startFishSpeechServer() {
    return new Promise((resolve, reject) => {
      try {
        const projectRoot = path.resolve(__dirname, '../../../');
        const fishSpeechPath = path.join(projectRoot, 'fish-speech-test');

        // Prefer clean mode startup script
        const cleanScript = path.join(fishSpeechPath, 'start_fish_speech_clean.bat');
        const fallbackScript = path.join(fishSpeechPath, 'start_fish_speech.bat');

        let startScript;
        if (fs.existsSync(cleanScript)) {
          startScript = cleanScript;
          console.log('[TTSService] Using optimized Fish Speech startup...');
        } else if (fs.existsSync(fallbackScript)) {
          startScript = fallbackScript;
          console.log('[TTSService] Using standard Fish Speech startup...');
        } else {
          throw new Error('Fish Speech start script not found');
        }

        console.log('[TTSService] Starting Fish Speech server...');

        this.fishSpeechProcess = spawn('cmd', ['/c', startScript], {
          cwd: fishSpeechPath,
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
          windowsHide: true  // 隐藏命令行窗口
        });

        let startupOutput = '';
        
        this.fishSpeechProcess.stdout.on('data', (data) => {
          const output = data.toString();
          startupOutput += output;

          // 过滤掉进度条和不重要的日志
          if (this.shouldLogOutput(output.trim())) {
            console.log('[Fish Speech]', output.trim());
          }

          // Check if service started successfully
          if (output.includes('Running on') || output.includes('Server started')) {
            setTimeout(() => resolve(), 2000); // Wait 2 seconds to ensure service is fully started
          }
        });

        this.fishSpeechProcess.stderr.on('data', (data) => {
          const output = data.toString().trim();
          // 过滤掉进度条和编码错误
          if (this.shouldLogError(output)) {
            console.error('[Fish Speech Error]', output);
          }
        });

        this.fishSpeechProcess.on('error', (error) => {
          console.error('[TTSService] Fish Speech process error:', error);
          reject(error);
        });

        this.fishSpeechProcess.on('exit', (code) => {
          console.log('[TTSService] Fish Speech process exited with code:', code);
          if (code !== 0 && code !== null) {
            reject(new Error(`Fish Speech process exited with code ${code}`));
          }
        });

        // Set startup timeout
        setTimeout(() => {
          if (this.fishSpeechProcess && !this.fishSpeechProcess.killed) {
            console.log('[TTSService] Fish Speech startup timeout, assuming success');
            resolve();
          }
        }, TTS_CONFIG.SERVICE.START_TIMEOUT);

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 启动TTS代理服务器
   * @private
   */
  async startTTSProxyServer() {
    return new Promise((resolve, reject) => {
      try {
        const projectRoot = path.resolve(__dirname, '../../../');
        const ttsServerPath = path.join(projectRoot, 'fish-speech-test');
        const serverScript = path.join(ttsServerPath, 'server.js');

        if (!fs.existsSync(serverScript)) {
          throw new Error('TTS proxy server script not found');
        }

        console.log('[TTSService] Starting TTS proxy server...');
        
        this.ttsServerProcess = spawn('node', [serverScript], {
          cwd: ttsServerPath,
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        this.ttsServerProcess.stdout.on('data', (data) => {
          const output = data.toString();
          console.log('[TTS Server]', output.trim());
          
          // Check if service started successfully
          if (output.includes('Fish Speech test server started successfully') || output.includes('Fish Speech 测试服务器启动成功')) {
            setTimeout(() => resolve(), 1000); // Wait 1 second to ensure service is fully started
          }
        });

        this.ttsServerProcess.stderr.on('data', (data) => {
          console.error('[TTS Server Error]', data.toString().trim());
        });

        this.ttsServerProcess.on('error', (error) => {
          console.error('[TTSService] TTS server process error:', error);
          reject(error);
        });

        this.ttsServerProcess.on('exit', (code) => {
          console.log('[TTSService] TTS server process exited with code:', code);
          if (code !== 0 && code !== null) {
            reject(new Error(`TTS server process exited with code ${code}`));
          }
        });

        // Set startup timeout
        setTimeout(() => {
          if (this.ttsServerProcess && !this.ttsServerProcess.killed) {
            console.log('[TTSService] TTS server startup timeout, assuming success');
            resolve();
          }
        }, 10000); // TTS server starts quickly, 10 second timeout

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 开始健康检查
   * @private
   */
  startHealthCheck() {
    this.healthCheckInterval = setInterval(async () => {
      try {
        const isHealthy = await this.checkServiceHealth();
        if (!isHealthy) {
          console.warn('[TTSService] Health check failed, service may be down');
        }
      } catch (error) {
        console.error('[TTSService] Health check error:', error);
      }
    }, TTS_CONFIG.SERVICE.HEALTH_CHECK_INTERVAL);
  }

  /**
   * 检查服务健康状态
   * @returns {Promise<boolean>} 服务是否健康
   */
  async checkServiceHealth() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${TTS_CONFIG.API.BASE_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * 停止TTS服务
   */
  async stopService() {
    try {
      console.log('[TTSService] Stopping TTS service...');

      // 停止健康检查
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval);
        this.healthCheckInterval = null;
      }

      // 停止TTS代理服务器
      if (this.ttsServerProcess && !this.ttsServerProcess.killed) {
        this.ttsServerProcess.kill('SIGTERM');
        this.ttsServerProcess = null;
      }

      // 停止Fish Speech服务器
      if (this.fishSpeechProcess && !this.fishSpeechProcess.killed) {
        this.fishSpeechProcess.kill('SIGTERM');
        this.fishSpeechProcess = null;
      }

      this.isServiceRunning = false;
      console.log('[TTSService] TTS service stopped');
    } catch (error) {
      console.error('[TTSService] Error stopping TTS service:', error);
    }
  }

  /**
   * 清理文本内容
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    let cleanedText = text;

    // 修复可能的编码问题
    try {
      // 检查是否是UTF-8编码问题
      if (cleanedText.includes('锛') || cleanedText.includes('鍚') || cleanedText.includes('浣')) {
        console.log('[TTSService] Detected encoding issue, attempting to fix...');
        // 尝试重新编码
        const buffer = Buffer.from(cleanedText, 'latin1');
        cleanedText = buffer.toString('utf8');
        console.log('[TTSService] Text after encoding fix:', cleanedText);
      }
    } catch (encodingError) {
      console.warn('[TTSService] Failed to fix encoding:', encodingError);
    }

    // 过滤表情符号
    if (TTS_CONFIG.TEXT_PROCESSING.FILTER_EMOJIS) {
      cleanedText = cleanedText.replace(TTS_CONFIG.TEXT_PROCESSING.EMOJI_REGEX, '');
    }

    // 过滤其他模式
    TTS_CONFIG.TEXT_PROCESSING.FILTER_PATTERNS.forEach(pattern => {
      cleanedText = cleanedText.replace(pattern, '');
    });

    // 清理多余的空白字符
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();

    // 检查长度限制
    if (cleanedText.length > TTS_CONFIG.TEXT_PROCESSING.MAX_TEXT_LENGTH) {
      cleanedText = cleanedText.substring(0, TTS_CONFIG.TEXT_PROCESSING.MAX_TEXT_LENGTH);
    }

    console.log('[TTSService] Text cleaning result:', {
      original: text.substring(0, 50) + '...',
      cleaned: cleanedText.substring(0, 50) + '...',
      originalLength: text.length,
      cleanedLength: cleanedText.length
    });

    return cleanedText;
  }

  /**
   * 合成语音
   * @param {string} text - 要合成的文本
   * @returns {Promise<string>} 音频文件URL
   */
  async synthesizeText(text) {
    try {
      if (!this.isServiceRunning) {
        throw new Error('TTS service is not running');
      }

      // 清理文本（使用新的文本处理工具）
      const cleanedText = processTextForTTS(text);

      if (cleanedText.length < TTS_CONFIG.TEXT_PROCESSING.MIN_TEXT_LENGTH) {
        throw new Error('Text is too short after cleaning');
      }

      console.log('[TTSService] Synthesizing text:', cleanedText);

      // 使用重试机制进行合成
      return await this.synthesizeWithRetry(cleanedText);

    } catch (error) {
      console.error('[TTSService] Text synthesis failed:', error);
      throw error;
    }
  }

  /**
   * 带重试机制的文本合成
   * @private
   * @param {string} cleanedText - 清理后的文本
   * @returns {Promise<string>} 音频文件URL
   */
  async synthesizeWithRetry(cleanedText) {
    const maxRetries = TTS_CONFIG.API.RETRY_ATTEMPTS || 3;
    const retryDelay = TTS_CONFIG.API.RETRY_DELAY || 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[TTSService] Synthesis attempt ${attempt}/${maxRetries}`);

        const result = await this.performSynthesis(cleanedText);

        console.log('[TTSService] Text synthesis completed:', result.audioUrl);
        return result.audioUrl;

      } catch (error) {
        console.warn(`[TTSService] Attempt ${attempt} failed:`, error.message);

        // 如果是最后一次尝试，抛出错误
        if (attempt === maxRetries) {
          throw error;
        }

        // 检查是否是可重试的错误
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // 等待后重试
        console.log(`[TTSService] Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  /**
   * 执行单次合成请求
   * @private
   * @param {string} cleanedText - 清理后的文本
   * @returns {Promise<Object>} 合成结果
   */
  async performSynthesis(cleanedText) {
    // 构建请求数据
    const requestData = {
      text: cleanedText,
      referenceAudio: this.referenceAudioBase64,
      referenceText: TTS_CONFIG.VOICE_CLONING.REFERENCE_TEXT
    };

    // 创建超时控制器
    const controller = new AbortController();
    const timeout = TTS_CONFIG.API.TIMEOUT || 60000;
    const timeoutId = setTimeout(() => {
      console.warn(`[TTSService] Request timeout after ${timeout}ms`);
      controller.abort();
    }, timeout);

    try {
      const response = await fetch(`${TTS_CONFIG.API.BASE_URL}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`TTS API error: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const result = await response.json();

      if (!result.success || !result.audioUrl) {
        throw new Error('TTS synthesis failed: ' + (result.error || 'Unknown error'));
      }

      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 检查错误是否可重试
   * @private
   * @param {Error} error - 错误对象
   * @returns {boolean} 是否可重试
   */
  isRetryableError(error) {
    const retryableErrors = [
      'AbortError',           // 请求被中止
      'TimeoutError',         // 超时错误
      'NetworkError',         // 网络错误
      'ECONNRESET',          // 连接重置
      'ECONNREFUSED',        // 连接被拒绝
      'ETIMEDOUT',           // 连接超时
      'fetch failed'         // fetch失败
    ];

    const errorMessage = error.message || '';
    const errorName = error.name || '';

    return retryableErrors.some(retryableError =>
      errorMessage.includes(retryableError) ||
      errorName.includes(retryableError)
    );
  }

  /**
   * 检查是否应该记录输出日志
   * @private
   * @param {string} output - 输出内容
   * @returns {boolean} 是否应该记录
   */
  shouldLogOutput(output) {
    // 过滤掉进度条和不重要的信息
    const skipPatterns = [
      /\d+%\|.*\|.*\[.*<.*,.*it\/s\]/,  // 进度条模式
      /锟斤拷/,                          // 编码错误
      /^\s*$/,                          // 空行
      /Loading checkpoint/,             // 加载检查点
      /Downloading/,                    // 下载信息
      /\d+\/\d+.*\[.*\]/,              // 其他进度条格式
      /.*it\/s.*ETA/,                  // ETA信息
      /tqdm/i,                         // tqdm相关
      /progress/i                      // 进度相关
    ];

    return !skipPatterns.some(pattern => pattern.test(output));
  }

  /**
   * 检查是否应该记录错误日志
   * @private
   * @param {string} output - 错误输出内容
   * @returns {boolean} 是否应该记录
   */
  shouldLogError(output) {
    // 过滤掉进度条错误和编码问题
    const skipPatterns = [
      /\d+%\|.*\|.*\[.*<.*,.*it\/s\]/,  // 进度条模式
      /锟斤拷/,                          // 编码错误
      /^\s*$/,                          // 空行
      /UserWarning.*progress/i,         // 进度相关警告
      /tqdm.*warning/i,                 // tqdm警告
      /FutureWarning.*progress/i        // 未来警告
    ];

    return !skipPatterns.some(pattern => pattern.test(output));
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态信息
   */
  getServiceStatus() {
    return {
      isRunning: this.isServiceRunning,
      hasFishSpeechProcess: !!this.fishSpeechProcess && !this.fishSpeechProcess.killed,
      hasTTSServerProcess: !!this.ttsServerProcess && !this.ttsServerProcess.killed,
      hasReferenceAudio: !!this.referenceAudioBase64,
      config: {
        apiUrl: TTS_CONFIG.API.BASE_URL,
        fishSpeechUrl: TTS_CONFIG.API.FISH_SPEECH_URL,
        referenceText: TTS_CONFIG.VOICE_CLONING.REFERENCE_TEXT
      }
    };
  }
}
