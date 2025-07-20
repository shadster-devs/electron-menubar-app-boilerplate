import { promises as fs } from 'fs';
import * as path from 'path';
import { app } from 'electron';
import { AppSettings, DEFAULT_SETTINGS } from '../shared/constants';

export class SettingsManager {
  private readonly settingsPath: string;
  private readonly defaultSettings: AppSettings;

  constructor() {
    this.settingsPath = path.join(app.getPath('userData'), 'settings.json');
    this.defaultSettings = { ...DEFAULT_SETTINGS };
  }

  async getSettings(): Promise<AppSettings> {
    try {
      const data = await fs.readFile(this.settingsPath, 'utf8');
      const userSettings = JSON.parse(data);
      return { ...this.defaultSettings, ...userSettings };
    } catch (error) {
      // File doesn't exist or parsing failed - return defaults
      console.error('Failed to get settings:', error);
      return { ...this.defaultSettings };
    }
  }

  async saveSettings(settings: AppSettings): Promise<boolean> {
    try {
      await fs.writeFile(this.settingsPath, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Failed to save settings:', error);
      return false;
    }
  }

  async resetSettings(): Promise<AppSettings> {
    try {
      // Delete existing settings file
      await fs.unlink(this.settingsPath);
    } catch (error) {
      console.error('Failed to reset settings:', error);
      // File doesn't exist - that's fine
    }

    // Return a fresh copy of default settings
    const freshDefaults = { ...this.defaultSettings };

    // Save the defaults to file for consistency
    await this.saveSettings(freshDefaults);

    return freshDefaults;
  }

  async get<K extends keyof AppSettings>(key: K): Promise<AppSettings[K]> {
    const settings = await this.getSettings();
    return settings[key];
  }

  async set<K extends keyof AppSettings>(
      key: K,
      value: AppSettings[K]
  ): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      settings[key] = value;
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('Failed to set setting:', error);
      return false;
    }
  }

  async updateSetting<K extends keyof AppSettings>(
      key: K,
      updater: (current: AppSettings[K]) => AppSettings[K]
  ): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      settings[key] = updater(settings[key]);
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('Failed to update setting:', error);
      return false;
    }
  }

  async updateWindowSize(width: number, height: number): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      settings.window = { width, height };
      return await this.saveSettings(settings);
    } catch (error) {
      console.error('Failed to update window size:', error);
      return false;
    }
  }

  getDefaultSettings(): AppSettings {
    return { ...this.defaultSettings };
  }

  // Synchronous methods for backward compatibility
  getSettingsSync(): AppSettings {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      if (fs.existsSync(this.settingsPath)) {
        const data = fs.readFileSync(this.settingsPath, 'utf8');
        return { ...this.defaultSettings, ...JSON.parse(data) };
      }
    } catch (error) {
      console.error('Error reading settings sync:', error);
    }
    return { ...this.defaultSettings };
  }

  saveSettingsSync(settings: AppSettings): boolean {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('fs');
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving settings sync:', error);
      return false;
    }
  }
}
