/**
 * AI Companion 主进程入口
 * 使用模块化架构，将功能分离到不同的服务中
 */

import { app, BrowserWindow } from 'electron';
import { AIService, WindowService, IPCService, MemoryService, TrayService, GPTSoVITSService } from './services/index.js';

// 解决WebGL问题的命令行参数
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

// 服务实例
let memoryService;
let aiService;
let windowService;
let ipcService;
let trayService;
let gptSovitsService;

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

    // 初始化GPT-SoVITS服务
    gptSovitsService = new GPTSoVITSService();

    // 初始化窗口服务
    windowService = new WindowService();

    // 初始化托盘服务
    trayService = new TrayService(windowService);

    // 初始化IPC服务
    ipcService = new IPCService(aiService, windowService, gptSovitsService);

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

  // 创建系统托盘
  trayService.createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

/**
 * 应用退出处理
 * 修改为不在所有窗口关闭时退出，保持托盘运行
 */
app.on('window-all-closed', () => {
  // 不做任何操作，让应用继续运行在托盘中
  console.log('[Main] All windows closed, but app continues running in tray');
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
    // 清理托盘
    if (trayService) {
      trayService.destroy();
    }

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