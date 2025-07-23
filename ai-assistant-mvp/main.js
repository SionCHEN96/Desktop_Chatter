const { app, BrowserWindow, ipcMain, screen } = require('electron')
const path = require('path')
const axios = require('axios')
const remoteMain = require('@electron/remote/main')

// 解决WebGL问题的命令行参数
app.commandLine.appendSwitch('ignore-gpu-blacklist')
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-gpu-compositing')

// 配置常量
const LM_STUDIO_CONFIG = {
  BASE_URL: 'http://127.0.0.1:1234', // 完整的API基础地址
  MODEL: 'deepseek/deepseek-r1-0528-qwen3-8b',    // 使用的模型名称
  TEMPERATURE: 0.7,       // 生成温度
  SYSTEM_PROMPT: 'You are a helpful AI assistant.', // 系统提示
}

// 简单的URL验证函数
function validateUrl(url) {
  try {
    new URL(url)
    return true
  } catch (e) {
    return false
  }
}

let mainWindow

// 连接本地LM Studio API
async function getAIResponse(message) {
  try {
    if (!validateUrl(LM_STUDIO_CONFIG.BASE_URL)) {
      throw new Error('Invalid API URL configuration')
    }
    
    console.log('[DEBUG] Sending to LM Studio:', {
      message: message,
      config: LM_STUDIO_CONFIG
    })

    const response = await axios.post(
      `${LM_STUDIO_CONFIG.BASE_URL}/v1/chat/completions`,
      {
        model: LM_STUDIO_CONFIG.MODEL,
        messages: [
          { role: 'system', content: LM_STUDIO_CONFIG.SYSTEM_PROMPT },
          { role: 'user', content: message }
        ],
        temperature: LM_STUDIO_CONFIG.TEMPERATURE,
        max_tokens: -1,
        stream: false
      }, 
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    console.log('[DEBUG] LM Studio response:', {
      status: response.status,
      data: response.data
    })

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Invalid response format from LM Studio')
    }

    // 过滤掉<think>标签内容
    const rawResponse = response.data.choices[0].message.content
    const filteredResponse = rawResponse.replace(/<think>.*?<\/think>/gs, '').trim()
    return filteredResponse || "I'm here to help!"
  } catch (error) {
    console.error('[ERROR] LM Studio API call failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    })
    return `Error: ${error.message} - Please check LM Studio console for details`
  }
}

function createWindow() {
  // 创建浏览器窗口
  const primaryDisplay = screen.getPrimaryDisplay()
  const { width, height } = primaryDisplay.workAreaSize
  const windowWidth = 470
  const windowHeight = 700
  
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: width - windowWidth - 20,  // 20px from right edge
    y: height - windowHeight - 160, // 再上移20px (总共上移140px)
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: true,
      webgl: true,
      enablePreferredSizeMode: true,
      webSecurity: false
    }
  })

  // 加载应用界面
  // 在创建窗口后，确保加载文件前等待一小段时间
  mainWindow.loadFile('index.html')
  
  // 添加错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription)
  })

  // 开发工具
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools()
  }
}

// Electron初始化完成后调用
app.whenReady().then(() => {
  // 确保在创建窗口前初始化remote模块
  remoteMain.initialize()
  createWindow()
  // 确保在窗口创建后启用remote
  if (mainWindow && mainWindow.webContents) {
    remoteMain.enable(mainWindow.webContents)
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 所有窗口关闭时退出应用(macOS除外)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 处理来自渲染进程的消息
ipcMain.on('message', async (event, message) => {
  try {
    const reply = await getAIResponse(message)
    mainWindow.webContents.send('response', reply)
  } catch (error) {
    console.error('Error processing message:', error)
    mainWindow.webContents.send('reply', {
      error: true,
      message: 'Sorry, I encountered an error processing your message',
      details: error.message
    })
  }
})