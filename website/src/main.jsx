import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './App.css';

// Start the public quant service once per page load, independently of React retries.
const quantUrl = import.meta.env.VITE_QUANT_URL;
if (quantUrl) {
  void fetch(`${quantUrl.replace(/\/+$/, '')}/api/health`, {
    mode: 'no-cors',
    credentials: 'omit',
    cache: 'no-store',
  }).catch(() => {}); // The combined backend check owns readiness and error feedback.
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
