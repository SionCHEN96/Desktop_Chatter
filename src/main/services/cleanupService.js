/**
 * 清理服务
 * 负责应用退出时的完整清理工作，包括进程和端口清理
 */

import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 清理服务类
 * 封装所有清理相关的操作
 */
export class CleanupService {
  constructor() {
    this.isCleaningUp = false;
    this.cleanupTimeout = 10000; // 10秒清理超时
  }

  /**
   * 执行完整的应用清理
   * @param {Object} services - 所有需要清理的服务
   * @returns {Promise<void>}
   */
  async performFullCleanup(services = {}) {
    if (this.isCleaningUp) {
      console.log('[CleanupService] Cleanup already in progress');
      return;
    }

    this.isCleaningUp = true;
    console.log('[CleanupService] Starting full application cleanup...');

    try {
      // 设置清理超时
      const cleanupPromise = this.executeCleanup(services);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Cleanup timeout')), this.cleanupTimeout);
      });

      await Promise.race([cleanupPromise, timeoutPromise]);
      console.log('[CleanupService] Full cleanup completed successfully');
    } catch (error) {
      console.error('[CleanupService] Cleanup failed:', error);
    } finally {
      this.isCleaningUp = false;
    }
  }

  /**
   * 执行清理步骤
   * @private
   * @param {Object} services - 服务对象
   */
  async executeCleanup(services) {
    const cleanupSteps = [
      () => this.cleanupServices(services),
      () => this.killProcessesByPort(),
      () => this.killProcessesByName(),
      () => this.forceKillRemainingProcesses()
    ];

    for (const step of cleanupSteps) {
      try {
        await step();
      } catch (error) {
        console.warn('[CleanupService] Cleanup step failed:', error.message);
        // 继续执行下一步，不因单个步骤失败而停止
      }
    }
  }

  /**
   * 清理应用服务
   * @private
   * @param {Object} services - 服务对象
   */
  async cleanupServices(services) {
    console.log('[CleanupService] Cleaning up application services...');

    const serviceCleanupPromises = [];

    // 清理托盘服务
    if (services.trayService) {
      serviceCleanupPromises.push(
        Promise.resolve().then(() => {
          services.trayService.destroy();
          console.log('[CleanupService] Tray service cleaned up');
        })
      );
    }

    // 清理IPC服务
    if (services.ipcService) {
      serviceCleanupPromises.push(
        Promise.resolve().then(() => {
          services.ipcService.removeAllListeners();
          console.log('[CleanupService] IPC service cleaned up');
        })
      );
    }

    // 清理TTS服务
    if (services.ttsService) {
      serviceCleanupPromises.push(
        services.ttsService.stopService().then(() => {
          console.log('[CleanupService] TTS service cleaned up');
        })
      );
    }

    // 清理内存服务
    if (services.memoryService) {
      serviceCleanupPromises.push(
        services.memoryService.stopService().then(() => {
          console.log('[CleanupService] Memory service cleaned up');
        })
      );
    }

    // 等待所有服务清理完成
    await Promise.allSettled(serviceCleanupPromises);
  }

  /**
   * 根据端口杀死进程
   * @private
   */
  async killProcessesByPort() {
    console.log('[CleanupService] Killing processes by port...');

    const ports = [3002, 8081, 8080, 8000]; // TTS代理、Fish Speech、ChromaDB等端口

    const portCleanupPromises = ports.map(port => this.killProcessByPort(port));
    await Promise.allSettled(portCleanupPromises);
  }

  /**
   * 杀死占用指定端口的进程
   * @private
   * @param {number} port - 端口号
   */
  async killProcessByPort(port) {
    try {
      console.log(`[CleanupService] Checking port ${port}...`);

      // 查找占用端口的进程
      const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
      
      if (stdout.trim()) {
        const lines = stdout.trim().split('\n');
        const pids = new Set();

        lines.forEach(line => {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 5 && parts[1].includes(`:${port}`)) {
            const pid = parts[4];
            if (pid && pid !== '0') {
              pids.add(pid);
            }
          }
        });

        // 杀死找到的进程
        for (const pid of pids) {
          try {
            await execAsync(`taskkill /f /pid ${pid}`);
            console.log(`[CleanupService] Killed process ${pid} using port ${port}`);
          } catch (killError) {
            console.warn(`[CleanupService] Failed to kill process ${pid}:`, killError.message);
          }
        }
      }
    } catch (error) {
      // 端口未被占用或查询失败，这是正常的
      console.log(`[CleanupService] Port ${port} is free or query failed`);
    }
  }

  /**
   * 根据进程名杀死进程
   * @private
   */
  async killProcessesByName() {
    console.log('[CleanupService] Killing processes by name...');

    const processNames = [
      'python.exe',     // Fish Speech Python进程
      'node.exe',       // Node.js TTS服务器
      'chroma.exe',     // ChromaDB进程
      'uvicorn.exe'     // Fish Speech API服务器
    ];

    const nameCleanupPromises = processNames.map(name => this.killProcessByName(name));
    await Promise.allSettled(nameCleanupPromises);
  }

  /**
   * 杀死指定名称的进程（仅限相关进程）
   * @private
   * @param {string} processName - 进程名称
   */
  async killProcessByName(processName) {
    try {
      // 获取进程列表，过滤出相关进程
      const { stdout } = await execAsync(`tasklist /fi "imagename eq ${processName}" /fo csv`);
      
      if (stdout.includes(processName)) {
        const lines = stdout.split('\n').slice(1); // 跳过标题行
        
        for (const line of lines) {
          if (line.trim() && line.includes(processName)) {
            const parts = line.split(',');
            if (parts.length >= 2) {
              const pid = parts[1].replace(/"/g, '');
              
              // 检查是否是我们的相关进程
              if (await this.isRelatedProcess(pid)) {
                try {
                  await execAsync(`taskkill /f /pid ${pid}`);
                  console.log(`[CleanupService] Killed related ${processName} process ${pid}`);
                } catch (killError) {
                  console.warn(`[CleanupService] Failed to kill ${processName} process ${pid}:`, killError.message);
                }
              }
            }
          }
        }
      }
    } catch (error) {
      console.log(`[CleanupService] No ${processName} processes found or query failed`);
    }
  }

  /**
   * 检查进程是否与我们的应用相关
   * @private
   * @param {string} pid - 进程ID
   * @returns {Promise<boolean>}
   */
  async isRelatedProcess(pid) {
    try {
      // 获取进程的命令行参数
      const { stdout } = await execAsync(`wmic process where processid=${pid} get commandline /value`);
      const commandLine = stdout.toLowerCase();

      // 检查是否包含我们应用的关键词
      const keywords = [
        'fish-speech',
        'fish_speech',
        'desktop_chatter',
        'desktop-chatter',
        'tts',
        'chroma',
        'localhost:3002',
        'localhost:8081',
        'localhost:8080',
        'localhost:8000'
      ];

      return keywords.some(keyword => commandLine.includes(keyword));
    } catch (error) {
      // 如果无法获取命令行信息，为安全起见不杀死进程
      return false;
    }
  }

  /**
   * 强制杀死剩余的相关进程
   * @private
   */
  async forceKillRemainingProcesses() {
    console.log('[CleanupService] Force killing any remaining related processes...');

    try {
      // 最后的清理：杀死任何仍在运行的相关进程
      const commands = [
        'taskkill /f /im "python.exe" /fi "windowtitle eq *fish*" 2>nul',
        'taskkill /f /im "node.exe" /fi "windowtitle eq *tts*" 2>nul',
        'taskkill /f /im "uvicorn.exe" 2>nul'
      ];

      for (const command of commands) {
        try {
          await execAsync(command);
        } catch (error) {
          // 忽略错误，这些命令可能找不到进程
        }
      }
    } catch (error) {
      console.warn('[CleanupService] Force cleanup failed:', error.message);
    }
  }

  /**
   * 快速清理（用于紧急退出）
   */
  async quickCleanup() {
    console.log('[CleanupService] Performing quick cleanup...');
    
    try {
      // 快速杀死关键端口的进程
      const quickCommands = [
        'taskkill /f /fi "PID eq $(netstat -ano | findstr :3002 | awk \'{print $5}\')" 2>nul',
        'taskkill /f /fi "PID eq $(netstat -ano | findstr :8081 | awk \'{print $5}\')" 2>nul',
        'taskkill /f /fi "PID eq $(netstat -ano | findstr :8000 | awk \'{print $5}\')" 2>nul'
      ];

      const quickPromises = quickCommands.map(cmd => 
        execAsync(cmd).catch(() => {}) // 忽略错误
      );

      await Promise.allSettled(quickPromises);
    } catch (error) {
      console.warn('[CleanupService] Quick cleanup failed:', error.message);
    }
  }
}
