import { useState, useCallback } from 'react';
import { SP500_STOCKS } from '../../data/stocks';
import PriceChart from './PriceChart';

export default function PriceHistory() {
  const [searchValue, setSearchValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [chartData, setChartData] = useState(null); // { ticker, dates, prices }

  const handleFetch = useCallback(async () => {
    const input = searchValue.trim();
    if (!input) return;

    const upper = input.toUpperCase();
    // 1. Exact ticker match
    let stockObj = SP500_STOCKS.find((s) => s.ticker === upper);

    // 2. Exact company name match (case-insensitive)
    if (!stockObj) {
      const lower = input.toLowerCase();
      stockObj = SP500_STOCKS.find((s) => s.name.toLowerCase() === lower);
    }

    // 3. Substring company name match (case-insensitive)
    if (!stockObj) {
      const lower = input.toLowerCase();
      stockObj = SP500_STOCKS.find((s) => s.name.toLowerCase().includes(lower));
    }

    if (!stockObj) {
      setError(`Stock "${input}" not found in our supported list of S&P 500 stocks.`);
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
      setError(`Error fetching data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [searchValue]);

  return (
    <section id="price-history" aria-labelledby="history-heading">
      <div className="container">
        <div className="fade-up">
          <span className="section-tag" id="history-tag">
            Market Data
          </span>
          <h2 className="section-title" id="history-heading">
            Historical <span className="gradient-text">Prices</span>
          </h2>
          <p className="section-subtitle">
            View the last 15 days of actual market closing prices for any S&amp;P 500 stock.
          </p>
        </div>

        <div className="history-controls fade-up" style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div className="search-wrap" style={{ maxWidth: '400px', margin: '0 auto' }}>
            <input
              type="text"
              id="history-search"
              className="search-input"
              list="history-datalist"
              placeholder="Search stock by name or ticker..."
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
              className="btn-primary"
              style={{ marginTop: '1rem', width: '100%' }}
              onClick={handleFetch}
            >
              View Price History
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div id="history-loading" className="loading-card fade-up visible">
            <div className="loading-spinner"></div>
            <div className="loading-text">Fetching historical prices...</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            id="history-error"
            className="limit-warning"
            style={{ maxWidth: '600px', margin: '0 auto' }}
          >
            {error}
          </div>
        )}

        {/* Chart */}
        {chartData && (
          <div
            id="history-chart-container"
            className="breakdown-card fade-up visible"
            style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}
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
