/**
 * AI Companion 主进程入口
 * 使用模块化架构，将功能分离到不同的服务中
 */

import { app, BrowserWindow } from 'electron';
import { AIService, WindowService, IPCService, MemoryService, TrayService, TTSService, CleanupService, SettingsService } from './services/index.js';

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
let ttsService;
let cleanupService;
let settingsService;

/**
 * 初始化所有服务
 * @returns {Promise<void>}
 */
async function initializeServices() {
  try {
    // 初始化清理服务
    cleanupService = new CleanupService();

    // 初始化设置服务（优先初始化，其他服务可能需要用到）
    settingsService = new SettingsService();
    await settingsService.initialize();
    console.log('[Main] Settings service initialized successfully');

    // 初始化TTS服务（优先启动，因为需要时间）
    ttsService = new TTSService();
    console.log('[Main] Starting TTS service...');
    const ttsStarted = await ttsService.startService();
    if (ttsStarted) {
      console.log('[Main] TTS service started successfully');
    } else {
      console.warn('[Main] TTS service failed to start, continuing without TTS');
    }

    // 初始化内存服务
    memoryService = new MemoryService();
    await memoryService.initializeMemoryManager();

    // 初始化AI服务
    aiService = new AIService(memoryService.getMemoryManager());

    // 初始化窗口服务
    windowService = new WindowService();

    // 初始化托盘服务（传入清理服务和设置服务）
    trayService = new TrayService(windowService, cleanupService, settingsService);
    await trayService.initialize();

    // 初始化IPC服务（传入TTS服务和托盘服务）
    ipcService = new IPCService(aiService, windowService, ttsService, trayService);

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
app.on('before-quit', async (event) => {
  console.log('[Main] Application is about to quit, cleaning up...');
  event.preventDefault(); // 阻止默认退出行为

  // 设置退出超时，防止清理过程卡住
  const exitTimeout = setTimeout(() => {
    console.warn('[Main] Cleanup timeout, forcing exit...');
    app.exit(1);
  }, 15000); // 15秒超时

  try {
    await cleanupServices();
    clearTimeout(exitTimeout);

    // 清理完成后真正退出
    console.log('[Main] Cleanup completed, exiting application...');
    app.exit(0);
  } catch (error) {
    console.error('[Main] Cleanup failed, forcing exit:', error);
    clearTimeout(exitTimeout);
    app.exit(1);
  }
});

/**
 * 处理应用激活（macOS）
 */
app.on('activate', () => {
  // 在macOS上，当点击dock图标并且没有其他窗口打开时，
  // 通常会重新创建一个窗口
  if (BrowserWindow.getAllWindows().length === 0) {
    if (windowService) {
      windowService.createMainWindow();
    }
  }
});

/**
 * 清理所有服务
 */
async function cleanupServices() {
  try {
    console.log('[Main] Starting comprehensive cleanup...');

    if (cleanupService) {
      // 使用专门的清理服务进行完整清理
      await cleanupService.performFullCleanup({
        trayService,
        ipcService,
        ttsService,
        memoryService
      });
    } else {
      // 回退到基本清理
      console.log('[Main] Using fallback cleanup...');

      if (trayService) {
        trayService.destroy();
      }

      if (ipcService) {
        ipcService.removeAllListeners();
      }

      if (ttsService) {
        await ttsService.stopService();
      }

      if (memoryService) {
        await memoryService.stopService();
      }
    }

    console.log('[Main] Services cleanup completed');
  } catch (error) {
    console.error('[Main] Error during services cleanup:', error);

    // 如果正常清理失败，尝试快速清理
    if (cleanupService) {
      try {
        await cleanupService.quickCleanup();
      } catch (quickError) {
        console.error('[Main] Quick cleanup also failed:', quickError);
      }
    }
  }
}