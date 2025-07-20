import { useState, useEffect } from 'react';
import type { UpdateStatus, AppSettings } from '../../shared/constants';

export interface UseUpdateStatusResult {
  updateStatus: UpdateStatus | null;
  isCheckingForUpdates: boolean;
  updateProgress: number;
  currentUpdateInfo: any;
  shouldShowNotification: boolean;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  deferUpdate: () => Promise<void>;
}

export const useUpdateStatus = (): UseUpdateStatusResult => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);
  const [updateProgress, setUpdateProgress] = useState<number>(0);
  const [currentUpdateInfo, setCurrentUpdateInfo] = useState<any>(null);
  const [shouldShowNotification, setShouldShowNotification] = useState(false);

  useEffect(() => {
    const handleUpdateStatus = (event: MessageEvent) => {
      if (
          event.origin !== window.location.origin &&
          event.origin !== 'file://'
      ) {
        return;
      }

      if (event.data?.type === 'updater:status') {
        const status = event.data.status as UpdateStatus;
        setUpdateStatus(status);
        setIsCheckingForUpdates(status.checking || false);

        if (typeof status.progress === 'number') {
          setUpdateProgress(status.progress);
        } else if (!status.downloading && !status.checking) {
          setUpdateProgress(0);
        }

        if (status.updateInfo) {
          setCurrentUpdateInfo(status.updateInfo);
        }

        evaluateNotification(status);
      }
    };

    window.addEventListener('message', handleUpdateStatus);
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
        evaluateNotification(status);
      }
    } catch (error) {
      console.error('Error loading initial update status:', error);
    }
  };

  const evaluateNotification = async (status: UpdateStatus) => {
    if (!status.downloaded || !status.updateInfo) {
      setShouldShowNotification(false);
      return;
    }

    try {
      const settings: AppSettings = await window.electronAPI.getSettings();
      const deferred = settings?.updater?.updateDeferred;
      setShouldShowNotification(!deferred);
    } catch (error) {
      console.error('Error checking deferred update setting:', error);
      setShouldShowNotification(true); // fallback
    }
  };

  const checkForUpdates = async (): Promise<void> => {
    if (isCheckingForUpdates) return;

    try {
      const result = await window.electronAPI?.checkForUpdates();
      if (result && !result.success) {
        console.error('Update check failed:', result.error);
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

  const deferUpdate = async (): Promise<void> => {
    try {
      const result = await window.electronAPI?.deferUpdate();
      if (!result?.success) {
        console.error('Failed to defer update:', result?.error);
      } else {
        setShouldShowNotification(false); // Hide the notification
      }
    } catch (error) {
      console.error('Error deferring update:', error);
    }
  };

  return {
    updateStatus,
    isCheckingForUpdates,
    updateProgress,
    currentUpdateInfo,
    shouldShowNotification,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
    deferUpdate,
  };
};
