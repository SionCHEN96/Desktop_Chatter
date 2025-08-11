/**
 * IPC通信服务
 * 负责主进程与渲染进程之间的通信
 */

import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

/**
 * IPC服务类
 * 封装IPC通信相关的所有操作
 */
export class IPCService {
  constructor(aiService, windowService) {
    this.aiService = aiService;
    this.windowService = windowService;
    this.setupIPCHandlers();
  }

  /**
   * 设置IPC事件处理器
   * @private
   */
  setupIPCHandlers() {
    // 处理消息发送
    ipcMain.on('message', async (event, message) => {
      try {
        console.log('[IPCService] Received message:', message);
        const response = await this.aiService.getAIResponse(message);

        event.reply('response', response);
      } catch (error) {
        console.error('[IPCService] Failed to get AI response:', error);
        event.reply('response', '抱歉，处理您的请求时出现错误。');
      }
    });

    // 处理窗口关闭
    ipcMain.on('close-window', () => {
      console.log('[IPCService] Received close-window request');
      this.windowService.closeMainWindow();
    });

    // 处理窗口移动
    ipcMain.on('move-window', (event, { deltaX, deltaY }) => {
      console.log('[IPCService] 收到窗口移动请求', { deltaX, deltaY });
      this.windowService.moveWindow(deltaX, deltaY);
    });

    // 处理窗口最小化
    ipcMain.on('minimize-window', () => {
      console.log('[IPCService] Received minimize-window request');
      this.windowService.minimizeMainWindow();
    });

    // 处理窗口最大化/还原
    ipcMain.on('toggle-maximize-window', () => {
      console.log('[IPCService] Received toggle-maximize-window request');
      this.windowService.toggleMaximizeMainWindow();
    });

    // 处理窗口置顶
    ipcMain.on('set-always-on-top', (event, alwaysOnTop) => {
      console.log('[IPCService] Received set-always-on-top request:', alwaysOnTop);
      this.windowService.setAlwaysOnTop(alwaysOnTop);
    });

    // 处理窗口可见性
    ipcMain.on('set-window-visibility', (event, visible) => {
      console.log('[IPCService] Received set-window-visibility request:', visible);
      this.windowService.setWindowVisibility(visible);
    });

    // 处理获取应用信息
    ipcMain.handle('get-app-info', () => {
      return {
        version: process.env.npm_package_version || '1.0.0',
        platform: process.platform,
        arch: process.arch
      };
    });



    // 处理获取窗口状态
    ipcMain.handle('get-window-state', () => {
      const mainWindow = this.windowService.getMainWindow();
      if (mainWindow) {
        return {
          isMaximized: mainWindow.isMaximized(),
          isMinimized: mainWindow.isMinimized(),
          isVisible: mainWindow.isVisible(),
          isAlwaysOnTop: mainWindow.isAlwaysOnTop()
        };
      }
      return null;
    });


  }

  /**
   * 移除所有IPC监听器
   */
  removeAllListeners() {
    ipcMain.removeAllListeners('message');
    ipcMain.removeAllListeners('close-window');
    ipcMain.removeAllListeners('move-window');
    ipcMain.removeAllListeners('minimize-window');
    ipcMain.removeAllListeners('toggle-maximize-window');
    ipcMain.removeAllListeners('set-always-on-top');
    ipcMain.removeAllListeners('set-window-visibility');
    ipcMain.removeHandler('get-app-info');
    ipcMain.removeHandler('get-window-state');


  }
}
