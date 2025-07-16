import { useState, useEffect } from 'react';
import type { UpdaterState, UpdateInfo } from '../../shared/constants';

interface UseUpdateStatusResult {
  updaterState: UpdaterState | null;
  isChecking: boolean;
  hasError: boolean;
  isUpdateAvailable: boolean;
  error: string | null;
  updateInfo: UpdateInfo | null;
  checkForUpdates: () => Promise<void>;
  openDownloadUrl: (url: string) => Promise<void>;
}

export const useUpdateStatus = (): UseUpdateStatusResult => {
  const [updaterState, setUpdaterState] = useState<UpdaterState | null>(null);

  useEffect(() => {
    // Use window.electronAPI for IPC events
    const electronAPI = (window as any).electronAPI;
    if (!electronAPI || !electronAPI.on) {
      // Not running in Electron, skip event subscription
      return;
    }

    const handler = (_event: any, state: UpdaterState) => {
      setUpdaterState(state);
    };

    // Listen for updater:status events
    electronAPI.on('updater:status', handler);

    // Load initial state
    loadInitialUpdaterState();

    return () => {
      electronAPI.off?.('updater:status', handler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitialUpdaterState = async () => {
    try {
      const state = await (window as any).electronAPI?.getUpdateStatus();
      if (state) setUpdaterState(state);
    } catch (error) {
      console.error('Error loading updater state:', error);
    }
  };

  const checkForUpdates = async () => {
    try {
      await (window as any).electronAPI?.checkForUpdates();
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const openDownloadUrl = async (url: string) => {
    try {
      await (window as any).electronAPI?.openDownloadUrl(url);
    } catch (error) {
      console.error('Error opening download URL:', error);
    }
  };

  // Derived helpers
  const isChecking = updaterState?.status === 'checking';
  const hasError = updaterState?.status === 'error';
  const isUpdateAvailable = updaterState?.status === 'available';
  const error = updaterState?.status === 'error' ? updaterState.error : null;
  const updateInfo =
    updaterState?.status === 'available' ? updaterState.info : null;

  return {
    updaterState,
    isChecking,
    hasError,
    isUpdateAvailable,
    error,
    updateInfo,
    checkForUpdates,
    openDownloadUrl,
  };
};
