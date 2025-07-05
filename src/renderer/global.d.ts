// Enhanced type definitions for better type safety

export interface AppSettings {
  theme: 'light' | 'dark';
  autoStart: boolean;
  showNotifications: boolean;
  showInDock: boolean;
  shortcuts: {
    toggleWindow: string;
    quit: string;
  };
  window: {
    width: number;
    height: number;
  };
}

export interface ElectronAPI {
  // Settings API
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  getSetting: (key: keyof AppSettings) => Promise<any>;
  
  // Shortcuts API
  getShortcuts: () => Promise<Record<string, string>>;
  updateShortcut: (key: string, accelerator: string) => Promise<boolean>;
  unregisterShortcuts: () => Promise<boolean>;
  
  // App controls
  minimize: () => Promise<void>;
  hide: () => Promise<void>;
  close: () => Promise<void>;
  getPlatform: () => Promise<NodeJS.Platform>;
  
  // Legacy aliases for backward compatibility
  quitApp: () => Promise<void>;
  hideWindow: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {}; 