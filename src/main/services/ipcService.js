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
  constructor(aiService, windowService, ttsService = null) {
    this.aiService = aiService;
    this.windowService = windowService;
    this.ttsService = ttsService;
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

        // 如果有TTS服务，尝试合成语音
        let audioUrl = null;
        if (this.ttsService) {
          try {
            console.log('[IPCService] Synthesizing speech for AI response...');
            audioUrl = await this.ttsService.synthesizeText(response);
            console.log('[IPCService] Speech synthesis completed:', audioUrl);
          } catch (ttsError) {
            console.warn('[IPCService] TTS synthesis failed:', ttsError.message);
            // TTS失败不影响文本响应
          }
        }

        // 发送响应（包含文本和音频URL）
        event.reply('response', {
          text: response,
          audioUrl: audioUrl
        });
      } catch (error) {
        console.error('[IPCService] Failed to get AI response:', error);
        event.reply('response', {
          text: '抱歉，处理您的请求时出现错误。',
          audioUrl: null
        });
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

    // 处理获取TTS服务状态
    ipcMain.handle('get-tts-status', () => {
      if (this.ttsService) {
        return this.ttsService.getServiceStatus();
      }
      return {
        isRunning: false,
        error: 'TTS service not available'
      };
    });

    // 处理音频文件读取
    ipcMain.handle('get-audio-file', async (event, audioUrl) => {
      try {
        console.log('[IPCService] Getting audio file:', audioUrl);

        // 构建完整的URL
        const fullUrl = audioUrl.startsWith('http')
          ? audioUrl
          : `http://localhost:3002${audioUrl}`;

        console.log('[IPCService] Fetching from:', fullUrl);

        const response = await fetch(fullUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch audio: ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        console.log('[IPCService] Audio file loaded, size:', buffer.length);

        return {
          success: true,
          data: buffer.toString('base64'),
          contentType: response.headers.get('content-type') || 'audio/wav',
          size: buffer.length
        };
      } catch (error) {
        console.error('[IPCService] Failed to get audio file:', error);
        return {
          success: false,
          error: error.message
        };
      }
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
