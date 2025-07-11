import { dialog, BrowserWindow, net } from 'electron';
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
  retryCount?: number;
}

export class UpdaterManager {
  private settingsManager: SettingsManager;
  private updateStatus: UpdateStatus = {
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    retryCount: 0,
  };
  private checkOnStartupTimer?: NodeJS.Timeout;
  private autoCheckInterval?: NodeJS.Timeout;
  private currentCheckTimeout?: NodeJS.Timeout;
  private lastCheckTime: number = 0;
  private readonly CHECK_INTERVAL_24H = 24 * 60 * 60 * 1000; // 24 hours in ms
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.initializeUpdater();
    this.setupEventHandlers();
  }

  private initializeUpdater(): void {
    try {
      // Configure auto-updater
      autoUpdater.autoDownload = false; // We'll handle download manually
      autoUpdater.autoInstallOnAppQuit = false; // We'll handle install manually

      // Load last check time from storage
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
      // Use a custom field to store last check time
      this.lastCheckTime = (settings as any).lastUpdateCheck || 0;
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

  private async checkNetworkConnectivity(): Promise<boolean> {
    try {
      const isOnline = net.isOnline();
      if (!isOnline) {
        return false;
      }

      // Try to reach GitHub to ensure we can actually check for updates
      return new Promise(resolve => {
        const request = net.request('https://api.github.com');

        const timeout = setTimeout(() => {
          request.abort();
          resolve(false);
        }, 5000); // 5 second timeout

        request.on('response', () => {
          clearTimeout(timeout);
          resolve(true);
        });
        request.on('error', () => {
          clearTimeout(timeout);
          resolve(false);
        });
        request.end();
      });
    } catch (error) {
      console.error('Network connectivity check failed:', error);
      return false;
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

  private setupEventHandlers(): void {
    // Update checking
    autoUpdater.on('checking-for-update', () => {
      // Clear any existing timeout since we got a response
      if (this.currentCheckTimeout) {
        clearTimeout(this.currentCheckTimeout);
        this.currentCheckTimeout = undefined;
      }

      this.updateStatus.checking = true;
      this.updateStatus.error = undefined;
      this.sendStatusToRenderer();
      console.log('Checking for update...');
    });

    // Update available
    autoUpdater.on('update-available', info => {
      this.updateStatus.checking = false;
      this.updateStatus.available = true;
      this.updateStatus.retryCount = 0; // Reset retry count on success

      // Parse release notes from GitHub
      this.parseReleaseNotes(info).then(releaseNotes => {
        this.updateStatus.updateInfo = {
          version: info.version,
          releaseDate: info.releaseDate,
          releaseNotes,
        };
        this.sendStatusToRenderer();

        // Auto-download if enabled
        this.handleAutoDownload();
      });

      console.log('Update available:', info.version);
    });

    // Update not available
    autoUpdater.on('update-not-available', info => {
      this.updateStatus.checking = false;
      this.updateStatus.available = false;
      this.updateStatus.retryCount = 0; // Reset retry count on success
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
        ...this.updateStatus.updateInfo,
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: this.updateStatus.updateInfo?.releaseNotes || [],
        downloadedFile: info.downloadedFile,
      };
      this.sendStatusToRenderer();
      console.log('Update downloaded:', info.version);

      // Save the successful check time
      this.saveLastCheckTime();

      // Show install dialog
      this.showInstallDialog();
    });

    // Update error
    autoUpdater.on('error', err => {
      // Clear timeout since we got an error response
      if (this.currentCheckTimeout) {
        clearTimeout(this.currentCheckTimeout);
        this.currentCheckTimeout = undefined;
      }

      this.updateStatus.checking = false;
      this.updateStatus.downloading = false;
      this.updateStatus.error = err.message;
      this.sendStatusToRenderer();
      console.error('Update error:', err);

      // Attempt retry if we haven't exceeded max attempts
      this.handleRetry();
    });
  }

  private async parseReleaseNotes(info: any): Promise<string[]> {
    try {
      // Try to fetch release notes from GitHub API
      const response = await fetch(
        `https://api.github.com/repos/shadster-devs/electron-menubar-app-boilerplate/releases/tags/v${info.version}`
      );
      if (response.ok) {
        const release = await response.json();
        if (release.body) {
          // Split by lines and filter out empty lines
          return release.body
            .split('\n')
            .map((line: string) => line.trim())
            .filter((line: string) => line.length > 0);
        }
      }
    } catch (error) {
      console.error('Error fetching release notes:', error);
    }

    // Fallback to basic info
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
        const timeUntilNextCheck =
          this.CHECK_INTERVAL_24H - (Date.now() - this.lastCheckTime);
        const hoursUntilNext = Math.round(
          timeUntilNextCheck / (1000 * 60 * 60)
        );
        console.log(
          `Skipping update check - next check in ${hoursUntilNext} hours`
        );
      }
    }
  }

  private handleRetry(): void {
    if (
      this.updateStatus.retryCount &&
      this.updateStatus.retryCount >= this.MAX_RETRY_ATTEMPTS
    ) {
      console.log('Max retry attempts reached, giving up');
      return;
    }

    const retryCount = (this.updateStatus.retryCount || 0) + 1;
    this.updateStatus.retryCount = retryCount;
    this.updateStatus.error = `Retrying... (${retryCount}/${this.MAX_RETRY_ATTEMPTS})`;
    this.sendStatusToRenderer();

    console.log(
      `Retrying update check in ${this.RETRY_DELAY}ms (attempt ${retryCount})`
    );
    setTimeout(() => {
      this.checkForUpdates();
    }, this.RETRY_DELAY);
  }

  // Public methods
  async checkForUpdates(): Promise<void> {
    console.log('Manual update check triggered');

    // Prevent multiple simultaneous checks
    if (this.updateStatus.checking) {
      console.log('Update check already in progress, skipping...');
      return;
    }

    // Check network connectivity first
    const hasNetwork = await this.checkNetworkConnectivity();
    if (!hasNetwork) {
      this.updateStatus.error = 'No network connection available';
      this.sendStatusToRenderer();
      console.error('Update check failed: No network connection');
      return;
    }

    // Set checking status immediately for UI feedback
    this.updateStatus.checking = true;
    this.updateStatus.error = undefined;
    this.sendStatusToRenderer();

    // Set a timeout to reset checking status in case something goes wrong
    this.currentCheckTimeout = setTimeout(() => {
      if (this.updateStatus.checking) {
        console.log('Update check timed out, resetting status');
        this.updateStatus.checking = false;
        this.updateStatus.error = 'Update check timed out';
        this.sendStatusToRenderer();
      }
    }, 30000); // 30 second timeout

    try {
      console.log('Calling autoUpdater.checkForUpdates()...');
      const result = await autoUpdater.checkForUpdates();
      console.log('Update check result:', result);

      // Clear timeout on successful completion
      if (this.currentCheckTimeout) {
        clearTimeout(this.currentCheckTimeout);
        this.currentCheckTimeout = undefined;
      }
    } catch (error) {
      console.error('Error checking for updates:', error);

      // Clear timeout since we got an error
      if (this.currentCheckTimeout) {
        clearTimeout(this.currentCheckTimeout);
        this.currentCheckTimeout = undefined;
      }

      this.updateStatus.checking = false;
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
