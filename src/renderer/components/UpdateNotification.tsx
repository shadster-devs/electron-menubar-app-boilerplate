import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { useUpdateStatus } from '../hooks/useUpdateStatus';
import './UpdateNotification.css';

export interface UpdateNotificationProps {
  updateInfo: any;
  onInstall: () => void;
  onDismiss: () => void;
}

const UpdateNotification: React.FC<UpdateNotificationProps> = ({ 
  updateInfo, 
  onInstall, 
  onDismiss 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    requestAnimationFrame(() => {
      setIsVisible(true);
    });

    // Auto-dismiss after 10 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 10000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      onDismiss();
    }, 300); // Match CSS transition duration
  };

  const handleInstallClick = () => {
    onInstall();
    handleDismiss(); // Close notification after install
  };

  return (
    <div 
      className={`update-notification ${isVisible && !isLeaving ? 'update-notification-visible' : ''} ${isLeaving ? 'update-notification-leaving' : ''}`}
    >
      <button 
        className="update-notification-close"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        <X size={16} />
      </button>

      <div className="update-notification-icon">
        <Download size={20} />
      </div>

      <div className="update-notification-content">
        <h3 className="update-notification-title">Update Downloaded</h3>
        <p className="update-notification-message">
          Version {updateInfo?.version || 'Unknown'} is ready to install.
        </p>
        
        {updateInfo?.releaseNotes && updateInfo.releaseNotes.length > 0 && (
          <div className="update-notification-notes">
            <p className="notes-title">What's new:</p>
            <ul className="notes-list">
              {updateInfo.releaseNotes.slice(0, 3).map((note: string, index: number) => (
                <li key={index} className="notes-item">
                  {note.length > 60 ? `${note.substring(0, 60)}...` : note}
                </li>
              ))}
              {updateInfo.releaseNotes.length > 3 && (
                <li className="notes-item">
                  +{updateInfo.releaseNotes.length - 3} more changes...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>

      <div className="update-notification-actions">
        <button 
          className="update-notification-button primary"
          onClick={handleInstallClick}
        >
          Install & Restart
        </button>
        <button 
          className="update-notification-button secondary"
          onClick={handleDismiss}
        >
          Later
        </button>
      </div>
    </div>
  );
};

export default UpdateNotification; 