import React, { useState, useEffect } from 'react';
import type { AppSettings } from '../shared/constants';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import HelloWorld from './components/HelloWorld';
import Settings from './components/Settings';
import './App.css';

type Tab = 'home' | 'settings';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [updateStatus, setUpdateStatus] = useState<any>(null);
  const [toastContainer, setToastContainer] = useState<HTMLDivElement | null>(
    null
  );

  // Create toast container on mount
  useEffect(() => {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    `;
    document.body.appendChild(container);
    setToastContainer(container);

    return () => {
      if (container.parentElement) {
        container.remove();
      }
    };
  }, []);

  useEffect(() => {
    // Load settings on app start
    loadSettings();

    // Listen for context menu update check events and updater status
    const handleMessages = (event: MessageEvent) => {
      if (event.data.type === 'context-menu:check-for-updates') {
        window.electronAPI?.checkForUpdates();
      } else if (event.data.type === 'updater:status') {
        const prevStatus = updateStatus;
        setUpdateStatus(event.data.status);
        console.log('Update status:', event.data.status);

        // Show toast when checking starts
        if (
          event.data.status.checking &&
          (!prevStatus || !prevStatus.checking)
        ) {
          showToast('Checking for updates...', 'info');
        }

        // Show toast when no update is available
        if (
          !event.data.status.checking &&
          !event.data.status.available &&
          prevStatus &&
          prevStatus.checking &&
          !event.data.status.error
        ) {
          showToast('No updates available', 'success');
        }

        // Show toast for errors
        if (event.data.status.error && (!prevStatus || !prevStatus.error)) {
          showToast(`Update error: ${event.data.status.error}`, 'error');
        }

        // Show notification when update is downloaded
        if (event.data.status.downloaded && !event.data.status.error) {
          showUpdateNotification(event.data.status.updateInfo);
        }
      }
    };

    window.addEventListener('message', handleMessages);

    return () => {
      window.removeEventListener('message', handleMessages);
    };
  }, [updateStatus]);

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

  const showToast = (
    message: string,
    type: 'info' | 'success' | 'error' = 'info'
  ) => {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    const toastId = `toast-${Date.now()}-${Math.random()}`;
    toast.id = toastId;

    const getToastColor = () => {
      switch (type) {
        case 'success':
          return 'var(--success-color, #10b981)';
        case 'error':
          return 'var(--error-color, #ef4444)';
        default:
          return 'var(--accent-primary)';
      }
    };

    toast.innerHTML = `
      <div style="
        background: var(--background-secondary);
        border: 1px solid var(--border-primary);
        border-left: 4px solid ${getToastColor()};
        border-radius: 8px;
        padding: 12px 16px;
        box-shadow: 0 4px 16px var(--shadow-medium);
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
        pointer-events: auto;
        transform: translateX(100%);
        opacity: 0;
      ">
        <p style="margin: 0; font-size: 13px; color: var(--text-primary);">
          ${message}
        </p>
      </div>
    `;

    // Add to container
    toastContainer.appendChild(toast);

    // Trigger entrance animation
    requestAnimationFrame(() => {
      const toastElement = toast.querySelector('div') as HTMLElement;
      if (toastElement) {
        toastElement.style.transform = 'translateX(0)';
        toastElement.style.opacity = '1';
        toastElement.style.transition =
          'transform 0.3s ease-out, opacity 0.3s ease-out';
      }
    });

    // Auto-remove after 3 seconds
    const removeToast = () => {
      const toastElement = toast.querySelector('div') as HTMLElement;
      if (toastElement) {
        toastElement.style.transform = 'translateX(100%)';
        toastElement.style.opacity = '0';
        toastElement.style.transition =
          'transform 0.3s ease-in, opacity 0.3s ease-in';

        setTimeout(() => {
          if (toast.parentElement) {
            toast.remove();
          }
        }, 300);
      }
    };

    setTimeout(removeToast, 3000);

    // Limit number of toasts (remove oldest if too many)
    const allToasts = toastContainer.children;
    if (allToasts.length > 5) {
      const oldestToast = allToasts[0];
      if (oldestToast) {
        const oldestToastElement = oldestToast.querySelector(
          'div'
        ) as HTMLElement;
        if (oldestToastElement) {
          oldestToastElement.style.transform = 'translateX(100%)';
          oldestToastElement.style.opacity = '0';
          setTimeout(() => {
            if (oldestToast.parentElement) {
              oldestToast.remove();
            }
          }, 300);
        }
      }
    }
  };

  const showUpdateNotification = (updateInfo: any) => {
    // Create a simple notification UI
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--background-secondary);
        border: 1px solid var(--border-primary);
        border-radius: 8px;
        padding: 16px;
        box-shadow: 0 4px 16px var(--shadow-medium);
        z-index: 1000;
        max-width: 300px;
      ">
        <h3 style="margin: 0 0 8px 0; font-size: 14px; color: var(--text-primary);">
          Update Downloaded
        </h3>
        <p style="margin: 0 0 12px 0; font-size: 12px; color: var(--text-secondary);">
          Version ${updateInfo?.version || 'Unknown'} is ready to install.
        </p>
        <div style="display: flex; gap: 8px;">
          <button onclick="window.electronAPI?.installUpdate(); this.parentElement.parentElement.parentElement.remove();" 
                  style="
                    background: var(--accent-primary);
                    color: white;
                    border: none;
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                  ">
            Install & Restart
          </button>
          <button onclick="this.parentElement.parentElement.parentElement.remove();" 
                  style="
                    background: var(--background-tertiary);
                    color: var(--text-primary);
                    border: 1px solid var(--border-primary);
                    padding: 6px 12px;
                    border-radius: 4px;
                    font-size: 12px;
                    cursor: pointer;
                  ">
            Later
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(notification);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
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
      </div>
    </ErrorBoundary>
  );
};

export default App;
