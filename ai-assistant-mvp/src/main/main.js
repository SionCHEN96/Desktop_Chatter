import { app, BrowserWindow, ipcMain, screen } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';
import remoteMain from '@electron/remote/main/index.js';
import { LM_STUDIO_CONFIG, validateUrl } from '../constants/appConstants.js';

// 获取当前模块的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 解决WebGL问题的命令行参数
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-compositing');

let mainWindow;

// 连接本地LM Studio API
async function getAIResponse(message) {
  try {
    if (!validateUrl(LM_STUDIO_CONFIG.BASE_URL)) {
      throw new Error('Invalid API URL configuration');
    }
    
    console.log('[DEBUG] Sending to LM Studio:', {
      message: message,
      config: LM_STUDIO_CONFIG
    });

    const response = await axios.post(
      `${LM_STUDIO_CONFIG.BASE_URL}/v1/chat/completions`,
      {
        model: LM_STUDIO_CONFIG.MODEL,
        messages: [
          { role: 'system', content: LM_STUDIO_CONFIG.SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: LM_STUDIO_CONFIG.TEMPERATURE,
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('[DEBUG] LM Studio response:', response.data);
    let content = response.data.choices[0].message.content;
    
    // 移除<think>标签及其内容
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
    
    // 移除可能残留的空白行
    content = content.replace(/^\s*[\r\n]/gm, '').trim();
    
    return content;
  } catch (error) {
    console.error('[ERROR] AI response error:', error.message);
    if (error.response) {
      console.error('[ERROR] Response data:', error.response.data);
      console.error('[ERROR] Response status:', error.response.status);
    }
    return '抱歉，我无法处理您的请求。请检查LM Studio是否正在运行并正确配置。';
  }
}

function createWindow () {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    width: 350,
    height: 600,
    transparent: true,
    frame: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, '../preload.js')
    }
  });

  mainWindow.loadFile('index.html');

  // 初始化@electron/remote模块
  remoteMain.enable(mainWindow.webContents);

  // 启用开发者工具
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// IPC消息处理
ipcMain.on('message', async (event, message) => {
  console.log('[DEBUG] Received message:', message);
  try {
    const response = await getAIResponse(message);
    console.log('[DEBUG] Sending response:', response);
    event.reply('response', response);
  } catch (error) {
    console.error('[ERROR] Failed to get AI response:', error);
    event.reply('response', '抱歉，处理您的请求时出现错误。');
  }
});

// 添加窗口关闭处理
ipcMain.on('close-window', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});