import { useState, useEffect } from 'react';
import type {
  UpdaterState,
  UpdateInfo,
  UpdateTrigger,
} from '../../shared/constants';

export interface UseUpdateStatusResult {
  updaterState: UpdaterState | null;
  isChecking: boolean;
  isAvailable: boolean;
  isDownloading: boolean;
  isDownloaded: boolean;
  error: string | null;
  progress: number;
  updateInfo: UpdateInfo | null;
  checkForUpdates: (triggerSource?: UpdateTrigger) => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
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

  const checkForUpdates = async (triggerSource: UpdateTrigger = 'auto') => {
    try {
      await (window as any).electronAPI?.checkForUpdates(triggerSource);
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const downloadUpdate = async () => {
    try {
      await (window as any).electronAPI?.downloadUpdate();
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  };

  const installUpdate = async () => {
    try {
      await (window as any).electronAPI?.installUpdate();
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  // Derived helpers
  const isChecking = updaterState?.status === 'checking';
  const isAvailable = updaterState?.status === 'available';
  const isDownloading = updaterState?.status === 'downloading';
  const isDownloaded = updaterState?.status === 'downloaded';
  const error = updaterState?.status === 'error' ? updaterState.error : null;
  const progress =
    updaterState?.status === 'downloading' ? updaterState.progress : 0;
  const updateInfo =
    updaterState &&
    (updaterState.status === 'available' ||
      updaterState.status === 'downloading' ||
      updaterState.status === 'downloaded')
      ? updaterState.info
      : null;

  return {
    updaterState,
    isChecking,
    isAvailable,
    isDownloading,
    isDownloaded,
    error,
    progress,
    updateInfo,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
};
