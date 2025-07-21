import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { UpdateStatus } from '../shared/constants';
import type { SettingsManager } from './settingsManager';

export class UpdaterManager {
  private settingsManager: SettingsManager;
  private updateStatus: UpdateStatus;
  private updateCheckInProgress: boolean = false;
  private downloadInProgress: boolean = false;
  private lastCheckTime: number = 0;
  private updateCheckInterval: NodeJS.Timeout | null = null;

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.updateStatus = {
      checking: false,
      available: false,
      downloading: false,
      downloaded: false,
    };

    this.setupAutoUpdater();
    this.setupPeriodicCheck();
  }

  private setupAutoUpdater(): void {
    // Configure auto-updater
    autoUpdater.autoDownload = false; // We control download manually
    autoUpdater.autoInstallOnAppQuit = true;

    // Handle check for updates result
    autoUpdater.on('checking-for-update', () => {
      console.log('Checking for update...');
      this.updateStatus = {
        ...this.updateStatus,
        checking: true,
        error: undefined,
      };
      this.emitStatusUpdate();
    });

    autoUpdater.on('update-available', info => {
      console.log('Update available:', info);
      this.updateCheckInProgress = false;
      this.updateStatus = {
        ...this.updateStatus,
        checking: false,
        available: true,
        updateInfo: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: Array.isArray(info.releaseNotes)
            ? info.releaseNotes.map(note =>
                typeof note === 'string' ? note : note.note || ''
              )
            : [info.releaseNotes || ''],
        },
      };
      this.emitStatusUpdate();

      // Auto-download if enabled
      const settings = this.settingsManager.getSettingsSync();
      if (settings.updater?.autoCheckDownloadAndInstall) {
        this.downloadUpdate();
      }
    });

    autoUpdater.on('update-not-available', info => {
      console.log('Update not available:', info);
      this.updateCheckInProgress = false;
      this.updateStatus = {
        ...this.updateStatus,
        checking: false,
        available: false,
        error: undefined,
      };
      this.emitStatusUpdate();
    });

    autoUpdater.on('error', err => {
      console.error('Auto-updater error:', err);
      this.updateCheckInProgress = false;
      this.downloadInProgress = false;
      this.updateStatus = {
        ...this.updateStatus,
        checking: false,
        downloading: false,
        error: err.message || 'Unknown error occurred',
      };
      this.emitStatusUpdate();
    });

    autoUpdater.on('download-progress', progressObj => {
      console.log(`Download progress: ${progressObj.percent}%`);
      this.updateStatus = {
        ...this.updateStatus,
        downloading: true,
        progress: Math.round(progressObj.percent),
      };
      this.emitStatusUpdate();
    });

    autoUpdater.on('update-downloaded', info => {
      console.log('Update downloaded:', info);
      this.downloadInProgress = false;
      this.updateStatus = {
        ...this.updateStatus,
        downloading: false,
        downloaded: true,
        progress: 100,
        updateInfo: {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes: Array.isArray(info.releaseNotes)
            ? info.releaseNotes.map(note =>
                typeof note === 'string' ? note : note.note || ''
              )
            : [info.releaseNotes || ''],
          downloadedFile: info.downloadedFile,
        },
      };
      this.emitStatusUpdate();

      // Auto-install if enabled and not deferred
      const settings = this.settingsManager.getSettingsSync();
      if (
        settings.updater?.autoCheckDownloadAndInstall &&
        !settings.updater?.updateDeferred
      ) {
        // Wait a bit before auto-installing to let user see the notification
        setTimeout(() => {
          this.installUpdate();
        }, 5000);
      }
    });
  }

  private setupPeriodicCheck(): void {
    // Check for updates periodically if auto-update is enabled
    const checkInterval = 1000 * 60 * 60 * 4; // Every 4 hours

    this.updateCheckInterval = setInterval(() => {
      const settings = this.settingsManager.getSettingsSync();
      if (settings.updater?.autoCheckDownloadAndInstall) {
        this.checkForUpdates(true); // Silent check
      }
    }, checkInterval);

    // Initial check on startup if enabled
    setTimeout(() => {
      const settings = this.settingsManager.getSettingsSync();
      if (settings.updater?.autoCheckDownloadAndInstall) {
        this.checkForUpdates(true); // Silent startup check
      }
    }, 10000); // Wait 10 seconds after app start
  }

  async checkForUpdates(silent: boolean = false): Promise<void> {
    if (this.updateCheckInProgress) {
      console.log('Update check already in progress');
      return;
    }

    // Rate limiting: don't check more than once every 5 minutes
    const now = Date.now();
    if (now - this.lastCheckTime < 5 * 60 * 1000) {
      console.log('Rate limiting: too soon since last check');
      if (!silent) {
        this.updateStatus = {
          ...this.updateStatus,
          error: 'Please wait before checking again',
        };
        this.emitStatusUpdate();
      }
      return;
    }

    try {
      this.updateCheckInProgress = true;
      this.lastCheckTime = now;

      // Update last check time in settings
      await this.settingsManager.updateSetting('lastUpdateCheck', () => now);

      await autoUpdater.checkForUpdates();
    } catch (error) {
      this.updateCheckInProgress = false;
      console.error('Error checking for updates:', error);

      this.updateStatus = {
        ...this.updateStatus,
        checking: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to check for updates',
      };
      this.emitStatusUpdate();
      throw error;
    }
  }

  async downloadUpdate(): Promise<void> {
    if (this.downloadInProgress) {
      console.log('Download already in progress');
      return;
    }

    if (!this.updateStatus.available) {
      throw new Error('No update available to download');
    }

    try {
      this.downloadInProgress = true;
      this.updateStatus = {
        ...this.updateStatus,
        downloading: true,
        progress: 0,
        error: undefined,
      };
      this.emitStatusUpdate();

      await autoUpdater.downloadUpdate();
    } catch (error) {
      this.downloadInProgress = false;
      console.error('Error downloading update:', error);

      this.updateStatus = {
        ...this.updateStatus,
        downloading: false,
        error:
          error instanceof Error ? error.message : 'Failed to download update',
      };
      this.emitStatusUpdate();
      throw error;
    }
  }

  installUpdate(): void {
    if (!this.updateStatus.downloaded) {
      throw new Error('No update downloaded to install');
    }

    try {
      console.log('Installing update and restarting...');
      autoUpdater.quitAndInstall(true, true);
    } catch (error) {
      console.error('Error installing update:', error);
      this.updateStatus = {
        ...this.updateStatus,
        error:
          error instanceof Error ? error.message : 'Failed to install update',
      };
      this.emitStatusUpdate();
      throw error;
    }
  }

  async deferUpdate(): Promise<void> {
    try {
      // Mark update as deferred in settings
      await this.settingsManager.updateSetting('updater', current => ({
        ...current,
        updateDeferred: true,
      }));

      console.log('Update deferred by user');
    } catch (error) {
      console.error('Error deferring update:', error);
      throw error;
    }
  }

  getUpdateStatus(): UpdateStatus {
    return { ...this.updateStatus };
  }

  async updateSettings(): Promise<void> {
    // This method is called when settings change
    // Reset defer status when auto-update settings change
    const settings = await this.settingsManager.getSettings();

    if (settings.updater?.autoCheckDownloadAndInstall) {
      // Re-enable auto-updates, clear deferred status
      await this.settingsManager.updateSetting('updater', current => ({
        ...current,
        updateDeferred: false,
      }));
    }
  }

  private emitStatusUpdate(): void {
    // Send status update to all renderer processes
    const windows = BrowserWindow.getAllWindows();
    windows.forEach(window => {
      window.webContents.send('updater:status', this.updateStatus);
    });
  }

  cleanup(): void {
    if (this.updateCheckInterval) {
      clearInterval(this.updateCheckInterval);
      this.updateCheckInterval = null;
    }

    // Remove all listeners
    autoUpdater.removeAllListeners();
  }
}
