import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Guard against external browser extension crashes (e.g. Chrome Web Vitals / Performance extensions)
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes("reading 'startTime'") ||
      event.message?.includes('reportAllChanges')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
