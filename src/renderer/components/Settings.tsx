import { Palette, Settings2, Keyboard, Download } from 'lucide-react';
import React from 'react';
import type { AppSettings } from '../../shared/constants';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import ProgressBar from './ProgressBar';
import ShortcutRecorder from './ShortcutRecorder';
import './Settings.css';

interface SettingsProps {
  settings: AppSettings | null;
  onSettingsChange: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  // Use centralized update status hook
  const {
    updateStatus,
    isCheckingForUpdates,
    updateProgress,
    currentUpdateInfo,
    checkForUpdates,
    downloadUpdate,
  } = useUpdateStatus();

  // Generate user-friendly status message
  const getUpdateStatusMessage = (): string => {
    if (!updateStatus) return '';

    if (updateStatus.checking) {
      return 'Checking for updates...';
    } else if (updateStatus.downloading) {
      return `Downloading update... ${updateStatus.progress || 0}%`;
    } else if (updateStatus.downloaded) {
      return `Update downloaded: v${updateStatus.updateInfo?.version || 'Unknown'}`;
    } else if (updateStatus.available) {
      return `Update available: v${updateStatus.updateInfo?.version || 'Unknown'}`;
    } else if (updateStatus.error) {
      if (updateStatus.error.includes('No network')) {
        return 'No internet connection';
      } else if (updateStatus.error.includes('timed out')) {
        return 'Update check timed out';
      } else if (updateStatus.error.includes('404')) {
        return 'Update files not found';
      } else {
        return `Error: ${updateStatus.error}`;
      }
    } else if (
      !updateStatus.available &&
      !updateStatus.error &&
      !updateStatus.checking
    ) {
      return 'No updates available';
    }

    return '';
  };

  const handleSettingChange = async (key: keyof AppSettings, value: any) => {
    if (!settings) return;

    const newSettings = { ...settings, [key]: value };
    await onSettingsChange(newSettings);
  };

  const handleShortcutChange = async (shortcutKey: string, value: string) => {
    if (!settings?.shortcuts) return;

    const newShortcuts = { ...settings.shortcuts, [shortcutKey]: value };
    const newSettings = { ...settings, shortcuts: newShortcuts };
    await onSettingsChange(newSettings);
  };

