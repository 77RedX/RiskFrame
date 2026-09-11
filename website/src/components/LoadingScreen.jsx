import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../api';
import './LoadingScreen.css';

const MESSAGES = [
  'Initializing server...',
  'Preparing your experience...',
  'Loading market intelligence...',
  'Almost ready...',
];

const POLL_INTERVAL = 3000;
const TIMEOUT = 5 * 60 * 1000; // 5 minutes
const MIN_DISPLAY = 4000; // minimum time to show loading screen

export default function LoadingScreen({ onReady }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const startPolling = useCallback(() => {
    setTimedOut(false);
    setMsgIndex(0);
    let cancelled = false;
    const mountedAt = Date.now();

    const poll = async () => {
      while (!cancelled) {
        if (Date.now() - mountedAt > TIMEOUT) {
          setTimedOut(true);
          return;
        }
        try {
          if (await checkHealth()) {
            // Wait until minimum display time has passed
            const elapsed = Date.now() - mountedAt;
            if (elapsed < MIN_DISPLAY) {
              await new Promise(r => setTimeout(r, MIN_DISPLAY - elapsed));
            }
            if (!cancelled) onReady();
            return;
          }
        } catch { /* server still waking */ }
        await new Promise(r => setTimeout(r, POLL_INTERVAL));
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [onReady]);

  // Start polling on mount
  useEffect(() => startPolling(), [startPolling]);

  // Advance messages once, then stop at the last one ("Almost ready...")
  useEffect(() => {
    if (timedOut) return;
    const id = setInterval(() => {
      setMsgIndex(i => (i < MESSAGES.length - 1 ? i + 1 : i));
    }, 3500);
    return () => clearInterval(id);
  }, [timedOut]);

  if (timedOut) {
    return (
      <div className="loading-screen">
        <div className="loading-wordmark">Risk<span>Frame</span></div>
        <div className="loading-bar-track"><div className="loading-bar-fill error" /></div>
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <div className="loading-error-msg">Server is currently unavailable</div>
          <div className="loading-error-sub">
            The backend may be experiencing high demand or undergoing maintenance.
          </div>
          <button className="loading-retry-btn" onClick={startPolling}>
            Retry Connection
          </button>
          <div className="loading-reload-hint">You can also refresh the page to try again.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-screen">
      <div className="loading-wordmark">Risk<span>Frame</span></div>
      <div className="loading-status">{MESSAGES[msgIndex]}</div>
      <div className="loading-bar-track"><div className="loading-bar-fill" /></div>
    </div>
  );
}
