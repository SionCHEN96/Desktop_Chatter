/**
 * AI Companion 主进程入口
 * 使用模块化架构，将功能分离到不同的服务中
 */

import { app, BrowserWindow } from 'electron';
import { AIService, WindowService, IPCService, MemoryService } from './services/index.js';

// 解决WebGL问题的命令行参数
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

// 服务实例
let memoryService;
let aiService;
let windowService;
let ipcService;

/**
 * 初始化所有服务
 * @returns {Promise<void>}
 */
async function initializeServices() {
  try {
    // 初始化内存服务
    memoryService = new MemoryService();
    await memoryService.initializeMemoryManager();

    // 初始化AI服务
    aiService = new AIService(memoryService.getMemoryManager());

    // 初始化窗口服务
    windowService = new WindowService();

    // 初始化IPC服务
    ipcService = new IPCService(aiService, windowService);

    console.log('[Main] All services initialized successfully');
  } catch (error) {
    console.error('[Main] Failed to initialize services:', error);
  }
}

/**
 * 创建应用窗口
 */

function createWindow() {
  windowService.createMainWindow();
}

/**
 * 应用启动处理
 */
app.whenReady().then(async () => {
  // 初始化所有服务
  await initializeServices();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/**
 * 应用退出处理
 */
app.on('window-all-closed', async () => {
  if (process.platform !== 'darwin') {
    await cleanupServices();
    app.quit();
  }
});

/**
 * 应用退出前清理
 */
app.on('before-quit', async () => {
  console.log('[Main] Application is quitting, cleaning up...');
  await cleanupServices();
});

/**
 * 清理所有服务
 */
async function cleanupServices() {
  try {
    // 清理IPC监听器
    if (ipcService) {
      ipcService.removeAllListeners();
    }

    // 停止内存服务（包括ChromaDB）
    if (memoryService) {
      await memoryService.stopService();
    }

    console.log('[Main] Services cleanup completed');
  } catch (error) {
    console.error('[Main] Error during services cleanup:', error);
  }
}