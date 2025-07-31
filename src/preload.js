const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  onResponse: (callback) => ipcRenderer.on('response', callback),
  onAudioGenerated: (callback) => ipcRenderer.on('audio-generated', callback),
  getAudioFilePath: (relativePath) => ipcRenderer.invoke('get-audio-file-path', relativePath),
  closeWindow: () => ipcRenderer.send('close-window'),
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('move-window', { deltaX, deltaY })
});