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
  const [copyText, setCopyText] = useState('📋 Copy');
  const count = selected.size;
  const isFull = count >= MAX_STOCKS;
  const pct = (count / MAX_STOCKS) * 100;

  const handleCopy = useCallback(() => {
    if (count === 0) {
      setCopyText('⚠️ Nothing selected');
      setTimeout(() => setCopyText('📋 Copy'), 1800);
      return;
    }
    const text = Array.from(selected).join(', ');
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopyText('✅ Copied!');
        setTimeout(() => setCopyText('📋 Copy'), 2000);
      })
      .catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.top = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopyText('✅ Copied!');
        setTimeout(() => setCopyText('📋 Copy'), 2000);
      });
  }, [selected, count]);

  return (
    <div className="selection-bar fade-up" id="selection-bar" aria-live="polite">
      <div className="selection-info">
        <span className="selection-count-label">Selected:</span>
        <span className="selection-count" id="selection-count">
          {count}
        </span>
        <span className="selection-max">/ {MAX_STOCKS}</span>
      </div>
      <div className="selection-progress-wrap">
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
      <div className="selection-actions">
        <button className="sel-action-btn" id="select-all-btn" onClick={onSelectVisible}>
          Select Visible
        </button>
        <button className="sel-action-btn danger" id="clear-btn" onClick={onClearAll}>
          Clear All
        </button>
        <button className="sel-action-btn" id="copy-btn" onClick={handleCopy}>
          {copyText}
        </button>
        <button
          className="sel-action-btn primary"
          id="calculate-btn"
          disabled={count < 2 || isCalculating}
          title={count < 2 ? 'Select at least 2 stocks to calculate' : ''}
          onClick={onCalculate}
        >
          <span id="calc-btn-icon">{isCalculating ? '⏳' : '📊'}</span> Calculate
        </button>
      </div>
    </div>
  );
}
