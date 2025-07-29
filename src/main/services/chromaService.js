/**
 * ChromaDB服务管理器
 * 负责启动、管理和停止ChromaDB服务
 */

import { spawn } from 'child_process';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { createLogger, createError, ErrorType, ErrorSeverity } from '../../utils/index.js';

const logger = createLogger('ChromaService');

export class ChromaService {
  constructor() {
    this.chromaProcess = null;
    this.isRunning = false;
    this.dataPath = join(process.cwd(), 'data', 'chroma');
    this.port = 8000;
    this.host = 'localhost';
  }

  /**
   * 启动ChromaDB服务
   * @returns {Promise<boolean>} 是否成功启动
   */
  async startChromaDB() {
    try {
      // 确保数据目录存在
      this.ensureDataDirectory();

      // 检查是否已经在运行
      if (await this.isChromaDBRunning()) {
        logger.info('ChromaDB is already running');
        this.isRunning = true;
        return true;
      }

      logger.info('Starting ChromaDB service...', {
        dataPath: this.dataPath,
        port: this.port
      });

      // 启动ChromaDB服务
      await this.spawnChromaProcess();

      // 等待服务启动
      const started = await this.waitForChromaDB();

      if (started) {
        this.isRunning = true;
        logger.info('ChromaDB service started successfully');
        return true;
      } else {
        throw createError(
          'ChromaDB failed to start within timeout',
          ErrorType.EXTERNAL_API,
          ErrorSeverity.HIGH
        );
      }
    } catch (error) {
      logger.error('Failed to start ChromaDB service', error);
      return false;
    }
  }

  /**
   * 停止ChromaDB服务
   * @returns {Promise<void>}
   */
  async stopChromaDB() {
    try {
      if (this.chromaProcess) {
        logger.info('Stopping ChromaDB service...');

        // 优雅关闭
        this.chromaProcess.kill('SIGTERM');

        // 等待进程结束
        await new Promise((resolve) => {
          this.chromaProcess.on('exit', () => {
            logger.info('ChromaDB service stopped');
            resolve();
          });

          // 如果5秒后还没结束，强制杀死
          setTimeout(() => {
            if (this.chromaProcess && !this.chromaProcess.killed) {
              this.chromaProcess.kill('SIGKILL');
              logger.warn('ChromaDB service force killed');
            }
            resolve();
          }, 5000);
        });

        this.chromaProcess = null;
        this.isRunning = false;
      }
    } catch (error) {
      logger.error('Error stopping ChromaDB service', error);
    }
  }

  /**
   * 检查ChromaDB是否正在运行
   * @returns {Promise<boolean>}
   */
  async isChromaDBRunning() {
    try {
      // 使用v2 API的健康检查端点
      const response = await fetch(`http://${this.host}:${this.port}/api/v2/heartbeat`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      return response.ok;
    } catch (error) {
      // 尝试根端点作为备用
      try {
        const response = await fetch(`http://${this.host}:${this.port}/`, {
          method: 'GET',
          signal: AbortSignal.timeout(3000)
        });
        return response.ok;
      } catch (fallbackError) {
        return false;
      }
    }
  }

  /**
   * 获取ChromaDB连接配置
   * @returns {Object} 连接配置
   */
  getConnectionConfig() {
    return {
      baseUrl: `http://${this.host}:${this.port}`,
      dataPath: this.dataPath
    };
  }

  /**
   * 确保数据目录存在
   * @private
   */
  ensureDataDirectory() {
    try {
      if (!existsSync(this.dataPath)) {
        mkdirSync(this.dataPath, { recursive: true });
        logger.info('Created ChromaDB data directory', { path: this.dataPath });
      }
    } catch (error) {
      logger.error('Failed to create data directory', error);
      throw createError(
        'Cannot create ChromaDB data directory',
        ErrorType.FILE_SYSTEM,
        ErrorSeverity.HIGH,
        { path: this.dataPath },
        error
      );
    }
  }

  /**
   * 启动ChromaDB进程
   * @private
   * @returns {Promise<void>}
   */
  async spawnChromaProcess() {
    return new Promise((resolve, reject) => {
      try {
        // 使用chroma命令启动ChromaDB
        this.chromaProcess = spawn('chroma', [
          'run',
          '--host', this.host,
          '--port', this.port.toString(),
          '--path', this.dataPath
        ], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false
        });

        // 处理输出
        this.chromaProcess.stdout.on('data', (data) => {
          const output = data.toString().trim();
          if (output) {
            logger.debug('ChromaDB stdout', { output });
          }
        });

        this.chromaProcess.stderr.on('data', (data) => {
          const output = data.toString().trim();
          if (output && !output.includes('WARNING')) {
            logger.warn('ChromaDB stderr', { output });
          }
        });

        this.chromaProcess.on('error', (error) => {
          logger.error('ChromaDB process error', error);
          reject(createError(
            'Failed to spawn ChromaDB process',
            ErrorType.EXTERNAL_API,
            ErrorSeverity.HIGH,
            {},
            error
          ));
        });

        this.chromaProcess.on('exit', (code, signal) => {
          logger.info('ChromaDB process exited', { code, signal });
          this.chromaProcess = null;
          this.isRunning = false;
        });

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * 等待ChromaDB服务启动
   * @private
   * @returns {Promise<boolean>}
   */
  async waitForChromaDB() {
    const maxAttempts = 30; // 30秒超时
    const interval = 1000; // 每秒检查一次

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        if (await this.isChromaDBRunning()) {
          logger.info('ChromaDB service is ready', { attempt });
          return true;
        }

        logger.debug('Waiting for ChromaDB to start...', {
          attempt,
          maxAttempts
        });

        await new Promise(resolve => setTimeout(resolve, interval));
      } catch (error) {
        logger.debug('ChromaDB not ready yet', { attempt, error: error.message });
      }
    }

    return false;
  }

  /**
   * 获取服务状态
   * @returns {Object} 服务状态信息
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      hasProcess: !!this.chromaProcess,
      dataPath: this.dataPath,
      connectionUrl: `http://${this.host}:${this.port}`
    };
  }
}
