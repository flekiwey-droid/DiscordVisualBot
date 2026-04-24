import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Fix for "ResizeObserver loop completed with undelivered notifications"
// This error is benign and often occurs with ReactFlow & Framer Motion transitions
const originalError = console.error;
console.error = (...args) => {
  if (args[0]?.includes?.('ResizeObserver loop') || args[0]?.message?.includes?.('ResizeObserver loop')) {
    return;
  }
  originalError(...args);
};

// Global listener for the same error as some browsers handle it differently
window.addEventListener('error', (e) => {
  if (e.message?.includes('ResizeObserver loop') || e.error?.message?.includes('ResizeObserver loop')) {
    const resizeObserverErrGuid = '8ff114b0-0d19-4c4c-94fb-7ca656360826';
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  }
});

// Patch ResizeObserver to defer execution
if (typeof window !== 'undefined' && window.ResizeObserver) {
  const NativeResizeObserver = window.ResizeObserver;
  window.ResizeObserver = class ResizeObserver extends NativeResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => {
          callback(entries, observer);
        });
      });
    }
  };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
