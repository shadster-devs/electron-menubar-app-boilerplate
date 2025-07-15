import React, { useEffect, useState } from 'react';
import './Toast.css';

export interface ToastProps {
  id: string;
  message: string;
  type?: 'info' | 'success' | 'error';
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  message,
  type = 'info',
  duration = 3000,
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-remove after duration
    const timer = setTimeout(() => {
      handleClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onClose(id);
    }, 300); // Match CSS transition duration
  };

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

  return (
    <div
      className={`toast ${isVisible && !isLeaving ? 'toast-visible' : ''} ${isLeaving ? 'toast-leaving' : ''}`}
      style={{
        borderLeftColor: getToastColor(),
      }}
    >
      <p className='toast-message'>{message}</p>
    </div>
  );
};

export default Toast;
