import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { SP500_STOCKS, MAX_STOCKS } from '../../data/stocks';
import SelectionBar from './SelectionBar';
import SelectedPreview from './SelectedPreview';
import FilterTabs from './FilterTabs';
import StockGrid from './StockGrid';

export default function StockSelector({
  selected,
  onToggle,
  onBatchSelect,
  onClearAll,
  isCalculating,
  onCalculate,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSector, setActiveSector] = useState('all');
  const searchInputRef = useRef(null);

  const isFull = selected.size >= MAX_STOCKS;

  // Keyboard shortcut: Pressing '/' focuses search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Derive filtered stocks
  const filteredStocks = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return SP500_STOCKS.filter((stock) => {
      const sectorMatch = activeSector === 'all' || stock.sector === activeSector;
      const searchMatch =
        !q ||
        stock.ticker.toLowerCase().includes(q) ||
        stock.name.toLowerCase().includes(q);
      return sectorMatch && searchMatch;
    });
  }, [searchTerm, activeSector]);

  // Select all currently visible stocks
  const handleSelectVisible = useCallback(() => {
    const toAdd = [];
    let count = selected.size;
    for (const stock of filteredStocks) {
      if (count >= MAX_STOCKS) break;
      if (!selected.has(stock.ticker)) {
        toAdd.push(stock.ticker);
        count++;
      }
    }
    if (toAdd.length > 0) {
      if (onBatchSelect) {
        onBatchSelect(toAdd);
      } else {
        toAdd.forEach((t) => onToggle(t));
      }
    }
  }, [filteredStocks, selected, onBatchSelect, onToggle]);

  const handleSearchClear = () => {
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  return (
    <section id="stock-selector" aria-labelledby="selector-heading">
      <div className="container">
        <div className="fade-up">
          <span className="section-tag">Step 01 // Universe Selection</span>
          <h2 className="section-title" id="selector-heading">
            Asset Universe <span className="gradient-text">&amp; Selection</span>
          </h2>
          <p className="section-subtitle">
            Curate <strong>2–35 equities</strong> from the S&amp;P 500 index. The neural network will project forward alphas and solve for optimal Ledoit-Wolf risk-weighted allocations.
          </p>
        </div>

        {/* Selection Status Bar */}
        <SelectionBar
          selected={selected}
          isCalculating={isCalculating}
          filteredStocks={filteredStocks}
          onSelectVisible={handleSelectVisible}
          onClearAll={onClearAll}
          onCalculate={onCalculate}
        />

        {/* Selected Chips Preview */}
        <SelectedPreview selected={selected} onRemove={onToggle} />

        {/* Controls */}
        <div className="selector-controls fade-up">
          <div className="search-wrap">
            <span className="search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 14L10.5 10.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="text"
              id="stock-search"
              className="search-input"
              placeholder="Search by ticker symbol or corporation name…"
              autoComplete="off"
              aria-label="Search stocks"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm ? (
              <button
                className="search-clear"
                id="search-clear-btn"
                aria-label="Clear search"
                onClick={handleSearchClear}
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M9 3L3 9M3 3L9 9"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            ) : (
              <span className="kbd-badge" aria-hidden="true">
                /
              </span>
            )}
          </div>
          <FilterTabs activeSector={activeSector} onSectorChange={setActiveSector} />
        </div>

        {/* Limit Warning */}
        {isFull && (
          <div className="limit-warning" id="limit-warning">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1.5L14.5 13H1.5L8 1.5Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path d="M8 6V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11" r="0.75" fill="currentColor" />
            </svg>
            <span>Maximum portfolio threshold reached (35 assets). Deselect an equity to modify.</span>
          </div>
        )}

        {/* No Results */}
        {filteredStocks.length === 0 && (
          <div className="no-results" id="no-results">
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              style={{ margin: '0 auto 16px', opacity: 0.4 }}
            >
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="1.5" />
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M8 11H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <p>
              No equities found matching &quot;<span id="no-results-term">{searchTerm}</span>&quot;
            </p>
          </div>
        )}

        {/* Stock Grid */}
        <StockGrid
          stocks={filteredStocks}
          selected={selected}
          isFull={isFull}
          onToggle={onToggle}
        />
      </div>
    </section>
  );
}
