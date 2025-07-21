import { useState, useEffect, useCallback } from 'react';
import type { UpdateStatus, UpdateInfo } from '../../shared/constants';

interface UseUpdateStatusReturn {
  updateStatus: UpdateStatus | null;
  isCheckingForUpdates: boolean;
  updateProgress: number;
  currentUpdateInfo: UpdateInfo | null;
  checkForUpdates: () => Promise<void>;
  downloadUpdate: () => Promise<void>;
}

export const useUpdateStatus = (): UseUpdateStatusReturn => {
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [isCheckingForUpdates, setIsCheckingForUpdates] = useState(false);

  // Load initial update status
  useEffect(() => {
    const loadInitialStatus = async () => {
      try {
        const status = await window.electronAPI?.getUpdateStatus();
        if (status) {
          setUpdateStatus(status);
        }
      } catch (error) {
        console.error('Error loading initial update status:', error);
      }
    };

    loadInitialStatus();
  }, []);

  // Listen for update status events from main process
  useEffect(() => {
    const handleUpdateStatus = (event: MessageEvent) => {
      if (event.data?.type === 'updater:status') {
        const status = event.data.status as UpdateStatus;
        setUpdateStatus(status);
        setIsCheckingForUpdates(status.checking);
      }
    };

    // Listen for status updates from main process
    window.addEventListener('message', handleUpdateStatus);

    return () => {
      window.removeEventListener('message', handleUpdateStatus);
    };
  }, []);

  // Check for updates
  const checkForUpdates = useCallback(async () => {
    if (isCheckingForUpdates) {
      console.log('Update check already in progress');
      return;
    }

    try {
      setIsCheckingForUpdates(true);
      const result = await window.electronAPI?.checkForUpdates();

      if (result && !result.success) {
        console.error('Failed to check for updates:', result.error);
        // Update status with error
        setUpdateStatus(prev =>
          prev
            ? {
                ...prev,
                checking: false,
                error: result.error || 'Failed to check for updates',
              }
            : null
        );
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      setUpdateStatus(prev =>
        prev
          ? {
              ...prev,
              checking: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to check for updates',
            }
          : null
      );
    } finally {
      setIsCheckingForUpdates(false);
    }
  }, [isCheckingForUpdates]);

  // Download update
  const downloadUpdate = useCallback(async () => {
    if (!updateStatus?.available) {
      console.warn('No update available to download');
      return;
    }

    if (updateStatus.downloading) {
      console.log('Download already in progress');
      return;
    }

    try {
      const result = await window.electronAPI?.downloadUpdate();

      if (result && !result.success) {
        console.error('Failed to download update:', result.error);
        // Update status with error
        setUpdateStatus(prev =>
          prev
            ? {
                ...prev,
                downloading: false,
                error: result.error || 'Failed to download update',
              }
            : null
        );
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      setUpdateStatus(prev =>
        prev
          ? {
              ...prev,
              downloading: false,
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to download update',
            }
          : null
      );
    }
  }, [updateStatus?.available, updateStatus?.downloading]);

  // Computed values
  const updateProgress = updateStatus?.progress || 0;
  const currentUpdateInfo = updateStatus?.updateInfo || null;

  return {
    updateStatus,
    isCheckingForUpdates,
    updateProgress,
    currentUpdateInfo,
    checkForUpdates,
    downloadUpdate,
  };
};
