import React from 'react';
import { Settings, Minimize2 } from 'lucide-react';
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
      <div className="header-title">
        <h1>Menubar App</h1>
      </div>
      
      <div className="header-controls">
        <button
          className={`settings-button ${currentTab === 'settings' ? 'active' : ''}`}
          onClick={() => onTabChange(currentTab === 'settings' ? 'home' : 'settings')}
          title="Settings"
        >
          <Settings size={16} />
        </button>
        <button className="minimize-button" onClick={handleMinimize} title="Minimize">
          <Minimize2 size={16} />
        </button>
      </div>
    </div>
  );
};

export default Header; 