import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../shared/constants';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import HelloWorld from './components/HelloWorld';
import Settings from './components/Settings';
import ToastContainer from './components/ToastContainer';
import { useUpdateStatus } from './hooks/useUpdateStatus';
import './App.css';

type Tab = 'home' | 'settings';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Use centralized update status hook
  const { updaterState } = useUpdateStatus();

  useEffect(() => {
    // Load settings on app start
    loadSettings();
  }, []);

  // Handle update status changes for toast notifications
  useEffect(() => {
    if (!updaterState) return;

    switch (updaterState.status) {
      case 'checking':
        (window as any).showToast?.('Checking for updates...', 'info');
        break;
      case 'idle':
        (window as any).showToast?.('No updates available', 'success');
        break;
      case 'error':
        (window as any).showToast?.(`Update error: ${updaterState.error}`, 'error');
        break;
      case 'downloaded':
        // Let macOS handle update notifications natively
        console.log('Update downloaded, ready for install via macOS notification');
        break;
      default:
        // No toast for other states
        break;
    }
  }, [updaterState?.status]);

  // Apply theme to document element whenever settings change
  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  const loadSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const appSettings = await window.electronAPI?.getSettings();
      setSettings(appSettings || null);
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
  };

  const handleSettingsChange = async (newSettings: AppSettings) => {
    // Update local state immediately for UI responsiveness
    setSettings(newSettings);

    // Save settings to persistent storage through SettingsManager
    try {
      const success = await window.electronAPI?.saveSettings(newSettings);
      if (success) {
        console.log('Settings saved successfully');
      } else {
        console.error('Failed to save settings');
        // Optionally reload settings from storage on failure
        loadSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      // Reload settings on error to ensure UI reflects actual stored state
      loadSettings();
    }
  };

  // Removed handleDismissNotification as it's no longer needed

  return (
    <ErrorBoundary>
      <div className='app'>
        <Header currentTab={currentTab} onTabChange={handleTabChange} />

        <div className='content'>
          {currentTab === 'home' && (
            <ErrorBoundary>
              <HelloWorld />
            </ErrorBoundary>
          )}
          {currentTab === 'settings' && (
            <ErrorBoundary>
              {isLoadingSettings ? (
                <div className='loading-container'>
                  <div className='loading'>Loading settings...</div>
                </div>
              ) : (
                <Settings
                  settings={settings}
                  onSettingsChange={handleSettingsChange}
                />
              )}
            </ErrorBoundary>
          )}
        </div>

        {/* Toast notifications */}
        <ToastContainer maxToasts={5} />
      </div>
    </ErrorBoundary>
  );
};

export default App;
