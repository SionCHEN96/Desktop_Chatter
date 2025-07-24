const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  onResponse: (callback) => ipcRenderer.on('response', callback),
  closeWindow: () => ipcRenderer.send('close-window')
});