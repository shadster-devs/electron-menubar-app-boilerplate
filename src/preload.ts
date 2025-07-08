import { contextBridge, ipcRenderer } from 'electron';
import type { ElectronAPI } from './shared/constants';

// Global type declaration for window.electronAPI
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

// Create the API object with proper error handling
const electronAPI: ElectronAPI = {
  // Settings API
  getSettings: () => ipcRenderer.invoke('settings:getAll'),
  saveSettings: (settings: any) => ipcRenderer.invoke('settings:setAll', settings),
  getSetting: (key: string) => ipcRenderer.invoke('settings:get', key),
  resetSettings: () => ipcRenderer.invoke('settings:reset'),
  
  // Shortcuts API¸
  getShortcuts: () => ipcRenderer.invoke('shortcuts:get'),
  updateShortcut: (key: string, accelerator: string) => 
    ipcRenderer.invoke('shortcuts:update', key, accelerator),
  unregisterShortcuts: () => ipcRenderer.invoke('shortcuts:unregister'),
  
  // App controls
  minimize: () => ipcRenderer.invoke('app:minimize'),
  hide: () => ipcRenderer.invoke('app:hide'),
  close: () => ipcRenderer.invoke('app:close'),
  getPlatform: () => ipcRenderer.invoke('app:getPlatform'),
  
  // Legacy aliases for backward compatibility
  quitApp: () => ipcRenderer.invoke('app:close'),
  hideWindow: () => ipcRenderer.invoke('app:hide'),
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

console.log('Preload script loaded successfully'); 