import { readFileSync } from 'fs';
import { join } from 'path';
import { BrowserWindow, shell } from 'electron';
import type { UpdaterState, UpdateInfo } from '../shared/constants';
import { SettingsManager } from './settingsManager';

// Version comparison utilities
class VersionUtils {
  static parseVersion(version: string): number[] {
    return version
      .replace(/^v/, '')
      .split('.')
      .map(num => parseInt(num, 10) || 0);
  }

  static isNewerVersion(current: string, latest: string): boolean {
    const currentParts = this.parseVersion(current);
    const latestParts = this.parseVersion(latest);

    const maxLength = Math.max(currentParts.length, latestParts.length);

    for (let i = 0; i < maxLength; i++) {
      const currentPart = currentParts[i] || 0;
      const latestPart = latestParts[i] || 0;

      if (latestPart > currentPart) return true;
      if (latestPart < currentPart) return false;
    }

    return false;
  }
}

// GitHub API interface
interface GitHubRelease {
  tag_name: string;
  name: string;
  published_at: string;
  body: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export class UpdaterManager {
  private state: UpdaterState = { status: 'idle' };
  private settingsManager: SettingsManager;
  private lastCheckTime: number = 0;
  private currentVersion: string;
  private repositoryUrl: string = '';

  constructor(settingsManager: SettingsManager) {
    this.settingsManager = settingsManager;
    this.currentVersion = this.getCurrentVersion();
    this.init();
  }

  private getCurrentVersion(): string {
    try {
      const packagePath = join(__dirname, '../../package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));
      return packageJson.version || '0.0.0';
    } catch (error) {
      console.error('Failed to read current version:', error);
      return '0.0.0';
    }
  }

  private async init() {
    this.lastCheckTime =
      (await this.settingsManager.getSettings()).lastUpdateCheck || 0;
    await this.loadRepositoryUrl();
  }

  private async loadRepositoryUrl() {
    try {
      const packagePath = join(__dirname, '../../package.json');
      const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'));

      if (packageJson.repository?.url) {
        // Convert git+https://github.com/user/repo.git to https://github.com/user/repo
        this.repositoryUrl = packageJson.repository.url
          .replace(/^git\+/, '')
          .replace(/\.git$/, '');
      }

      // Update settings with repository URL if not set
      const settings = await this.settingsManager.getSettings();
      if (!settings.updater.repositoryUrl && this.repositoryUrl) {
        await this.settingsManager.saveSettings({
          ...settings,
          updater: {
            ...settings.updater,
            repositoryUrl: this.repositoryUrl,
          },
        });
      }
    } catch (error) {
      console.error('Failed to load repository URL:', error);
    }
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

  private async saveLastCheckTime() {
    const settings = await this.settingsManager.getSettings();
    await this.settingsManager.saveSettings({
      ...settings,
      lastUpdateCheck: Date.now(),
    });
    this.lastCheckTime = Date.now();
  }

  private async fetchLatestRelease(): Promise<GitHubRelease | null> {
    const settings = await this.settingsManager.getSettings();
    const repoUrl = settings.updater.repositoryUrl || this.repositoryUrl;

    if (!repoUrl) {
      throw new Error('Repository URL not configured');
    }

    // Extract owner/repo from GitHub URL
    // eslint-disable-next-line no-useless-escape
    const match = repoUrl.match(/github\.com[\/:]([^\/]+)\/([^\/]+)/);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }

    const [, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/releases/latest`;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Electron-App-Updater',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No releases found for this repository');
        }
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error('Network error: Unable to connect to GitHub');
      }
      throw error;
    }
  }

  private parseReleaseNotes(body: string): string {
    if (!body) return 'No release notes available.';

    // Clean up markdown and limit length
    return (
      body
        .replace(/#{1,6}\s*/g, '') // Remove headers
        .replace(/\*\*/g, '') // Remove bold
        .replace(/\*/g, '') // Remove italics
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove links but keep text
        .trim()
        .slice(0, 500) + (body.length > 500 ? '...' : '')
    );
  }

  // --- Public API ---

  getStatus(): UpdaterState {
    return this.state;
  }

  async checkForUpdates() {
    this.setState({ status: 'checking' });

    try {
      const latestRelease = await this.fetchLatestRelease();

      if (!latestRelease) {
        this.setState({ status: 'idle' });
        await this.saveLastCheckTime();
        return { success: true };
      }

      const latestVersion = latestRelease.tag_name;

      if (VersionUtils.isNewerVersion(this.currentVersion, latestVersion)) {
        // New version available
        const updateInfo: UpdateInfo = {
          version: latestVersion,
          releaseDate: new Date(
            latestRelease.published_at
          ).toLocaleDateString(),
          releaseNotes: this.parseReleaseNotes(latestRelease.body),
          downloadUrl: latestRelease.html_url,
          browserDownloadUrl:
            latestRelease.assets[0]?.browser_download_url ||
            latestRelease.html_url,
        };

        this.setState({ status: 'available', info: updateInfo });
      } else {
        // No update available
        this.setState({ status: 'idle' });
      }

      await this.saveLastCheckTime();
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.setState({ status: 'error', error: errorMessage });
      return { success: false, error: errorMessage };
    }
  }

  async openDownloadUrl(url: string): Promise<boolean> {
    try {
      await shell.openExternal(url);
      return true;
    } catch (error) {
      console.error('Failed to open download URL:', error);
      return false;
    }
  }
}
