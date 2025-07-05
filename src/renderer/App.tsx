import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import HelloWorld from './components/HelloWorld';
import Settings from './components/Settings';
import './App.css';

type Tab = 'home' | 'settings';

const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<Tab>('home');
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    // Load settings on app start
    loadSettings();
  }, []);

  // Apply theme to document element whenever settings change
  useEffect(() => {
    if (settings?.theme) {
      document.documentElement.setAttribute('data-theme', settings.theme);
    }
  }, [settings?.theme]);

  const loadSettings = async () => {
    try {
      // @ts-ignore - electron ipc will be available in electron context
      const appSettings = await window.electronAPI?.getSettings();
      setSettings(appSettings);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleTabChange = (tab: Tab) => {
    setCurrentTab(tab);
  };

  const handleSettingsChange = async (newSettings: any) => {
    setSettings(newSettings);
    
    // Save settings immediately when they change
    try {
      // @ts-ignore - electron ipc will be available in electron context
      await window.electronAPI?.saveSettings(newSettings);
      console.log('Settings saved:', newSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return (
    <div className="app">
      <Header currentTab={currentTab} onTabChange={handleTabChange} />
      
      <div className="content">
        {currentTab === 'home' && <HelloWorld />}
        {currentTab === 'settings' && (
          <Settings 
            settings={settings} 
            onSettingsChange={handleSettingsChange}
          />
        )}
      </div>
    </div>
  );
};

export default App; 