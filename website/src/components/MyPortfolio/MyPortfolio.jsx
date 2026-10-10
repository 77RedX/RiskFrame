import { useState, useMemo } from 'react';
import { getStockPrice } from '../../data/marketSignals';
import TradeModal from '../Trading/TradeModal';
import './MyPortfolio.css';

export default function MyPortfolio({
  holdings = [],
  cashBalance = 25000,
  optimizationResults = null,
  onExecuteTrade,
  onResetHoldings,
  onAddCash,
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('value'); // 'value', 'pnl', 'shares', 'ticker'
  const [selectedHoldingForTrade, setSelectedHoldingForTrade] = useState(null);
  const [tradeMode, setTradeMode] = useState('buy');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState(10000);

  // Compute live valuation and P&L for every holding
  const evaluatedHoldings = useMemo(() => {
    return holdings.map((h) => {
      const market = getStockPrice(h.ticker);
      const investedValue = Number((h.shares * h.avgBuyPrice).toFixed(2));
      const currentValue = Number((h.shares * market.price).toFixed(2));
      const pnlAmount = Number((currentValue - investedValue).toFixed(2));
      const pnlPct = investedValue > 0 ? Number(((pnlAmount / investedValue) * 100).toFixed(2)) : 0;
      const dayReturn = Number(((market.changeAmount || 0) * h.shares).toFixed(2));

      // Model advisory based on optimization results
      const optimalWeight = optimizationResults?.allocation?.[h.ticker] || null;

      let advisory = { label: 'Optimal Hold', type: 'hold' };
      if (pnlPct >= 20) {
        advisory = { label: 'Take Profit / Trim', type: 'trim' };
      } else if (optimalWeight !== null && optimalWeight < 0.05) {
        advisory = { label: 'Rebalance Exit', type: 'sell' };
      } else if (optimalWeight !== null && optimalWeight >= 0.20) {
        advisory = { label: 'Optimal Heavy Weight', type: 'buy-more' };
      }

      return {
        ...h,
        currentPrice: market.price,
        changePct: market.changePct,
        changeAmount: market.changeAmount,
        investedValue,
        currentValue,
        pnlAmount,
        pnlPct,
        dayReturn,
        advisory,
        optimalWeight,
      };
    });
  }, [holdings, optimizationResults]);

  // Aggregate Portfolio Totals
  const totalInvested = useMemo(() => {
    return evaluatedHoldings.reduce((sum, h) => sum + h.investedValue, 0);
  }, [evaluatedHoldings]);

  const totalCurrentValue = useMemo(() => {
    return evaluatedHoldings.reduce((sum, h) => sum + h.currentValue, 0);
  }, [evaluatedHoldings]);

  const totalPnlAmount = Number((totalCurrentValue - totalInvested).toFixed(2));
  const totalPnlPct = totalInvested > 0 ? Number(((totalPnlAmount / totalInvested) * 100).toFixed(2)) : 0;

  const totalDayReturn = Number(
    evaluatedHoldings.reduce((sum, h) => sum + h.dayReturn, 0).toFixed(2)
  );

  // Filter & Sort
  const filteredHoldings = useMemo(() => {
    let result = evaluatedHoldings.filter((h) => {
      const q = searchTerm.trim().toLowerCase();
      if (!q) return true;
      return (
        h.ticker.toLowerCase().includes(q) ||
        (h.name && h.name.toLowerCase().includes(q)) ||
        (h.sector && h.sector.toLowerCase().includes(q))
      );
    });

    if (sortBy === 'value') {
      result.sort((a, b) => b.currentValue - a.currentValue);
    } else if (sortBy === 'pnl') {
      result.sort((a, b) => b.pnlPct - a.pnlPct);
    } else if (sortBy === 'shares') {
      result.sort((a, b) => b.shares - a.shares);
    } else if (sortBy === 'ticker') {
      result.sort((a, b) => a.ticker.localeCompare(b.ticker));
    }

    return result;
  }, [evaluatedHoldings, searchTerm, sortBy]);

  const handleOpenTrade = (holding, mode) => {
    setSelectedHoldingForTrade({
      ticker: holding.ticker,
      name: holding.name,
      price: holding.currentPrice,
      changePct: holding.changePct,
    });
    setTradeMode(mode);
    setIsTradeModalOpen(true);
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    if (depositAmount > 0 && onAddCash) {
      onAddCash(depositAmount);
      setIsDepositModalOpen(false);
    }
  };

  return (
    <section id="my-portfolio" aria-labelledby="portfolio-heading">
      <div className="container">
        {/* Section Header */}
        <div className="fade-up">
          <span className="section-tag" id="portfolio-tag">
            Ledger // Active Holdings
          </span>
          <h2 className="section-title" id="portfolio-heading">
            My <span className="gradient-text">Portfolio</span>
          </h2>
          <p className="section-subtitle">
            Reflecting all currently bought assets, real-time unrealized capital returns, and live liquidation values. Buy more shares or execute optimal exits directly from this ledger.
          </p>
        </div>

        {/* Portfolio Summary Overview Cards (Groww & Zerodha Style) */}
        <div className="portfolio-metrics-grid fade-up">
          {/* Current Value Card */}
          <div className="port-metric-card primary-card">
            <div className="port-card-top">
              <span className="port-metric-label">Total Portfolio Value</span>
              <span className="port-live-dot">LIVE</span>
            </div>
            <div className="port-metric-main-val">
              ${totalCurrentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="port-card-footer">
              <span>{holdings.length} Active Equities</span>
              <span className="cash-avail-tag">
                Cash: ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Invested Capital Card */}
          <div className="port-metric-card">
            <span className="port-metric-label">Invested Capital</span>
            <div className="port-metric-val">
              ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="port-card-sub">
              <span>Cost basis across all acquisitions</span>
            </div>
          </div>

          {/* Total Returns (P&L) */}
          <div className="port-metric-card">
            <span className="port-metric-label">Total Profit &amp; Loss</span>
            <div className={`port-metric-val ${totalPnlAmount >= 0 ? 'text-green' : 'text-red'}`}>
              {totalPnlAmount >= 0 ? '+$' : '-$'}
              {Math.abs(totalPnlAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="port-card-sub">
              <span className={`pnl-pill-badge ${totalPnlPct >= 0 ? 'green' : 'red'}`}>
                {totalPnlPct >= 0 ? '▲ +' : '▼ '}
                {totalPnlPct}% Total Return
              </span>
            </div>
          </div>

          {/* 1-Day Returns */}
          <div className="port-metric-card">
            <span className="port-metric-label">Today's P&amp;L</span>
            <div className={`port-metric-val ${totalDayReturn >= 0 ? 'text-green' : 'text-red'}`}>
              {totalDayReturn >= 0 ? '+$' : '-$'}
              {Math.abs(totalDayReturn).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="port-card-sub">
              <span>Daily cross-sectional drift</span>
            </div>
          </div>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="portfolio-toolbar fade-up">
          <div className="toolbar-search-wrap">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" className="tb-search-icon">
              <path d="M7 12C9.76142 12 12 9.76142 12 7C12 4.23858 9.76142 2 7 2C4.23858 2 2 4.23858 2 7C2 9.76142 4.23858 12 7 12Z" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              <path d="M14 14L10.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className="toolbar-search-input"
              placeholder="Search bought stocks in portfolio…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="toolbar-controls">
            <div className="sort-group">
              <span className="sort-label">Sort By:</span>
              <select
                className="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="value">Highest Value</option>
                <option value="pnl">Highest P&amp;L (%)</option>
                <option value="shares">Shares Owned</option>
                <option value="ticker">Ticker Symbol</option>
              </select>
            </div>

            <button
              className="btn-toolbar-cash"
              onClick={() => setIsDepositModalOpen(true)}
              title="Add simulated funds to trading balance"
            >
              + Deposit Cash
            </button>

            <button
              className="btn-toolbar-reset"
              onClick={onResetHoldings}
              title="Restore initial 5-stock demo portfolio"
            >
              ↺ Reset Portfolio
            </button>
          </div>
        </div>

        {/* Holdings Table */}
        {filteredHoldings.length === 0 ? (
          <div className="portfolio-empty-state fade-up">
            <div className="empty-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="14" rx="3" stroke="#D4AF37" strokeWidth="1.8"/>
                <path d="M3 10H21" stroke="#D4AF37" strokeWidth="1.8"/>
                <circle cx="8" cy="14" r="1.5" fill="#2EE59D"/>
                <path d="M16 14H12" stroke="#EAE0CE" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <h4>No Active Stock Holdings Found</h4>
            <p>
              {holdings.length === 0
                ? 'Your ledger is currently empty. Use the Optimal Buy Signals section above to execute your first algorithmic purchase.'
                : 'No stocks matched your search query.'}
            </p>
            {holdings.length === 0 && (
              <a href="#optimal-signals" className="btn-empty-explore">
                <span>Explore Optimal Buys ↗</span>
              </a>
            )}
          </div>
        ) : (
          <div className="portfolio-table-wrapper fade-up">
            <table className="portfolio-table">
              <thead>
                <tr>
                  <th>Equity Asset</th>
                  <th>Shares</th>
                  <th>Avg Cost</th>
                  <th>Market Price</th>
                  <th>Invested</th>
                  <th>Current Value</th>
                  <th>Unrealized P&amp;L</th>
                  <th>Weight</th>
                  <th>Signal Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredHoldings.map((h, idx) => {
                  const weightPct = totalCurrentValue > 0
                    ? Number(((h.currentValue / totalCurrentValue) * 100).toFixed(1))
                    : 0;

                  return (
                    <tr key={h.ticker} style={{ animationDelay: `${idx * 30}ms` }}>
                      {/* Asset & Name */}
                      <td className="td-asset">
                        <div className="holding-name-wrap">
                          <span className="holding-ticker">{h.ticker}</span>
                          <span className="holding-company">{h.name || h.ticker}</span>
                        </div>
                      </td>

                      {/* Shares */}
                      <td className="td-mono bold">{h.shares}</td>

                      {/* Avg Cost */}
                      <td className="td-mono">${h.avgBuyPrice.toFixed(2)}</td>

                      {/* Current Market Price */}
                      <td className="td-mono">
                        <div className="curr-price-cell">
                          <span>${h.currentPrice.toFixed(2)}</span>
                          <span className={`micro-change ${h.changePct >= 0 ? 'pos' : 'neg'}`}>
                            {h.changePct >= 0 ? '+' : ''}{h.changePct}%
                          </span>
                        </div>
                      </td>

                      {/* Invested */}
                      <td className="td-mono">${h.investedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>

                      {/* Current Value */}
                      <td className="td-mono bold text-gold">
                        ${h.currentValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>

                      {/* P&L */}
                      <td className="td-pnl">
                        <div className={`pnl-cell ${h.pnlAmount >= 0 ? 'pos' : 'neg'}`}>
                          <span className="pnl-amount">
                            {h.pnlAmount >= 0 ? '+$' : '-$'}
                            {Math.abs(h.pnlAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="pnl-pct">
                            ({h.pnlPct >= 0 ? '+' : ''}{h.pnlPct}%)
                          </span>
                        </div>
                      </td>

                      {/* Portfolio Weight */}
                      <td className="td-weight-cell">
                        <div className="weight-progress-box">
                          <span className="weight-num">{weightPct}%</span>
                          <div className="weight-bar-bg">
                            <div className="weight-bar-fill" style={{ width: `${Math.min(100, weightPct * 2.5)}%` }}></div>
                          </div>
                        </div>
                      </td>

                      {/* Signal Status */}
                      <td>
                        <span className={`advisory-tag ${h.advisory.type}`}>
                          {h.advisory.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="td-actions">
                        <div className="holding-actions-group">
                          <button
                            className="btn-holding-buy"
                            onClick={() => handleOpenTrade(h, 'buy')}
                            title="Buy more shares of this stock"
                          >
                            + Buy
                          </button>
                          <button
                            className="btn-holding-sell"
                            onClick={() => handleOpenTrade(h, 'sell')}
                            title="Sell shares of this stock"
                          >
                            − Sell
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Deposit Cash Modal */}
        {isDepositModalOpen && (
          <div className="trade-modal-backdrop" onClick={() => setIsDepositModalOpen(false)}>
            <div className="trade-modal-container deposit-container" onClick={(e) => e.stopPropagation()}>
              <div className="trade-modal-header">
                <h3>Deposit Simulated Cash</h3>
                <button className="trade-modal-close" onClick={() => setIsDepositModalOpen(false)}>✕</button>
              </div>
              <form onSubmit={handleDepositSubmit} className="deposit-form">
                <p className="deposit-desc">Add virtual trading capital to simulate large institutional rebalancing or test buy orders.</p>
                <div className="deposit-chips-row">
                  {[5000, 10000, 25000, 50000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      className={`dep-chip ${depositAmount === amt ? 'active' : ''}`}
                      onClick={() => setDepositAmount(amt)}
                    >
                      +${(amt / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
                <div className="deposit-input-row">
                  <label>Custom Amount ($)</label>
                  <input
                    type="number"
                    min="100"
                    step="500"
                    className="trade-qty-input custom-dep"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                  />
                </div>
                <button type="submit" className="trade-execute-btn buy-btn">
                  Deposit ${depositAmount.toLocaleString()} to Cash Balance
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Trade Modal */}
        {selectedHoldingForTrade && (
          <TradeModal
            isOpen={isTradeModalOpen}
            onClose={() => setIsTradeModalOpen(false)}
            initialMode={tradeMode}
            stock={selectedHoldingForTrade}
            cashBalance={cashBalance}
            heldShares={
              holdings.find((h) => h.ticker === selectedHoldingForTrade.ticker)?.shares || 0
            }
            avgBuyPrice={
              holdings.find((h) => h.ticker === selectedHoldingForTrade.ticker)?.avgBuyPrice || 0
            }
            onExecuteTrade={onExecuteTrade}
          />
        )}
      </div>
    </section>
  );
}
