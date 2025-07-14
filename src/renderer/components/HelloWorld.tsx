import { Sparkles } from 'lucide-react';
import React from 'react';
import './HelloWorld.css';

const HelloWorld: React.FC = () => {
  return (
    <div className='hello-world'>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '16px',
        }}
      >
        <Sparkles size={24} style={{ color: 'var(--accent-primary)' }} />
        <h1 style={{ margin: 0 }}>Hello World!</h1>
      </div>
      <div className='welcome-message'>
        <p>Welcome to your Electron Menubar Boilerplate!</p>
        <p>
          This is a simple React TypeScript application running in the menubar.
        </p>
      </div>
      <p>
        <strong>Features:</strong>
      </p>
      <ul>
        <li>✨ Electron menubar integration</li>
        <li>⚛️ React with TypeScript</li>
        <li>🎨 Modern, clean UI</li>
        <li>⚙️ Modular architecture</li>
        <li>🎯 Global shortcuts</li>
        <li>📱 Settings management</li>
      </ul>
      <p>
        <small>
          Click the Settings tab to configure your preferences, or use{' '}
          <code>Cmd+Shift+Space</code> to toggle the window!
        </small>
      </p>
    </div>
  );
};

export default HelloWorld;