  const handleResetSettings = async () => {
    try {
      const defaultSettings = await window.electronAPI?.resetSettings();
      if (defaultSettings) {
        await onSettingsChange(defaultSettings);
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  };

  const handleCheckForUpdates = async (e?: React.MouseEvent) => {
    // Prevent default behavior and event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    // Don't start new check if already checking
    if (isCheckingForUpdates) {
      console.log('Update check already in progress, skipping...');
      return;
    }

    try {
      console.log('UI: Triggering update check...');
      await checkForUpdates();
      console.log('UI: Update check request sent');
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const handleDownloadUpdate = async () => {
    try {
      await downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  };

  const renderUpdateProgress = () => {
    if (!isCheckingForUpdates && updateProgress === 0) return null;

    return (
      <ProgressBar
        progress={updateProgress}
        showPercentage={true}
        className='compact'
      />
    );
  };

  const renderReleaseNotes = () => {
    if (!currentUpdateInfo?.releaseNotes?.length) return null;

    return (
      <div
        style={{
          marginTop: '8px',
          background: 'var(--background-tertiary)',
          borderRadius: '6px',
          padding: '8px',
          border: '1px solid var(--border-primary)',
          maxHeight: '120px',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 'bold',
            color: 'var(--text-primary)',
            marginBottom: '4px',
          }}
        >
          What&apos;s New in v{currentUpdateInfo.version}:
        </div>
        {currentUpdateInfo.releaseNotes.map((note: string, index: number) => (
          <div
            key={index}
            style={{
              fontSize: '11px',
              color: 'var(--text-secondary)',
              marginBottom: '2px',
              lineHeight: '1.3',
            }}
          >
            • {note}
          </div>
        ))}
      </div>
    );
  };

  if (!settings) {
    return (
      <div className='macos-settings'>
        <div className='settings-content'>
          <div className='loading'>Loading settings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className='macos-settings'>
      <div className='settings-content'>
        {/* Appearance Section */}
        <div className='settings-section'>
          <div className='section-header'>
            <div className='section-icon'>
              <Palette size={16} />
            </div>
            <h2 className='section-title'>Appearance</h2>
          </div>
          <div className='section-content'>
            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Theme</label>
                <p className='setting-description'>Choose how the app looks</p>
              </div>
              <div className='setting-control'>
                <select
                  className='macos-select'
                  value={settings.theme}
                  onChange={e => handleSettingChange('theme', e.target.value)}
                >
                  <option value='light'>Light</option>
                  <option value='dark'>Dark</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* General Section */}
        <div className='settings-section'>
          <div className='section-header'>
            <div className='section-icon'>
              <Settings2 size={16} />
            </div>
            <h2 className='section-title'>General</h2>
          </div>
          <div className='section-content'>
            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Launch at startup</label>
                <p className='setting-description'>
                  Automatically start when you log in
                </p>
              </div>
              <div className='setting-control'>
                <label className='macos-toggle'>
                  <input
                    type='checkbox'
                    checked={settings.autoStart}
                    onChange={e =>
                      handleSettingChange('autoStart', e.target.checked)
                    }
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>

            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Show notifications</label>
                <p className='setting-description'>
                  Display system notifications
                </p>
              </div>
              <div className='setting-control'>
                <label className='macos-toggle'>
                  <input
                    type='checkbox'
                    checked={settings.showNotifications}
                    onChange={e =>
                      handleSettingChange('showNotifications', e.target.checked)
                    }
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>

            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Show in Dock</label>
                <p className='setting-description'>
                  Display app icon in the Dock
                </p>
              </div>
              <div className='setting-control'>
                <label className='macos-toggle'>
                  <input
                    type='checkbox'
                    checked={settings.showInDock}
                    onChange={e =>
                      handleSettingChange('showInDock', e.target.checked)
                    }
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>

            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Hide when focus is lost</label>
                <p className='setting-description'>
                  Automatically hide window when clicking elsewhere
                </p>
              </div>
              <div className='setting-control'>
                <label className='macos-toggle'>
                  <input
                    type='checkbox'
                    checked={settings.hideOnBlur}
                    onChange={e =>
                      handleSettingChange('hideOnBlur', e.target.checked)
                    }
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Updates Section */}
        <div className='settings-section'>
          <div className='section-header'>
            <div className='section-icon'>
              <Download size={16} />
            </div>
            <h2 className='section-title'>Updates</h2>
          </div>
          <div className='section-content'>
            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>
                  Auto check, download and install
                </label>
                <p className='setting-description'>
                  Automatically check for updates and install them
                </p>
              </div>
              <div className='setting-control'>
                <label className='macos-toggle'>
                  <input
                    type='checkbox'
                    checked={settings.updater?.autoCheckDownloadAndInstall}
                    onChange={e =>
                      handleSettingChange('updater', {
                        ...settings.updater,
                        autoCheckDownloadAndInstall: e.target.checked,
                      })
                    }
                  />
                  <span className='toggle-slider'></span>
                </label>
              </div>
            </div>

            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Check for updates</label>
                <p className='setting-description'>
                  Manually check for available updates
                </p>
                {getUpdateStatusMessage() && (
                  <p
                    style={{
                      color: getUpdateStatusMessage().includes('Error')
                        ? 'var(--text-danger, #ff4444)'
                        : 'var(--accent-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    {getUpdateStatusMessage()}
                  </p>
                )}
                {renderUpdateProgress()}
                {renderReleaseNotes()}
              </div>
              <div className='setting-control'>
                <button
                  className='macos-button primary'
                  onClick={handleCheckForUpdates}
                  disabled={isCheckingForUpdates}
                >
                  {isCheckingForUpdates ? 'Checking...' : 'Check Now'}
                </button>
                {!isCheckingForUpdates && updateStatus?.error && (
                  <button
                    className='macos-button secondary'
                    onClick={handleCheckForUpdates}
                    style={{ marginLeft: '8px' }}
                  >
                    Retry
                  </button>
                )}
                {!isCheckingForUpdates && updateStatus?.available && (
                  <button
                    className='macos-button secondary'
                    onClick={handleDownloadUpdate}
                    style={{ marginLeft: '8px' }}
                  >
                    Download
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Section */}
        <div className='settings-section'>
          <div className='section-header'>
            <div className='section-icon'>
              <Keyboard size={16} />
            </div>
            <h2 className='section-title'>Keyboard Shortcuts</h2>
          </div>
          <div className='section-content'>
            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Show/Hide Window</label>
                <p className='setting-description'>
                  Toggle the main window visibility
                </p>
              </div>
              <div className='setting-control'>
                <ShortcutRecorder
                  value={settings.shortcuts?.toggleWindow || ''}
                  onChange={shortcut =>
                    handleShortcutChange('toggleWindow', shortcut)
                  }
                  placeholder='Click to record shortcut'
                />
              </div>
            </div>

            <div className='setting-row'>
              <div className='setting-info'>
                <label className='setting-label'>Quit Application</label>
                <p className='setting-description'>
                  Completely quit the application
                </p>
              </div>
              <div className='setting-control'>
                <ShortcutRecorder
                  value={settings.shortcuts?.quit || ''}
                  onChange={shortcut => handleShortcutChange('quit', shortcut)}
                  placeholder='Click to record shortcut'
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className='settings-actions'>
          <button
            className='macos-button secondary'
            onClick={handleResetSettings}
          >
            Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
