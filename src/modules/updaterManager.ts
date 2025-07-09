import { dialog, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { SettingsManager } from './settingsManager';

export interface UpdateInfo {
  version: string;
  releaseDate: string;
  releaseNotes: string[];
  downloadedFile?: string;
}

export interface UpdateStatus {
  checking: boolean;
  available: boolean;
  downloading: boolean;
  downloaded: boolean;
  error?: string;
  progress?: number;
  updateInfo?: UpdateInfo;
}

export class UpdaterManager {
  private settingsManager: SettingsManager;
  private updateStatus: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
  };
  private checkOnStartupTimer?: NodeJS.Timeout;
  private autoCheckInterval?: NodeJS.Timeout;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.initializeUpdater();
    this.setupEventHandlers();
  }

  private initializeUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // We'll handle download manually
    autoUpdater.autoInstallOnAppQuit = false; // We'll handle install manually

    // Check for updates on startup if enabled
    this.scheduleStartupCheck();
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
      this.updateStatus.updateInfo = {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: [],
      };
      this.sendStatusToRenderer();
      console.log('Update available:', info.version);

      // Auto-download if enabled
      this.handleAutoDownload();
    });

    // Update not available
    autoUpdater.on('update-not-available', info => {
      this.updateStatus.checking = false;
      this.updateStatus.available = false;
      this.sendStatusToRenderer();
      console.log('Update not available. Current version:', info.version);
    });

    // Update download progress
    autoUpdater.on('download-progress', progressObj => {
      this.updateStatus.downloading = true;
      this.updateStatus.progress = progressObj.percent;
      this.sendStatusToRenderer();
      console.log(`Download progress: ${progressObj.percent}%`);
    });

    // Update downloaded
    autoUpdater.on('update-downloaded', info => {
      this.updateStatus.downloading = false;
      this.updateStatus.downloaded = true;
      this.updateStatus.updateInfo = {
        ...this.updateStatus.updateInfo,
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: [],
        downloadedFile: info.downloadedFile,
      };
      this.sendStatusToRenderer();
      console.log('Update downloaded:', info.version);

      // Show install dialog
      this.showInstallDialog();
    });

    // Update error
    autoUpdater.on('error', err => {
      this.updateStatus.checking = false;
      this.updateStatus.downloading = false;
      this.updateStatus.error = err.message;
      this.sendStatusToRenderer();
      console.error('Update error:', err);
    });
  }

  private async scheduleStartupCheck(): Promise<void> {
    const settings = await this.settingsManager.getSettings();

    if (settings.updater?.autoCheckDownloadAndInstall) {
      // Check for updates 10 seconds after startup
      this.checkOnStartupTimer = setTimeout(() => {
        this.checkForUpdates();
      }, 10000);
    }
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

  // Public methods
  async checkForUpdates(): Promise<void> {
    try {
      await autoUpdater.checkForUpdatesAndNotify();
    } catch (error) {
      console.error('Error checking for updates:', error);
      this.updateStatus.error =
        error instanceof Error ? error.message : 'Unknown error';
      this.sendStatusToRenderer();
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
      this.updateStatus.error =
        error instanceof Error ? error.message : 'Unknown error';
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
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
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
    if (this.autoCheckInterval) {
      clearInterval(this.autoCheckInterval);
    }
  }
}
