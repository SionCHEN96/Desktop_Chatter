const { contextBridge, ipcRenderer } = require('electron');
// 确保正确导入@electron/remote模块
try {
  const remote = require('@electron/remote');

  contextBridge.exposeInMainWorld('electronAPI', {
    sendMessage: (message) => ipcRenderer.send('message', message),
    onResponse: (callback) => ipcRenderer.on('response', callback)
  });

  // 暴露remote模块
  contextBridge.exposeInMainWorld('require', {
    electron: () => remote,
    path: () => require('path')
  });
} catch (error) {
  console.error('加载@electron/remote模块失败:', error);
}