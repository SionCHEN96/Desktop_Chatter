/**
 * VITS语音合成服务
 * 负责调用VITS模型进行文本到语音的转换
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { createLogger } from '../../utils/index.js';

const logger = createLogger('VITSService');

/**
 * VITS服务类
 * 封装VITS模型调用和语音合成相关的所有操作
 */
export class VITSService {
  constructor() {
    /** @type {string} VITS模型配置路径 */
    this.configPath = path.join(process.cwd(), 'public', 'VTS_Models', 'config.json');
    
    /** @type {string} VITS模型权重路径 */
    this.modelPath = path.join(process.cwd(), 'public', 'VTS_Models', 'G_953000.pth');
    
    /** @type {string} Python脚本路径 */
    this.pythonScriptPath = path.join(process.cwd(), 'scripts', 'vits_real_inference.py');
    
    /** @type {string} 输出音频目录 */
    this.outputDir = path.join(process.cwd(), 'public', 'generated_audio');
    
    /** @type {number} 香菱的speaker ID (根据config.json中的speakers列表) */
    this.xianglingSpearerId = this.findXianglingSpearerId();
    
    this.init();
  }

  /**
   * 初始化VITS服务
   */
  init() {
    // 确保输出目录存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
      logger.info('Created output directory:', this.outputDir);
    }

    // 检查必要文件是否存在
    this.validateFiles();
    
    logger.info('VITSService initialized');
    logger.info('Xiangling Speaker ID:', this.xianglingSpearerId);
  }

  /**
   * 查找香菱的speaker ID
   * @returns {number} 香菱的speaker ID
   */
  findXianglingSpearerId() {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      const config = JSON.parse(configData);

      if (config.speakers && Array.isArray(config.speakers)) {
        const xianglingIndex = config.speakers.findIndex(speaker =>
          speaker === '香菱'
        );

        if (xianglingIndex !== -1) {
          logger.info(`Found Xiangling at speaker index: ${xianglingIndex}`);
          return xianglingIndex;
        }
      }

      // 如果没找到香菱，使用已知的香菱ID
      logger.info('Using known Xiangling speaker ID: 98');
      return 98;
    } catch (error) {
      logger.error('Error finding Xiangling speaker ID:', error);
      return 98; // 使用已知的香菱ID
    }
  }

  /**
   * 验证必要文件是否存在
   */
  validateFiles() {
    const requiredFiles = [
      { path: this.configPath, name: 'Config file' },
      { path: this.modelPath, name: 'Model file' }
    ];

    for (const file of requiredFiles) {
      if (!fs.existsSync(file.path)) {
        logger.error(`${file.name} not found:`, file.path);
        throw new Error(`Required file not found: ${file.path}`);
      }
    }

    logger.info('All required files validated successfully');
  }

  /**
   * 生成语音
   * @param {string} text - 要合成的文本
   * @returns {Promise<string>} 生成的音频文件路径
   */
  async generateSpeech(text) {
    try {
      logger.info('Generating speech for text:', text.substring(0, 50) + (text.length > 50 ? '...' : ''));

      // 生成唯一的输出文件名
      const timestamp = Date.now();
      const outputFileName = `xiangling_${timestamp}.wav`;
      const outputPath = path.join(this.outputDir, outputFileName);

      // 调用Python脚本进行语音合成
      await this.runVITSInference(text, outputPath);

      // 验证输出文件是否生成
      if (!fs.existsSync(outputPath)) {
        throw new Error('Generated audio file not found');
      }

      logger.info('Speech generation completed:', outputPath);
      return outputPath;

    } catch (error) {
      logger.error('Failed to generate speech:', error);
      throw error;
    }
  }

  /**
   * 运行VITS推理
   * @param {string} text - 输入文本
   * @param {string} outputPath - 输出音频路径
   * @returns {Promise<void>}
   */
  async runVITSInference(text, outputPath) {
    return new Promise((resolve, reject) => {
      // 构建Python脚本参数
      const args = [
        this.pythonScriptPath,
        '--config', this.configPath,
        '--model', this.modelPath,
        '--text', text,
        '--speaker', this.xianglingSpearerId.toString(),
        '--output', outputPath
      ];

      logger.debug('Running Python script with args:', args);

      // 启动Python进程
      const pythonProcess = spawn('python', args, {
        cwd: process.cwd(),
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      // 收集输出
      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      // 处理进程结束
      pythonProcess.on('close', (code) => {
        if (code === 0) {
          logger.debug('Python script completed successfully');
          logger.debug('Python stdout:', stdout);
          resolve();
        } else {
          logger.error('Python script failed with code:', code);
          logger.error('Python stderr:', stderr);
          reject(new Error(`VITS inference failed with code ${code}: ${stderr}`));
        }
      });

      // 处理进程错误
      pythonProcess.on('error', (error) => {
        logger.error('Failed to start Python process:', error);
        reject(error);
      });

      // 设置超时
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('VITS inference timeout'));
      }, 30000); // 30秒超时
    });
  }

  /**
   * 清理旧的音频文件
   * @param {number} maxAge - 最大文件年龄（毫秒）
   */
  cleanupOldAudioFiles(maxAge = 24 * 60 * 60 * 1000) { // 默认24小时
    try {
      const files = fs.readdirSync(this.outputDir);
      const now = Date.now();

      for (const file of files) {
        const filePath = path.join(this.outputDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          logger.debug('Cleaned up old audio file:', file);
        }
      }
    } catch (error) {
      logger.warn('Failed to cleanup old audio files:', error);
    }
  }
}
