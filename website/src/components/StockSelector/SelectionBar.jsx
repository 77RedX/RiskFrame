import { useState, useCallback } from 'react';
import { MAX_STOCKS } from '../../data/stocks';

export default function SelectionBar({
  selected,
  isCalculating,
  filteredStocks,
  onSelectVisible,
  onClearAll,
  onCalculate,
}) {
  const [copied, setCopied] = useState(false);
  const count = selected.size;
  const isFull = count >= MAX_STOCKS;
  const pct = (count / MAX_STOCKS) * 100;

  const handleCopy = useCallback(() => {
    if (count === 0) return;
    const text = Array.from(selected).join(', ');
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
  }, [selected, count]);

  return (
    <div className="selection-dock-container">
      <div className="selection-bar fade-up" id="selection-bar" aria-live="polite">
        <div className="selection-info">
          <div className="selection-count-pill">
            <span className="selection-count" id="selection-count">
              {count}
            </span>
            <span className="selection-max">/ {MAX_STOCKS} EQUITIES</span>
          </div>

          <div className="selection-progress-wrap" aria-hidden="true">
            <div
              className={`selection-progress-bar${isFull ? ' full' : ''}`}
              id="selection-progress"
              role="progressbar"
              aria-valuenow={count}
              aria-valuemin={0}
              aria-valuemax={MAX_STOCKS}
              style={{ width: `${pct}%` }}
            ></div>
          </div>
        </div>

        <div className="selection-actions">
          <button
            className="sel-action-btn"
            id="select-all-btn"
            onClick={onSelectVisible}
            title="Select all visible stocks in current filter"
          >
            <span>Select Visible</span>
          </button>

          {count > 0 && (
            <>
              <button
                className="sel-action-btn"
                id="copy-btn"
                onClick={handleCopy}
                title="Copy selected ticker list to clipboard"
              >
                {copied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M3 8.5L6.5 12L13 4"
                        stroke="#2EE59D"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <span style={{ color: '#2EE59D' }}>Copied</span>
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <rect
                        x="5"
                        y="5"
                        width="8"
                        height="9"
                        rx="1.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M11 3.5V3C11 2.44772 10.5523 2 10 2H4C3.44772 2 3 2.44772 3 3V10C3 10.5523 3.44772 11 4 11H4.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>

              <button className="sel-action-btn danger" id="clear-btn" onClick={onClearAll}>
                <span>Clear All</span>
              </button>
            </>
          )}

          <button
            className="sel-action-btn primary"
            id="calculate-btn"
            disabled={count < 2 || isCalculating}
            title={count < 2 ? 'Select at least 2 stocks to calculate' : ''}
            onClick={onCalculate}
          >
            {isCalculating ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="9"
                    stroke="#08080A"
                    strokeWidth="2.5"
                    strokeDasharray="40"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Solving SLSQP…</span>
              </>
            ) : (
              <>
                <span>Optimize Portfolio</span>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11"
                    stroke="#08080A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
