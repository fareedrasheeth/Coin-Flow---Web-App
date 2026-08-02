const { contextBridge, ipcRenderer } = require('electron');

// Expose safe Electron APIs to Renderer Process (React/Next.js)
contextBridge.exposeInMainWorld('electronAPI', {
  isElectron: true,
  getVersion: () => ipcRenderer.invoke('app:version'),
  quitApp: () => ipcRenderer.invoke('app:quit'),
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),
  platform: process.platform,
});
