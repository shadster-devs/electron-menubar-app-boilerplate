import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ToastProvider } from './hooks/useToast';

const root = createRoot(document.getElementById('root')!);
root.render(
  <ToastProvider maxToasts={5}>
    <App />
  </ToastProvider>
);
