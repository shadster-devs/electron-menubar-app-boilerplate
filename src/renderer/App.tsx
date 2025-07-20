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

  const { updateStatus } = useUpdateStatus();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (!updateStatus) return;

    if (updateStatus.checking) {
      (window as any).showToast?.('Checking for updates...', 'info');
    }

    if (
      !updateStatus.checking &&
      !updateStatus.available &&
      !updateStatus.error
    ) {
      (window as any).showToast?.('No updates available', 'success');
    }

    if (updateStatus.error) {
      (window as any).showToast?.(
        `Update error: ${updateStatus.error}`,
        'error'
      );
    }
  }, [updateStatus?.checking, updateStatus?.available, updateStatus?.error]);

  useEffect(() => {
    if (
      updateStatus?.downloaded &&
      updateStatus?.updateInfo &&
      settings?.updater?.updateDeferred === false
    ) {
      setShowUpdateNotification(true);
    }
  }, [
    updateStatus?.downloaded,
    updateStatus?.updateInfo,
    settings?.updater?.updateDeferred,
  ]);

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
    setSettings(newSettings);

    try {
      const success = await window.electronAPI?.saveSettings(newSettings);
      if (!success) {
        console.error('Failed to save settings');
        loadSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      loadSettings();
    }
  };

  const handleDeferUpdate = async () => {
    try {
      await window.electronAPI?.deferUpdate();
    } catch (err) {
      console.error('Failed to defer update:', err);
    } finally {
      setShowUpdateNotification(false);
      loadSettings();
    }
  };

  const handleInstallUpdate = async () => {
    try {
      await window.electronAPI?.installUpdate();
    } catch (err) {
      console.error('Failed to install update:', err);
    } finally {
      setShowUpdateNotification(false);
    }
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

        <ToastContainer maxToasts={5} />

        {showUpdateNotification && updateStatus?.updateInfo && (
          <UpdateNotification
            updateInfo={updateStatus.updateInfo}
            onInstall={handleInstallUpdate}
            onDismiss={handleDeferUpdate}
          />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
