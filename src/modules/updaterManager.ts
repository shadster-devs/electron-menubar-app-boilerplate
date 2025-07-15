import { dialog, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { SettingsManager } from './settingsManager';
import type { UpdateInfo, UpdateStatus } from '../shared/constants';

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
  private readonly CHECK_INTERVAL_24H = 24 * 60 * 60 * 1000; // 24 hours in ms

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.initializeUpdater();
    this.setupEventHandlers();
  }

  private initializeUpdater(): void {
    try {
      // Configure auto-updater - let electron-updater handle all the complexity
      autoUpdater.autoDownload = false; // Manual download control
      autoUpdater.autoInstallOnAppQuit = false; // Manual install control
      autoUpdater.allowDowngrade = false; // Security: prevent downgrades

      // Load last check time from settings
      this.loadLastCheckTime();

      // Schedule startup check if needed
      this.scheduleStartupCheck();

      console.log('UpdaterManager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize UpdaterManager:', error);
      this.updateStatus.error = 'Failed to initialize updater';
      this.sendStatusToRenderer();
    }
  }

  private async loadLastCheckTime(): Promise<void> {
    try {
      const settings = await this.settingsManager.getSettings();
      this.lastCheckTime = settings.lastUpdateCheck || 0;
    } catch (error) {
      console.error('Error loading last check time:', error);
      this.lastCheckTime = 0;
    }
  }

  private async saveLastCheckTime(): Promise<void> {
    try {
      const settings = await this.settingsManager.getSettings();
      const updatedSettings = {
        ...settings,
        lastUpdateCheck: Date.now(),
      };
      await this.settingsManager.saveSettings(updatedSettings);
      this.lastCheckTime = Date.now();
    } catch (error) {
      console.error('Error saving last check time:', error);
    }
  }

  private shouldCheckForUpdates(): boolean {
    const now = Date.now();
    const timeSinceLastCheck = now - this.lastCheckTime;
    return timeSinceLastCheck >= this.CHECK_INTERVAL_24H;
  }

  private async handleAutoDownload(): Promise<void> {
    const settings = await this.settingsManager.getSettings();
    if (settings.updater?.autoCheckDownloadAndInstall) {
      this.downloadUpdate();
    }
  }

  private sendStatusToRenderer(): void {
    // Send update status to all renderer windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.webContents.send('updater:status', this.updateStatus);
    });
  }

  private showInstallDialog(): void {
    const options = {
      type: 'info' as const,
      buttons: ['Install and Restart', 'Install Later'],
      defaultId: 0,
      title: 'Update Downloaded',
      message: `Version ${this.updateStatus.updateInfo?.version} has been downloaded.`,
      detail: 'Would you like to install it now? The app will restart.',
    };

    dialog.showMessageBox(options).then(result => {
      if (result.response === 0) {
        this.installUpdate();
      }
    });
  }

  private setupEventHandlers(): void {
    // Update checking
    autoUpdater.on('checking-for-update', () => {
      this.updateStatus.checking = true;
      this.updateStatus.error = undefined;
      this.sendStatusToRenderer();
      console.log('Checking for update...');
    });

    // Update available
    autoUpdater.on('update-available', info => {
      this.updateStatus.checking = false;
      this.updateStatus.available = true;

      // Convert electron-updater info to our format
      this.updateStatus.updateInfo = {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: this.parseReleaseNotes(info),
      };
      this.sendStatusToRenderer();

      // Auto-download if enabled
      this.handleAutoDownload();

      console.log('Update available:', info.version);
    });

    // Update not available
    autoUpdater.on('update-not-available', info => {
      this.updateStatus.checking = false;
      this.updateStatus.available = false;
      this.sendStatusToRenderer();
      console.log('Update not available. Current version:', info.version);

      // Save the successful check time
      this.saveLastCheckTime();
    });

    // Update download progress
    autoUpdater.on('download-progress', progressObj => {
      this.updateStatus.downloading = true;
      this.updateStatus.progress = Math.round(progressObj.percent);
      this.sendStatusToRenderer();
      console.log(`Download progress: ${Math.round(progressObj.percent)}%`);
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', info => {
      this.updateStatus.downloading = false;
      this.updateStatus.downloaded = true;
      this.updateStatus.updateInfo = {
        ...this.updateStatus.updateInfo!,
        version: info.version,
        releaseDate: info.releaseDate,
        downloadedFile: (info as any).downloadedFile,
      };
      this.sendStatusToRenderer();
      console.log('Update downloaded:', info.version);

      // Save the successful check time
      this.saveLastCheckTime();

      // Show install dialog
      this.showInstallDialog();
    });

    // Update error - let electron-updater handle retries automatically
    autoUpdater.on('error', err => {
      this.updateStatus.checking = false;
      this.updateStatus.downloading = false;
      this.updateStatus.error = err.message;
      this.sendStatusToRenderer();
      console.error('Update error:', err);
    });
  }

  private parseReleaseNotes(info: any): string[] {
    // Simple release notes parsing - electron-updater usually provides this
    if (info.releaseNotes) {
      if (typeof info.releaseNotes === 'string') {
        return info.releaseNotes.split('\n').filter((line: string) => line.trim().length > 0);
      }
      if (Array.isArray(info.releaseNotes)) {
        return info.releaseNotes;
      }
    }
    
    // Fallback
    return [`Version ${info.version} is now available.`];
  }

  private async scheduleStartupCheck(): Promise<void> {
    const settings = await this.settingsManager.getSettings();

    if (settings.updater?.autoCheckDownloadAndInstall) {
      // Only check if 24 hours have passed since last check
      if (this.shouldCheckForUpdates()) {
        console.log('Scheduling update check - 24h interval met');
        // Check for updates 10 seconds after startup
        this.checkOnStartupTimer = setTimeout(() => {
          this.checkForUpdates();
        }, 10000);
      } else {
        const timeUntilNextCheck = this.CHECK_INTERVAL_24H - (Date.now() - this.lastCheckTime);
        const hoursUntilNext = Math.round(timeUntilNextCheck / (1000 * 60 * 60));
        console.log(`Skipping update check - next check in ${hoursUntilNext} hours`);
      }
    }
  }

  // Public methods
  async checkForUpdates(): Promise<void> {
    console.log('Manual update check triggered');

    // Prevent multiple simultaneous checks
    if (this.updateStatus.checking) {
      console.log('Update check already in progress, skipping...');
      return;
    }

    try {
      console.log('Calling autoUpdater.checkForUpdates()...');
      await autoUpdater.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
      this.updateStatus.checking = false;
      this.updateStatus.error = error instanceof Error ? error.message : 'Unknown error';
      this.sendStatusToRenderer();
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
      this.updateStatus.error = error instanceof Error ? error.message : 'Unknown error';
      this.sendStatusToRenderer();
    }
  }

  installUpdate(): void {
    autoUpdater.quitAndInstall();
  }

  getUpdateStatus(): UpdateStatus {
    return { ...this.updateStatus };
  }

  // Settings-related methods
  async updateSettings(): Promise<void> {
    const settings = await this.settingsManager.getSettings();

    // Clear existing timers
    if (this.checkOnStartupTimer) {
      clearTimeout(this.checkOnStartupTimer);
    }

    // Reschedule if needed
    if (settings.updater?.autoCheckDownloadAndInstall) {
      this.scheduleStartupCheck();
    }
  }

  // Cleanup
  cleanup(): void {
    if (this.checkOnStartupTimer) {
      clearTimeout(this.checkOnStartupTimer);
    }
  }
}
