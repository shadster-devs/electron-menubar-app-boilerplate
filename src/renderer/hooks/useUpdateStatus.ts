import { useState, useEffect } from 'react';
import type { UpdateStatus } from '../../shared/constants';

export interface UseUpdateStatusResult {
  updateStatus: UpdateStatus | null;
  isCheckingForUpdates: boolean;
  updateProgress: number;
  currentUpdateInfo: any;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
}

export const useUpdateStatus = (): UseUpdateStatusResult => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [currentUpdateInfo, setCurrentUpdateInfo] = useState<any>(null);

  useEffect(() => {
    const handleUpdateStatus = (event: MessageEvent) => {
      // Ensure event is from our app
      if (
        event.origin !== window.location.origin &&
        event.origin !== 'file://'
      ) {
        return;
      }

      if (event.data?.type === 'updater:status') {
        const status = event.data.status as UpdateStatus;
        console.log('Update status received:', status);

        // Update all related state
        setUpdateStatus(status);
        setIsCheckingForUpdates(status.checking || false);

        // Update progress
        if (typeof status.progress === 'number') {
          setUpdateProgress(status.progress);
        } else if (!status.downloading && !status.checking) {
          setUpdateProgress(0);
        }

        // Update info
        if (status.updateInfo) {
          setCurrentUpdateInfo(status.updateInfo);
        }
      }
    };

    // Listen for update status messages
    window.addEventListener('message', handleUpdateStatus);

    // Load initial status
    loadInitialUpdateStatus();

    return () => {
      window.removeEventListener('message', handleUpdateStatus);
    };
  }, []);

  const loadInitialUpdateStatus = async () => {
    try {
      const status = await window.electronAPI?.getUpdateStatus();
      if (status) {
        setUpdateStatus(status);
        setIsCheckingForUpdates(status.checking || false);
        setUpdateProgress(status.progress || 0);
        if (status.updateInfo) {
          setCurrentUpdateInfo(status.updateInfo);
        }
      }
    } catch (error) {
      console.error('Error loading initial update status:', error);
    }
  };

  const checkForUpdates = async (): Promise<void> => {
    // Don't start new check if already checking
    if (isCheckingForUpdates) {
      console.log('Update check already in progress, skipping...');
      return;
    }

    try {
      console.log('UI: Triggering update check...');
      const result = await window.electronAPI?.checkForUpdates();

      if (result && !result.success) {
        console.error('Update check failed:', result.error);
        // The error will be handled by the status listener
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
    }
  };

  const downloadUpdate = async (): Promise<void> => {
    try {
      const result = await window.electronAPI?.downloadUpdate();

      if (result && !result.success) {
        console.error('Update download failed:', result.error);
      }
    } catch (error) {
      console.error('Error downloading update:', error);
    }
  };

  const installUpdate = async (): Promise<void> => {
    try {
      const result = await window.electronAPI?.installUpdate();

      if (result && !result.success) {
        console.error('Update install failed:', result.error);
      }
    } catch (error) {
      console.error('Error installing update:', error);
    }
  };

  return {
    updateStatus,
    isCheckingForUpdates,
    updateProgress,
    currentUpdateInfo,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  };
};
