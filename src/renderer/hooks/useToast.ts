import React, { useState, useCallback, useContext, createContext } from 'react';
import Toast from '../components/toast/Toast';

export interface ToastData {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
}

interface ToastContextType {
  showToast: (
    message: string,
    type?: 'info' | 'success' | 'error',
    duration?: number
  ) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  maxToasts?: number;
  children: React.ReactNode;
}

export const ToastProvider = ({
  maxToasts = 5,
  children,
}: ToastProviderProps): React.ReactElement => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showToast = useCallback(
    (
      message: string,
      type: 'info' | 'success' | 'error' = 'info',
      duration = 3000
    ) => {
      const id = `toast-${Date.now()}-${Math.random()}`;
      const newToast: ToastData = { id, message, type, duration };
      setToasts(prev => {
        const updated = [...prev, newToast];
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts);
        }
        return updated;
      });
    },
    [maxToasts]
  );

  return React.createElement(
    ToastContext.Provider,
    { value: { showToast } },
    children,
    React.createElement(
      'div',
      { className: 'toast-container' },
      toasts.map(toast =>
        React.createElement(Toast, {
          key: toast.id,
          id: toast.id,
          message: toast.message,
          type: toast.type,
          duration: toast.duration,
          onClose: removeToast,
        })
      )
    )
  );
};
