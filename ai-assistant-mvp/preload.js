const { contextBridge, ipcRenderer } = require('electron')

// 安全地暴露API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  onReply: (callback) => ipcRenderer.on('reply', (event, ...args) => callback(...args))
})

// 初始化日志
console.log('Preload script initialized')