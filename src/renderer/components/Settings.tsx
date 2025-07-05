import React, { useState, useEffect } from 'react';
import { Palette, Settings2, Keyboard } from 'lucide-react';
import ShortcutRecorder from './ShortcutRecorder';
import './Settings.css';

interface SettingsProps {
  settings: any;
  onSettingsChange: (settings: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSettingsChange }) => {
  const [localSettings, setLocalSettings] = useState(settings || {
    theme: 'light',
    autoStart: false,
    showNotifications: true,
    showInDock: false,
    shortcuts: {
      toggleWindow: 'CommandOrControl+Shift+Space',
      quit: 'CommandOrControl+Q'
    }
  });

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    }
  }, [settings]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...localSettings, [key]: value };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleShortcutChange = async (shortcutKey: string, value: string) => {
    const newSettings = {
      ...localSettings,
      shortcuts: {
        ...localSettings.shortcuts,
        [shortcutKey]: value
      }
    };
    setLocalSettings(newSettings);
    onSettingsChange(newSettings);
    
    // Immediately save shortcuts so they take effect right away
    try {
      // @ts-ignore - electron ipc will be available in electron context
      await window.electronAPI?.saveSettings(newSettings);
      console.log('Shortcut updated and saved:', shortcutKey, value);
    } catch (error) {
      console.error('Error saving shortcut:', error);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // @ts-ignore - electron ipc will be available in electron context
      await window.electronAPI?.saveSettings(localSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleResetSettings = () => {
    const defaultSettings = {
      theme: 'light',
      autoStart: false,
      showNotifications: true,
      showInDock: false,
      shortcuts: {
        toggleWindow: 'CommandOrControl+Shift+Space',
        quit: 'CommandOrControl+Q'
      }
    };
    setLocalSettings(defaultSettings);
    onSettingsChange(defaultSettings);
  };

  return (
    <div className="macos-settings">
      <div className="settings-header">
        <h1 className="settings-title">Preferences</h1>
      </div>
      
      <div className="settings-content">
        {/* Appearance Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Palette size={16} />
            </div>
            <h2 className="section-title">Appearance</h2>
          </div>
          <div className="section-content">
            <div className="setting-row">
              <div className="setting-info">
                <label className="setting-label">Theme</label>
                <p className="setting-description">Choose how the app looks</p>
              </div>
              <div className="setting-control">
                <select
                  className="macos-select"
                  value={localSettings.theme}
                  onChange={(e) => handleSettingChange('theme', e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* General Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Settings2 size={16} />
            </div>
            <h2 className="section-title">General</h2>
          </div>
          <div className="section-content">
            <div className="setting-row">
              <div className="setting-info">
                <label className="setting-label">Launch at startup</label>
                <p className="setting-description">Automatically start when you log in</p>
              </div>
              <div className="setting-control">
                <label className="macos-toggle">
                  <input
                    type="checkbox"
                    checked={localSettings.autoStart}
                    onChange={(e) => handleSettingChange('autoStart', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-info">
                <label className="setting-label">Show notifications</label>
                <p className="setting-description">Display system notifications</p>
              </div>
              <div className="setting-control">
                <label className="macos-toggle">
                  <input
                    type="checkbox"
                    checked={localSettings.showNotifications}
                    onChange={(e) => handleSettingChange('showNotifications', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-info">
                <label className="setting-label">Show in Dock</label>
                <p className="setting-description">Display app icon in the Dock</p>
              </div>
              <div className="setting-control">
                <label className="macos-toggle">
                  <input
                    type="checkbox"
                    checked={localSettings.showInDock}
                    onChange={(e) => handleSettingChange('showInDock', e.target.checked)}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Keyboard Shortcuts Section */}
        <div className="settings-section">
          <div className="section-header">
            <div className="section-icon">
              <Keyboard size={16} />
            </div>
            <h2 className="section-title">Keyboard Shortcuts</h2>
          </div>
          <div className="section-content">
            <div className="setting-row">
              <div className="setting-info">
                <label className="setting-label">Show/Hide Window</label>
                <p className="setting-description">Toggle the main window visibility</p>
              </div>
              <div className="setting-control">
                <ShortcutRecorder
                  value={localSettings.shortcuts?.toggleWindow || ''}
                  onChange={(shortcut) => handleShortcutChange('toggleWindow', shortcut)}
                  placeholder="Click to record shortcut"
                />
              </div>
            </div>
            
            <div className="setting-row">
              <div className="setting-info">
                <label className="setting-label">Quit Application</label>
                <p className="setting-description">Completely quit the application</p>
              </div>
              <div className="setting-control">
                <ShortcutRecorder
                  value={localSettings.shortcuts?.quit || ''}
                  onChange={(shortcut) => handleShortcutChange('quit', shortcut)}
                  placeholder="Click to record shortcut"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Actions Section */}
        <div className="settings-actions">
          <button
            className="macos-button secondary"
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