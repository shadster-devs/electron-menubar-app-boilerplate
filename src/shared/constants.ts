// Shared constants that can be used by both main and renderer processes

export interface UpdaterSettings {
  autoCheckDownloadAndInstall: boolean;
}

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string[];
  downloadedFile?: string;
}

export type UpdaterState =
  | { status: 'idle' }
  | { status: 'checking' }
  | { status: 'available'; info: UpdateInfo }
  | { status: 'downloading'; progress: number; info: UpdateInfo }
  | { status: 'downloaded'; info: UpdateInfo }
  | { status: 'error'; error: string };

export interface AppSettings {
  theme: 'light' | 'dark';
  autoStart: boolean;
  showNotifications: boolean;
  showInDock: boolean;
  hideOnBlur: boolean;
  shortcuts: {
    toggleWindow: string;
    quit: string;
  };
  window: {
    width: number;
    height: number;
  };
  updater: UpdaterSettings;
  lastUpdateCheck?: number; // Timestamp of last update check
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'light',
  autoStart: false,
  showNotifications: true,
  showInDock: false,
  hideOnBlur: false,
  shortcuts: {
    toggleWindow: 'CommandOrControl+Shift+Space',
    quit: 'CommandOrControl+Q',
  },
  window: {
    width: 400,
    height: 500,
  },
  updater: {
    autoCheckDownloadAndInstall: true,
  },
  lastUpdateCheck: 0,
};

export interface ElectronAPI {
  // Settings API
  getSettings: () => Promise<AppSettings>;
  saveSettings: (settings: AppSettings) => Promise<boolean>;
  getSetting: (key: string) => Promise<any>;
  resetSettings: () => Promise<AppSettings | null>;

  // Shortcuts API
  getShortcuts: () => Promise<Record<string, string>>;
  updateShortcut: (key: string, accelerator: string) => Promise<boolean>;
  unregisterShortcuts: () => Promise<boolean>;

  // App controls
  minimize: () => Promise<boolean>;
  hide: () => Promise<boolean>;
  close: () => Promise<boolean>;
  getPlatform: () => Promise<string>;

  // Legacy aliases for backward compatibility
  quitApp: () => Promise<boolean>;
  hideWindow: () => Promise<boolean>;

  // Updater API
  checkForUpdates: (
    triggerSource?: UpdateTrigger
  ) => Promise<{ success: boolean; error?: string }>;
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
  installUpdate: () => Promise<{ success: boolean; error?: string }>;
  getUpdateStatus: () => Promise<UpdaterState | null>;
}

export type UpdateTrigger = 'auto' | 'context' | 'settings';
