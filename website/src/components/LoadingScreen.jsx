import { useState, useEffect } from 'react';
import { checkHealth } from '../api';
import './LoadingScreen.css';

const MESSAGES = [
  'Connecting to RiskFrame...',
  'Waiting for backend and quant engine...',
  'Services may take a few minutes to start...',
  'Checking service readiness...',
];

const POLL_INTERVAL = 3000;
const TIMEOUT = 30000;

export default function LoadingScreen({ onReady }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [timedOut, setTimedOut] = useState(false);

  const [retryCount, setRetryCount] = useState(0);
  useEffect(() => {
    setTimedOut(false);
    setMsgIndex(0);
    let cancelled = false;
    let timer;
    let controller;
    const started = Date.now();
    const poll = async () => {
      controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const ready = await checkHealth(controller.signal);
      clearTimeout(timeout);
      if (cancelled) return;
      if (ready) onReady();
      else {
        if (Date.now() - started >= TIMEOUT) setTimedOut(true);
        timer = setTimeout(poll, POLL_INTERVAL);
      }
    };
    poll();
    return () => { cancelled = true; clearTimeout(timer); controller?.abort(); };
  }, [onReady, retryCount]);

  // Advance messages once, then keep the readiness check visible.
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
        <div className="loading-bar-track"><div className="loading-bar-fill" /></div>
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <div className="loading-error-msg" role="status">Still waiting for services</div>
          <div className="loading-error-sub">
            Waiting for the backend and quant engine to be ready. Startup can take a few minutes after inactivity.
          </div>
          <button className="loading-retry-btn" onClick={() => setRetryCount(n => n + 1)}>
            Retry Connection
          </button>
          <div className="loading-reload-hint">Checks continue automatically. The app will open when services are ready.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-screen">
      <div className="loading-wordmark">Risk<span>Frame</span></div>
      <div className="loading-status" role="status">{MESSAGES[msgIndex]}</div>
      <div className="loading-bar-track"><div className="loading-bar-fill" /></div>
      <button className="loading-retry-btn" onClick={() => setRetryCount(n => n + 1)}>Retry Connection</button>
    </div>
  );
}
