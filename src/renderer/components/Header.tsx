import React from 'react';
import { Settings, Minimize2, ArrowLeft } from 'lucide-react';
import './Header.css';

interface HeaderProps {
  currentTab: 'home' | 'settings';
  onTabChange: (tab: 'home' | 'settings') => void;
}

const Header: React.FC<HeaderProps> = ({ currentTab, onTabChange }) => {
  const handleMinimize = () => {
    // Hide the window instead of closing it
    if (window.electronAPI) {
      window.electronAPI.hideWindow();
    }
  };

  return (
    <div className="header">
      <div className="header-left">
        {currentTab === 'settings' && (
          <button
            className="back-button"
            onClick={() => onTabChange('home')}
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
        )}
      </div>
      
      <div className="header-title">
        <h1>{currentTab === 'settings' ? 'Preferences' : 'Menubar App'}</h1>
      </div>
      
      <div className="header-right">
        {currentTab === 'home' && (
          <button
            className="settings-button"
            onClick={() => onTabChange('settings')}
            title="Settings"
          >
            <Settings size={16} />
          </button>
        )}
        <button className="minimize-button" onClick={handleMinimize} title="Minimize">
          <Minimize2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Header; 