import { useState, useMemo, useCallback } from 'react';
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

  const isFull = selected.size >= MAX_STOCKS;

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
  };

  return (
    <section id="stock-selector" aria-labelledby="selector-heading">
      <div className="container">
        <div className="fade-up">
          <span className="section-tag">Step 1</span>
          <h2 className="section-title" id="selector-heading">
            Build Your <span className="gradient-text">Portfolio</span>
          </h2>
          <p className="section-subtitle">
            Search and select <strong>2–35 stocks</strong> from the S&amp;P 500. Then hit{' '}
            <strong>Calculate</strong> to fetch live prices and compute your real metrics.
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
              🔍
            </span>
            <input
              type="text"
              id="stock-search"
              className="search-input"
              placeholder="Search by ticker or company name…"
              autoComplete="off"
              aria-label="Search stocks"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="search-clear"
                id="search-clear-btn"
                aria-label="Clear search"
                onClick={handleSearchClear}
              >
                ✕
              </button>
            )}
          </div>
          <FilterTabs activeSector={activeSector} onSectorChange={setActiveSector} />
        </div>

        {/* Limit Warning */}
        {isFull && (
          <div className="limit-warning" id="limit-warning">
            <span aria-hidden="true">⚠️</span>
            Maximum of 35 stocks reached. Remove a stock to add another.
          </div>
        )}

        {/* No Results */}
        {filteredStocks.length === 0 && (
          <div className="no-results" id="no-results">
            <span aria-hidden="true">🔎</span>
            <p>
              No stocks found for &quot;<span id="no-results-term">{searchTerm}</span>&quot;
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
