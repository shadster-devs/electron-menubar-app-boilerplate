import { app } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { AppSettings } from '../renderer/global';

export class SettingsManager {
  private settingsPath: string;
  private defaultSettings: AppSettings;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.defaultSettings = {
      theme: 'light',
      autoStart: false,
      showNotifications: true,
      showInDock: false,
      shortcuts: {
        toggleWindow: 'CommandOrControl+Shift+Space',
        quit: 'CommandOrControl+Q'
      },
      window: {
        width: 400,
        height: 500
      }
    };
  }

  getSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        return { ...this.defaultSettings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error reading settings:', error);
    }
    return this.defaultSettings;
  }

  saveSettings(settings: AppSettings): boolean {
    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  resetSettings(): AppSettings {
    try {
      if (fs.existsSync(this.settingsPath)) {
        fs.unlinkSync(this.settingsPath);
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
    return this.defaultSettings;
  }

  // Additional methods for the new IPC interface
  get(key: string): any {
    const settings = this.getSettings();
    return (settings as any)[key];
  }

  set(key: string, value: any): boolean {
    try {
      const settings = this.getSettings();
      (settings as any)[key] = value;
      return this.saveSettings(settings);
    } catch (error) {
      console.error('Error setting value:', error);
      return false;
    }
  }

  getAll(): AppSettings {
    return this.getSettings();
  }

  // Convenience method for updating window size
  updateWindowSize(width: number, height: number): boolean {
    try {
      const settings = this.getSettings();
      settings.window.width = width;
      settings.window.height = height;
      return this.saveSettings(settings);
    } catch (error) {
      console.error('Error updating window size:', error);
      return false;
    }
  }
} 