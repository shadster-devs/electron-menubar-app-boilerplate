import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings API
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:setAll', settings),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  
  // Shortcuts API
  getShortcuts: () => ipcRenderer.invoke('shortcuts:get'),
  updateShortcut: (key: string, accelerator: string) => ipcRenderer.invoke('shortcuts:update', key, accelerator),
  unregisterShortcuts: () => ipcRenderer.invoke('shortcuts:unregister'),
  
  // App controls
  minimize: () => ipcRenderer.invoke('app:minimize'),
  hide: () => ipcRenderer.invoke('app:hide'),
  close: () => ipcRenderer.invoke('app:close'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  
  // Legacy aliases for backward compatibility
  quitApp: () => ipcRenderer.invoke('app:close'),
  hideWindow: () => ipcRenderer.invoke('app:hide'),
}); 