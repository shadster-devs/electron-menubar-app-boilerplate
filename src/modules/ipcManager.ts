import { ipcMain, BrowserWindow, app } from 'electron';
import { SettingsManager } from './settingsManager';
import { ShortcutManager, ShortcutCallbacks } from './shortcutManager';

export class IPCManager {
  private readonly settingsManager: SettingsManager;
  private readonly shortcutManager: ShortcutManager;
  private shortcutCallbacks: ShortcutCallbacks | null = null;
  private readonly quitCallback?: () => void;

  constructor(
    settingsManager: SettingsManager,
    shortcutManager: ShortcutManager,
    quitCallback?: () => void
  ) {
    this.settingsManager = settingsManager;
    this.shortcutManager = shortcutManager;
    this.quitCallback = quitCallback;
    this.initialize();
  }

  setShortcutCallbacks(callbacks: ShortcutCallbacks): void {
    this.shortcutCallbacks = callbacks;
  }

  private initialize(): void {
    this.setupSettingsHandlers();
    this.setupShortcutHandlers();
    this.setupAppHandlers();
    console.log('IPC handlers initialized');
  }

  private setupSettingsHandlers(): void {
    ipcMain.handle('settings:get', async (_, key: string) => {
      try {
        const value = await this.settingsManager.get(key as any);
        return value;
      } catch (error) {
        console.error('Error getting value:', error);
        return null;
      }
    });

    ipcMain.handle('settings:set', async (_, key: string, value: any) => {
      try {
        const success = await this.settingsManager.set(key as any, value);
        
        // Handle side effects for specific settings
        if (success) {
          const settings = await this.settingsManager.getSettings();
          await this.handleSettingsUpdate(settings);
        }
        
        return success;
      } catch (error) {
        console.error('Error setting value:', error);
        return false;
      }
    });

    ipcMain.handle('settings:setAll', async (_, settings: any) => {
      try {
        const success = await this.saveAllSettings(settings);
        
        // Handle side effects
        if (success) {
          await this.handleSettingsUpdate(settings);
        }
        
        return success;
      } catch (error) {
        console.error('Error saving all settings:', error);
        return false;
      }
    });

    ipcMain.handle('settings:getAll', async () => {
      try {
        return await this.settingsManager.getSettings();
      } catch (error) {
        console.error('Error getting all settings:', error);
        return null;
      }
    });

    ipcMain.handle('settings:reset', async () => {
      try {
        const defaultSettings = await this.settingsManager.resetSettings();
        
        // Handle side effects for reset
        await this.handleSettingsUpdate(defaultSettings);
        
        return defaultSettings;
      } catch (error) {
        console.error('Error resetting settings:', error);
        return null;
      }
    });
  }

  private async saveAllSettings(settings: any): Promise<boolean> {
    try {
      // Use the new async methods if available, fallback to sync
      if (typeof this.settingsManager.saveSettings === 'function') {
        const currentSettings = await this.settingsManager.getSettings();
        const updatedSettings = { ...currentSettings, ...settings };
        return await this.settingsManager.saveSettings(updatedSettings);
      } else {
        // Fallback for sync version
        const currentSettings = this.settingsManager.getSettingsSync();
        const updatedSettings = { ...currentSettings, ...settings };
        return this.settingsManager.saveSettingsSync(updatedSettings);
      }
    } catch (error) {
      console.error('Error in saveAllSettings:', error);
      return false;
    }
  }

  private async handleSettingsUpdate(settings: any): Promise<void> {
    // Update shortcuts if they were changed
    if (settings.shortcuts && this.shortcutCallbacks) {
      this.updateShortcuts(settings.shortcuts);
    }

    // Handle dock visibility (macOS only)
    if (process.platform === 'darwin' && typeof settings.showInDock === 'boolean') {
      this.handleDockVisibility(settings.showInDock);
    }
  }

  private setupShortcutHandlers(): void {
    ipcMain.handle('shortcuts:get', async () => {
      try {
        return this.shortcutManager.getShortcuts();
      } catch (error) {
        console.error('Error getting shortcuts:', error);
        return {};
      }
    });

    ipcMain.handle('shortcuts:update', async (_, key: string, accelerator: string) => {
      try {
        return this.shortcutManager.updateShortcut(
          key as any,
          accelerator,
          this.shortcutCallbacks || undefined
        );
      } catch (error) {
        console.error('Error updating shortcut:', error);
        return false;
      }
    });

    ipcMain.handle('shortcuts:unregister', async () => {
      try {
        this.shortcutManager.unregisterShortcuts();
        return true;
      } catch (error) {
        console.error('Error unregistering shortcuts:', error);
        return false;
      }
    });
  }

  private setupAppHandlers(): void {
    ipcMain.handle('app:minimize', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        window?.minimize();
        return true;
      } catch (error) {
        console.error('Error minimizing window:', error);
        return false;
      }
    });

    ipcMain.handle('app:hide', async (event) => {
      try {
        const window = BrowserWindow.fromWebContents(event.sender);
        window?.hide();
        return true;
      } catch (error) {
        console.error('Error hiding window:', error);
        return false;
      }
    });

    ipcMain.handle('app:close', async (event) => {
      try {
        if (this.quitCallback) {
          this.quitCallback();
        } else {
          const window = BrowserWindow.fromWebContents(event.sender);
          window?.close();
        }
        return true;
      } catch (error) {
        console.error('Error closing app:', error);
        return false;
      }
    });

    ipcMain.handle('app:getPlatform', async () => {
      return process.platform;
    });
  }

  private updateShortcuts(shortcuts: any): void {
    if (!this.shortcutCallbacks) {
      console.warn('Shortcut callbacks not set, cannot update shortcuts');
      return;
    }

    try {
      const success = this.shortcutManager.updateAllShortcuts(shortcuts, this.shortcutCallbacks);
      if (success) {
        console.log('Shortcuts updated successfully:', shortcuts);
      } else {
        console.warn('Failed to update some shortcuts');
      }
    } catch (error) {
      console.error('Error updating shortcuts:', error);
    }
  }

  private handleDockVisibility(showInDock: boolean): void {
    if (process.platform !== 'darwin') return;

    try {
      if (showInDock) {
        app.dock.show();
      } else {
        app.dock.hide();
      }
      console.log(`Dock visibility set to: ${showInDock}`);
    } catch (error) {
      console.error('Error setting dock visibility:', error);
    }
  }

  // Utility methods for external use
  addHandler(channel: string, handler: (event: any, ...args: any[]) => any): void {
    try {
      ipcMain.handle(channel, handler);
      console.log(`Custom IPC handler added: ${channel}`);
    } catch (error) {
      console.error(`Error adding handler ${channel}:`, error);
    }
  }

  removeHandler(channel: string): void {
    try {
      ipcMain.removeHandler(channel);
      console.log(`IPC handler removed: ${channel}`);
    } catch (error) {
      console.error(`Error removing handler ${channel}:`, error);
    }
  }

  cleanup(): void {
    try {
      ipcMain.removeAllListeners();
      console.log('All IPC handlers cleaned up');
    } catch (error) {
      console.error('Error during IPC cleanup:', error);
    }
  }
} 