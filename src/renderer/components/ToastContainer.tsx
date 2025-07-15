import React, { useState, useCallback } from 'react';
import Toast from './Toast';
import './Toast.css';

export interface ToastData {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
}

export interface ToastContainerProps {
  maxToasts?: number;
}

export interface ToastContextType {
  showToast: (
    message: string,
    type?: 'info' | 'success' | 'error',
    duration?: number
  ) => void;
}

const ToastContainer: React.FC<ToastContainerProps> = ({ maxToasts = 5 }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'error' = 'info',
      duration = 3000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = { id, message, type, duration };

      setToasts(prev => {
        const updated = [...prev, newToast];

        // Remove oldest toasts if we exceed maxToasts
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }

        return updated;
      });
    },
    [maxToasts]
  );

  // Expose the addToast function globally for easy access
  React.useEffect(() => {
    (window as any).showToast = addToast;

    return () => {
      delete (window as any).showToast;
    };
  }, [addToast]);

  return (
    <div className='toast-container'>
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
