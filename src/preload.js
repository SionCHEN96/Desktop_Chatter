const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  sendMessage: (message) => ipcRenderer.send('message', message),
  onResponse: (callback) => ipcRenderer.on('response', callback),
  closeWindow: () => ipcRenderer.send('close-window'),
  moveWindow: (deltaX, deltaY) => ipcRenderer.send('move-window', { deltaX, deltaY }),
  getTTSStatus: () => ipcRenderer.invoke('get-tts-status'),
  getAudioFile: (audioUrl) => ipcRenderer.invoke('get-audio-file', audioUrl),
  synthesizeText: (text) => ipcRenderer.invoke('synthesize-text', text),

  // Voice setting API
  getVoiceStatus: () => ipcRenderer.invoke('get-voice-status'),
  onVoiceSettingChanged: (callback) => ipcRenderer.on('voice-setting-changed', callback)
});