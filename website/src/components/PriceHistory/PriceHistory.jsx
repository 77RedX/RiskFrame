import { useState, useCallback } from 'react';
import { SP500_STOCKS } from '../../data/stocks';
import PriceChart from './PriceChart';

export default function PriceHistory() {
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null);

  const handleFetch = useCallback(async () => {
    const input = searchValue.trim();
    if (!input) return;

    const upper = input.toUpperCase();
    let stockObj = SP500_STOCKS.find((s) => s.ticker === upper);

    if (!stockObj) {
      const lower = input.toLowerCase();
      stockObj = SP500_STOCKS.find((s) => s.name.toLowerCase() === lower);
    }

    if (!stockObj) {
      const lower = input.toLowerCase();
      stockObj = SP500_STOCKS.find((s) => s.name.toLowerCase().includes(lower));
    }

    if (!stockObj) {
      setError(`Equity "${input}" not located in active S&P 500 universe.`);
      setChartData(null);
      return;
    }

    const ticker = stockObj.ticker;

    setError('');
    setChartData(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/prices?ticker=${ticker}`);
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.error) throw new Error(data.error);

      setChartData({ ticker, dates: data.dates, prices: data.prices });
    } catch (err) {
      setError(`Error querying market feed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchValue]);

  return (
    <section id="price-history" aria-labelledby="history-heading">
      <div className="container">
        <div className="fade-up">
          <span className="section-tag" id="history-tag">
            Feed // Market Intelligence
          </span>
          <h2 className="section-title" id="history-heading">
            Historical <span className="gradient-text">Pricing Feed</span>
          </h2>
          <p className="section-subtitle">
            Inspect real-time 15-day market closing trajectory for any individual component equity in the index.
          </p>
        </div>

        <div className="fade-up" style={{ textAlign: 'center', margin: '36px auto 32px', maxWidth: '440px' }}>
          <div className="search-wrap" style={{ position: 'relative' }}>
            <span className="search-icon" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                <path
                  d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
                <path d="M14 14L10.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input
              type="text"
              id="history-search"
              className="search-input"
              list="history-datalist"
              placeholder="Query ticker or corporation name…"
              autoComplete="off"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleFetch();
              }}
            />
            <datalist id="history-datalist">
              {SP500_STOCKS.map((stock) => (
                <option key={stock.ticker} value={stock.ticker}>
                  {stock.name} ({stock.sector})
                </option>
              ))}
            </datalist>

            <button
              id="history-btn"
              className="btn-luxury-primary"
              style={{ marginTop: '14px', width: '100%', justifyContent: 'center' }}
              onClick={handleFetch}
            >
              <span>Fetch Price Trajectory</span>
              <span className="btn-icon-capsule" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 7H11.5M11.5 7L7.5 3M11.5 7L7.5 11"
                    stroke="#08080A"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div id="history-loading" className="loading-card fade-up visible" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="loading-radar"></div>
            <div className="loading-text">Fetching historical market feed…</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            id="history-error"
            className="limit-warning"
            style={{ maxWidth: '540px', margin: '0 auto 24px' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Chart */}
        {chartData && (
          <div
            id="history-chart-container"
            className="breakdown-card fade-up visible"
            style={{ maxWidth: '880px', margin: '0 auto', padding: '28px' }}
          >
            <PriceChart
              key={chartData.ticker}
              ticker={chartData.ticker}
              dates={chartData.dates}
              prices={chartData.prices}
            />
          </div>
        )}
      </div>
    </section>
  );
}
