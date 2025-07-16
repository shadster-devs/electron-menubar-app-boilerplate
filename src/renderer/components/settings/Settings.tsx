import { Palette, Settings2, Keyboard, Download } from 'lucide-react';
import React from 'react';
import type { AppSettings } from '../../../shared/constants';
import { useUpdateStatus } from '../../hooks/useUpdateStatus';
import ShortcutRecorder from './ShortcutRecorder';
import './Settings.css';

interface SettingsProps {
  settings: AppSettings | null;
  onSettingsChange: (settings: AppSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  // Use enhanced updater hook
  const {
    updaterState,
    isChecking,
    hasError,
    isUpdateAvailable,
    error,
    updateInfo,
    checkForUpdates,
    openDownloadUrl,
  } = useUpdateStatus();

  // Generate user-friendly status message
  const getUpdateStatusMessage = (): string => {
    if (!updaterState) return '';
    switch (updaterState.status) {
      case 'checking':
        return 'Checking for updates...';
      case 'available':
        return `New version ${updateInfo?.version} is available!`;
      case 'error':
        return `Error: ${error}`;
      case 'idle':
        return 'You have the latest version';
      default:
        return '';
    }
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
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isChecking) return;
    await checkForUpdates();
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
                <label className='setting-label'>Auto check on startup</label>
                <p className='setting-description'>
                  Automatically check for updates when the app starts
                </p>
              </div>
              <div className='setting-control'>
                <label className='macos-toggle'>
                  <input
                    type='checkbox'
                    checked={settings.updater?.autoCheckOnStartup}
                    onChange={e =>
                      handleSettingChange('updater', {
                        ...settings.updater,
                        autoCheckOnStartup: e.target.checked,
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
                      color: hasError
                        ? 'var(--text-danger, #ff4444)'
                        : isUpdateAvailable
                          ? 'var(--accent-success, #00aa00)'
                          : 'var(--accent-primary)',
                      fontSize: '12px',
                      marginTop: '4px',
                      fontWeight: 'bold',
                    }}
                  >
                    {getUpdateStatusMessage()}
                  </p>
                )}
                {isUpdateAvailable && updateInfo && (
                  <div
                    style={{
                      marginTop: '8px',
                      padding: '8px',
                      background: 'var(--background-tertiary)',
                      borderRadius: '6px',
                      border: '1px solid var(--border-primary)',
                      fontSize: '11px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                      Release Notes:
                    </div>
                    <div
                      style={{
                        color: 'var(--text-secondary)',
                        lineHeight: '1.4',
                      }}
                    >
                      {updateInfo.releaseNotes}
                    </div>
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '10px',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      Released: {updateInfo.releaseDate}
                    </div>
                  </div>
                )}
              </div>
              <div className='setting-control'>
                <div
                  style={{
                    display: 'flex',
                    gap: '8px',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                  }}
                >
                  <button
                    className='macos-button primary'
                    onClick={handleCheckForUpdates}
                    disabled={isChecking}
                  >
                    {isChecking ? 'Checking...' : 'Check Now'}
                  </button>
                  {isUpdateAvailable && updateInfo && (
                    <button
                      className='macos-button success'
                      onClick={() => openDownloadUrl(updateInfo.downloadUrl)}
                      style={{ fontSize: '12px' }}
                    >
                      Download Update
                    </button>
                  )}
                </div>
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
