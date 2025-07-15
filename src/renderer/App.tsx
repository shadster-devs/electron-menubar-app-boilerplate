import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../shared/constants';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import HelloWorld from './components/HelloWorld';
import Settings from './components/Settings';
import ToastContainer from './components/ToastContainer';
import UpdateNotification from './components/UpdateNotification';
import { useUpdateStatus } from './hooks/useUpdateStatus';
import './App.css';

type Tab = 'home' | 'settings';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [notificationUpdateInfo, setNotificationUpdateInfo] = useState<any>(null);
  
  // Use centralized update status hook
  const { updateStatus, installUpdate } = useUpdateStatus();

  useEffect(() => {
    // Load settings on app start
    loadSettings();
  }, []);

  // Handle update status changes for toast notifications
  useEffect(() => {
    if (!updateStatus) return;

    // Show toast when checking starts
    if (updateStatus.checking) {
      (window as any).showToast?.('Checking for updates...', 'info');
    }

    // Show toast when no update is available
    if (!updateStatus.checking && !updateStatus.available && !updateStatus.error) {
      (window as any).showToast?.('No updates available', 'success');
    }

    // Show toast for errors
    if (updateStatus.error) {
      (window as any).showToast?.(`Update error: ${updateStatus.error}`, 'error');
    }

    // Show notification when update is downloaded
    if (updateStatus.downloaded && !updateStatus.error && updateStatus.updateInfo) {
      setNotificationUpdateInfo(updateStatus.updateInfo);
      setShowUpdateNotification(true);
    }
  }, [updateStatus?.checking, updateStatus?.available, updateStatus?.error, updateStatus?.downloaded]);

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

  const handleInstallUpdate = async () => {
    try {
      await installUpdate();
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  const handleDismissNotification = () => {
    setShowUpdateNotification(false);
    setNotificationUpdateInfo(null);
  };

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
        
        {/* Update notification */}
        {showUpdateNotification && notificationUpdateInfo && (
          <UpdateNotification
            updateInfo={notificationUpdateInfo}
            onInstall={handleInstallUpdate}
            onDismiss={handleDismissNotification}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
