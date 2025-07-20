import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import type { UpdateStatus } from '../shared/constants';
import { SettingsManager } from './settingsManager';

export class UpdaterManager {
  private settingsManager: SettingsManager;
  private updateStatus: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
  };
  private checkOnStartupTimer?: NodeJS.Timeout;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL_24H = 24 * 60 * 60 * 1000; // ms

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.init();
  }

  private async init() {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = false;
    autoUpdater.allowDowngrade = false;

    await this.loadLastCheckTime();
    await this.scheduleStartupCheck();
    this.registerEventHandlers();

    console.log('UpdaterManager initialized');
  }

  private registerEventHandlers() {
    autoUpdater.on('checking-for-update', () => {
      this.updateStatus.checking = true;
      this.updateStatus.error = undefined;
      this.sendStatus();
    });

    autoUpdater.on('update-available', info => {
      this.updateStatus.checking = false;
      this.updateStatus.available = true;
      this.updateStatus.updateInfo = {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: this.parseReleaseNotes(info),
      };
      this.sendStatus();
    });

    autoUpdater.on('update-not-available', info => {
      this.updateStatus.checking = false;
      this.updateStatus.available = false;
      this.saveLastCheckTime();
      this.sendStatus();
    });

    autoUpdater.on('download-progress', progress => {
      this.updateStatus.downloading = true;
      this.updateStatus.progress = Math.round(progress.percent);
      this.sendStatus();
    });

    autoUpdater.on('update-downloaded', async info => {
      this.updateStatus.downloading = false;
      this.updateStatus.downloaded = true;
      this.updateStatus.updateInfo = {
        ...this.updateStatus.updateInfo!,
        version: info.version,
        releaseDate: info.releaseDate,
        downloadedFile: (info as any).downloadedFile,
      };

      // Reset deferred flag since update is now downloaded
      await this.settingsManager.updateSetting('updater', updater => ({
        ...updater,
        updateDeferred: false,
      }));

      this.saveLastCheckTime();
      this.sendStatus();
    });

    autoUpdater.on('error', err => {
      this.updateStatus.checking = false;
      this.updateStatus.downloading = false;
      this.updateStatus.error = err.message;
      this.sendStatus();
    });
  }

  private async loadLastCheckTime() {
    try {
      const settings = await this.settingsManager.getSettings();
      this.lastCheckTime = settings.lastUpdateCheck || 0;
    } catch {
      this.lastCheckTime = 0;
    }
  }

  private async saveLastCheckTime() {
    const settings = await this.settingsManager.getSettings();
    await this.settingsManager.saveSettings({
      ...settings,
      lastUpdateCheck: Date.now(),
    });
    this.lastCheckTime = Date.now();
  }

  private sendStatus() {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('updater:status', this.updateStatus);
    });
  }

  private parseReleaseNotes(info: any): string[] {
    if (typeof info.releaseNotes === 'string') {
      return info.releaseNotes.split('\n').filter((line: string) => line.trim());
    }
    if (Array.isArray(info.releaseNotes)) {
      return info.releaseNotes;
    }
    return [`Version ${info.version} is now available.`];
  }

  private shouldCheck(): boolean {
    return Date.now() - this.lastCheckTime >= this.CHECK_INTERVAL_24H;
  }

  private async scheduleStartupCheck() {
    const settings = await this.settingsManager.getSettings();
    if (!settings.updater?.autoCheckDownloadAndInstall) return;

    if (!this.shouldCheck()) return;

    this.checkOnStartupTimer = setTimeout(() => {
      this.checkForUpdates();
    }, 10_000);
  }

  // 🔹 Public API
  public async checkForUpdates(): Promise<void> {
    if (this.updateStatus.checking) return;
    try {
      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.updateStatus.checking = false;
      this.updateStatus.error =
          error instanceof Error ? error.message : 'Unknown error';
      this.sendStatus();
    }
  }

  public async downloadUpdate(): Promise<void> {
    if (!this.updateStatus.available || this.updateStatus.downloading) return;
    try {
      this.updateStatus.downloading = true;
      this.updateStatus.progress = 0;
      this.sendStatus();
      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.updateStatus.downloading = false;
      this.updateStatus.error =
          error instanceof Error ? error.message : 'Download failed';
      this.sendStatus();
    }
  }

  public async installUpdate(): Promise<void> {
    try {
      await this.settingsManager.updateSetting('updater', updater => ({
        ...updater,
        updateDeferred: false,
      }));
      autoUpdater.autoInstallOnAppQuit = true;
      autoUpdater.quitAndInstall(false, true);
    } catch (error) {
      this.updateStatus.error = 'Failed to install update';
      this.sendStatus();
    }
  }

  public async deferUpdate(): Promise<void> {
    await this.settingsManager.updateSetting('updater', updater => ({
      ...updater,
      updateDeferred: true,
    }));
  }

  public getUpdateStatus(): UpdateStatus {
    return { ...this.updateStatus };
  }

  public async updateSettings(): Promise<void> {
    const settings = await this.settingsManager.getSettings();
    if (this.checkOnStartupTimer) clearTimeout(this.checkOnStartupTimer);
    if (settings.updater?.autoCheckDownloadAndInstall) {
      await this.scheduleStartupCheck();
    }
  }

  public cleanup(): void {
    if (this.checkOnStartupTimer) clearTimeout(this.checkOnStartupTimer);
  }
}
