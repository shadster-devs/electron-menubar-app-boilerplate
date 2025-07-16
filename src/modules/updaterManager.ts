import { dialog, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import type { UpdaterState, UpdateInfo, UpdateTrigger } from '../shared/constants';
import { SettingsManager } from './settingsManager';

export class UpdaterManager {
  private state: UpdaterState = { status: 'idle' };
  private settingsManager: SettingsManager;
  private lastCheckTime: number = 0;
  private checkOnStartupTimer?: NodeJS.Timeout;
  private currentTrigger: UpdateTrigger = 'auto';

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.init();
  }

  private async init() {
    this.lastCheckTime = (await this.settingsManager.getSettings()).lastUpdateCheck || 0;
    this.setupAutoUpdaterEvents();
    this.scheduleStartupCheck();
  }

  private setState(newState: UpdaterState) {
    this.state = newState;
    this.sendStateToRenderer();
  }

  private sendStateToRenderer() {
    BrowserWindow.getAllWindows().forEach(win =>
      win.webContents.send('updater:status', this.state)
    );
  }

  private setupAutoUpdaterEvents() {
    autoUpdater.on('checking-for-update', () => this.setState({ status: 'checking' }));
    autoUpdater.on('update-available', info => {
      const updateInfo: UpdateInfo = {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: this.parseReleaseNotes(info),
      };
      this.setState({ status: 'available', info: updateInfo });
      if (this.currentTrigger === 'auto') this.downloadUpdate();
      else this.promptDownload(updateInfo);
    });
    autoUpdater.on('update-not-available', () => {
      this.setState({ status: 'idle' });
      this.saveLastCheckTime();
    });
    autoUpdater.on('download-progress', progress => {
      if (
        this.state.status === 'downloading' &&
        this.state.info
      ) {
        this.setState({
          status: 'downloading',
          progress: Math.round(progress.percent),
          info: this.state.info,
        });
      }
    });
    autoUpdater.on('update-downloaded', info => {
      const updateInfo: UpdateInfo = {
        version: info.version,
        releaseDate: info.releaseDate,
        releaseNotes: this.parseReleaseNotes(info),
        downloadedFile: (info as any).downloadedFile,
      };
      this.setState({ status: 'downloaded', info: updateInfo });
      this.saveLastCheckTime();
      this.promptInstall(updateInfo);
    });
    autoUpdater.on('error', err => {
      this.setState({ status: 'error', error: err.message });
    });
  }

  private parseReleaseNotes(info: any): string[] {
    if (typeof info.releaseNotes === 'string') {
      return info.releaseNotes.split('\n').filter(Boolean);
    }
    if (Array.isArray(info.releaseNotes)) {
      return info.releaseNotes;
    }
    return [];
  }

  private async scheduleStartupCheck() {
    const settings = await this.settingsManager.getSettings();
    if (settings.updater?.autoCheckDownloadAndInstall && this.shouldCheckForUpdates()) {
      this.checkOnStartupTimer = setTimeout(() => this.checkForUpdates('auto'), 10000);
    }
  }

  private shouldCheckForUpdates(): boolean {
    return Date.now() - this.lastCheckTime > 24 * 60 * 60 * 1000;
  }

  private async saveLastCheckTime() {
    const settings = await this.settingsManager.getSettings();
    await this.settingsManager.saveSettings({ ...settings, lastUpdateCheck: Date.now() });
    this.lastCheckTime = Date.now();
  }

  // --- Public API ---

  getStatus(): UpdaterState {
    return this.state;
  }

  async checkForUpdates(trigger: UpdateTrigger = 'auto') {
    this.currentTrigger = trigger;
    try {
      await autoUpdater.checkForUpdates();
    } catch (err) {
      this.setState({ status: 'error', error: err instanceof Error ? err.message : String(err) });
    }
  }

  downloadUpdate() {
    if (this.state.status === 'available') {
      this.setState({ status: 'downloading', progress: 0, info: this.state.info });
      autoUpdater.downloadUpdate();
    }
  }

  installUpdate() {
    if (this.state.status === 'downloaded') {
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (err) {
        // fallback
        const { app } = require('electron');
        app.relaunch();
        app.exit(0);
      }
    }
  }

  // --- Dialogs (can be overridden for testing) ---

  protected promptDownload(info: UpdateInfo) {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      title: 'Update Available',
      message: `Version ${info.version} is available.`,
      detail: `What's new:\n${info.releaseNotes.slice(0, 3).join('\n')}`,
    }).then(result => {
      if (result.response === 0) this.downloadUpdate();
    });
  }

  protected promptInstall(info: UpdateInfo) {
    dialog.showMessageBox({
      type: 'info',
      buttons: ['Install and Restart', 'Later'],
      defaultId: 0,
      title: 'Update Ready',
      message: `Version ${info.version} has been downloaded.`,
      detail: 'Would you like to install it now? The app will restart.',
    }).then(result => {
      if (result.response === 0) this.installUpdate();
    });}
}

