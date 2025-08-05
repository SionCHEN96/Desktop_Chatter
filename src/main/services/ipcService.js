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
  constructor(aiService, windowService, gptSovitsService = null) {
    this.aiService = aiService;
    this.windowService = windowService;
    this.gptSovitsService = gptSovitsService;
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

    // GPT-SoVITS相关处理器
    if (this.gptSovitsService) {
      // 处理语音合成请求
      ipcMain.handle('gpt-sovits-synthesize', async (event, { text, options = {} }) => {
        try {
          console.log('[IPCService] GPT-SoVITS synthesis request:', { text: text.substring(0, 50) + '...', options });
          const audioBuffer = await this.gptSovitsService.synthesize(text, options);
          return {
            success: true,
            audioBuffer: Array.from(audioBuffer)
          };
        } catch (error) {
          console.error('[IPCService] GPT-SoVITS synthesis failed:', error);
          return {
            success: false,
            error: error.message
          };
        }
      });

      // 处理角色语音合成请求
      ipcMain.handle('gpt-sovits-synthesize-character', async (event, { text, character, options = {} }) => {
        try {
          console.log('[IPCService] GPT-SoVITS character synthesis request:', { text: text.substring(0, 50) + '...', character, options });
          const audioBuffer = await this.gptSovitsService.synthesizeWithCharacter(text, character, options);
          return {
            success: true,
            audioBuffer: Array.from(audioBuffer)
          };
        } catch (error) {
          console.error('[IPCService] GPT-SoVITS character synthesis failed:', error);
          return {
            success: false,
            error: error.message
          };
        }
      });

      // 处理服务健康检查
      ipcMain.handle('gpt-sovits-health', async () => {
        try {
          const isHealthy = await this.gptSovitsService.checkServiceHealth();
          return {
            success: true,
            healthy: isHealthy,
            serviceInfo: this.gptSovitsService.getServiceInfo()
          };
        } catch (error) {
          console.error('[IPCService] GPT-SoVITS health check failed:', error);
          return {
            success: false,
            healthy: false,
            error: error.message
          };
        }
      });

      // 处理获取可用角色
      ipcMain.handle('gpt-sovits-characters', () => {
        try {
          const characters = this.gptSovitsService.getAvailableCharacters();
          return {
            success: true,
            characters
          };
        } catch (error) {
          console.error('[IPCService] Failed to get GPT-SoVITS characters:', error);
          return {
            success: false,
            error: error.message
          };
        }
      });
    }
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

    // 移除GPT-SoVITS相关处理器
    if (this.gptSovitsService) {
      ipcMain.removeHandler('gpt-sovits-synthesize');
      ipcMain.removeHandler('gpt-sovits-synthesize-character');
      ipcMain.removeHandler('gpt-sovits-health');
      ipcMain.removeHandler('gpt-sovits-characters');
    }
  }
}
