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

        // 检查和修复响应文本的编码问题
        let cleanResponse = response;
        const encodingIssuePatterns = ['锛', '鍚', '浣', '鎴', '鍙', '甯', '瑙', '鐞', '闂', '鍚', '鍛€', '鏄', '鐨', '鏅', '鸿兘', '鍔╂墜'];
        const hasEncodingIssue = encodingIssuePatterns.some(pattern => response.includes(pattern));

        if (hasEncodingIssue) {
          console.log('[IPCService] Detected encoding issue in response, attempting to fix...');
          console.log('[IPCService] Original response sample:', response.substring(0, 100) + '...');

          try {
            const buffer = Buffer.from(response, 'latin1');
            const fixedResponse = buffer.toString('utf8');

            // 验证修复效果
            const commonChars = ['你', '好', '是', '的', '我', '在', '有', '了', '不', '和', '人', '这', '中', '大', '为'];
            const fixedScore = commonChars.reduce((score, char) => score + (fixedResponse.includes(char) ? 1 : 0), 0);
            const originalScore = commonChars.reduce((score, char) => score + (response.includes(char) ? 1 : 0), 0);

            if (fixedScore > originalScore) {
              cleanResponse = fixedResponse;
              console.log('[IPCService] Encoding fix successful');
              console.log('[IPCService] Fixed response sample:', cleanResponse.substring(0, 100) + '...');
            }
          } catch (encodingError) {
            console.warn('[IPCService] Failed to fix encoding:', encodingError);
          }
        }

        // 如果有TTS服务，尝试合成语音
        let audioUrl = null;
        if (this.ttsService) {
          try {
            console.log('[IPCService] Synthesizing speech for AI response...');
            audioUrl = await this.ttsService.synthesizeText(cleanResponse);
            console.log('[IPCService] Speech synthesis completed:', audioUrl);
          } catch (ttsError) {
            console.warn('[IPCService] TTS synthesis failed:', ttsError.message);
            // TTS失败不影响文本响应
          }
        }

        // 发送响应（包含文本和音频URL）
        event.reply('response', {
          text: cleanResponse,
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

    // Handle window maximize/restore
    ipcMain.on('toggle-maximize-window', () => {
      console.log('[IPCService] Received toggle-maximize-window request');
      this.windowService.toggleMaximizeMainWindow();
    });

    // Handle window always on top
    ipcMain.on('set-always-on-top', (event, alwaysOnTop) => {
      console.log('[IPCService] Received set-always-on-top request:', alwaysOnTop);
      this.windowService.setAlwaysOnTop(alwaysOnTop);
    });

    // Handle window visibility
    ipcMain.on('set-window-visibility', (event, visible) => {
      console.log('[IPCService] Received set-window-visibility request:', visible);
      this.windowService.setWindowVisibility(visible);
    });

    // Handle get application info
    ipcMain.handle('get-app-info', () => {
      return {
        version: process.env.npm_package_version || '1.0.0',
        platform: process.platform,
        arch: process.arch
      };
    });



    // Handle get window state
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

    // Handle get TTS service status
    ipcMain.handle('get-tts-status', () => {
      if (this.ttsService) {
        return this.ttsService.getServiceStatus();
      }
      return {
        isRunning: false,
        error: 'TTS service not available'
      };
    });

    // Handle text-to-speech synthesis
    ipcMain.handle('synthesize-text', async (event, text) => {
      const startTime = Date.now();

      try {
        console.log('[IPCService] Synthesizing text:', text.substring(0, 50) + '...');

        if (!this.ttsService) {
          throw new Error('TTS service not available');
        }

        // Check TTS service status
        const serviceStatus = this.ttsService.getServiceStatus();
        if (!serviceStatus.isRunning) {
          throw new Error('TTS service is not running');
        }

        const audioUrl = await this.ttsService.synthesizeText(text);
        const duration = Date.now() - startTime;

        console.log(`[IPCService] Text synthesis completed in ${duration}ms:`, audioUrl);

        return {
          success: true,
          audioUrl: audioUrl,
          text: text,
          duration: duration
        };
      } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[IPCService] Text synthesis failed after ${duration}ms:`, error);

        // Provide more detailed error information
        let errorMessage = error.message;
        let errorType = 'unknown';

        if (error.name === 'AbortError' || error.message.includes('aborted')) {
          errorType = 'timeout';
          errorMessage = 'Request timeout - TTS service may be overloaded';
        } else if (error.message.includes('ECONNREFUSED')) {
          errorType = 'connection';
          errorMessage = 'Cannot connect to TTS service';
        } else if (error.message.includes('TTS service')) {
          errorType = 'service';
        } else if (error.message.includes('API error')) {
          errorType = 'api';
        }

        return {
          success: false,
          error: errorMessage,
          errorType: errorType,
          text: text,
          duration: duration
        };
      }
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
    ipcMain.removeHandler('get-tts-status');
    ipcMain.removeHandler('get-audio-file');
    ipcMain.removeHandler('synthesize-text');
  }
}
