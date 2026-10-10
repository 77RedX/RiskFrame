import { useState, useMemo } from 'react';
import { generateOptimalSignals, getStockPrice } from '../../data/marketSignals';
import TradeModal from '../Trading/TradeModal';
import './OptimalSignals.css';

export default function OptimalSignals({
  holdings = [],
  cashBalance = 25000,
  optimizationResults = null,
  onExecuteTrade,
  onTriggerOptimization,
  isOptimizing = false,
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'buy', 'sell'
  const [targetCapital, setTargetCapital] = useState(15000);
  const [selectedStockForTrade, setSelectedStockForTrade] = useState(null);
  const [tradeMode, setTradeMode] = useState('buy');
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [optimizingLocal, setOptimizingLocal] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Generate signals dynamically based on current holdings and optimization results
  const { buySignals, sellSignals } = useMemo(() => {
    return generateOptimalSignals(holdings, optimizationResults, targetCapital);
  }, [holdings, optimizationResults, targetCapital]);

  const handleOpenTrade = (stock, mode) => {
    setSelectedStockForTrade(stock);
    setTradeMode(mode);
    setIsTradeModalOpen(true);
  };

  const handleTradeSuccess = (order) => {
    onExecuteTrade?.(order);
    const msg = order.type === 'BUY'
      ? `🎉 Order Executed: Bought ${order.shares} shares of ${order.ticker} ($${order.total.toLocaleString()}). Added to My Portfolio!`
      : `💸 Order Executed: Sold ${order.shares} shares of ${order.ticker} ($${order.total.toLocaleString()}). Cash balance credited!`;
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const handleRunOptimization = () => {
    setOptimizingLocal(true);
    if (onTriggerOptimization) {
      onTriggerOptimization();
    }
    setTimeout(() => {
      setOptimizingLocal(false);
      setToastMessage('⚡ Algorithmic Optimization Complete: Signals updated to latest market frontier!');
      setTimeout(() => setToastMessage(''), 4000);
    }, 1200);
  };

  return (
    <section id="optimal-signals" aria-labelledby="optimal-signals-heading">
      <div className="container">
        {/* Section Header */}
        <div className="fade-up">
          <span className="section-tag" id="signals-tag">
            Step 03 // Algorithmic Order Flow
          </span>
          <h2 className="section-title" id="optimal-signals-heading">
            Optimal <span className="gradient-text">Buy &amp; Sell Signals</span>
          </h2>
          <p className="section-subtitle">
            Like <strong>Groww &amp; Zerodha</strong>, RiskFrame provides direct execution recommendations—the platform tells you <strong>only which stocks are optimal to buy</strong> and <strong>which stocks are optimal to sell right now</strong> based on Temporal CNN alpha projections and Ledoit-Wolf risk weighting.
          </p>
        </div>

        {/* Toast Notification */}
        {toastMessage && (
          <div className="signals-toast fade-up">
            <span className="toast-icon">✨</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* "Optimize According to Stocks" Control Bar */}
        <div className="signals-control-dock fade-up">
          <div className="dock-left">
            <button
              className={`btn-optimize-signals ${optimizingLocal || isOptimizing ? 'loading' : ''}`}
              onClick={handleRunOptimization}
              disabled={optimizingLocal || isOptimizing}
              title="Run neural alpha inference and solve convex weights to find optimal stocks"
            >
              {optimizingLocal || isOptimizing ? (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    style={{ animation: 'spin 1s linear infinite' }}
                  >
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40" strokeLinecap="round" />
                  </svg>
                  <span>Optimizing According to Stocks…</span>
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="#08080A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="#D4AF37" />
                  </svg>
                  <span>⚡ Optimize According to Stocks</span>
                </>
              )}
            </button>

            {/* Target Capital Selector */}
            <div className="capital-picker">
              <span className="capital-label">Deployable Capital:</span>
              <div className="capital-buttons">
                {[5000, 10000, 25000, 50000].map((amt) => (
                  <button
                    key={amt}
                    className={`cap-chip ${targetCapital === amt ? 'active' : ''}`}
                    onClick={() => setTargetCapital(amt)}
                  >
                    ${(amt / 1000).toFixed(0)}k
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="dock-right">
            <div className="signals-tab-pills" role="tablist">
              <button
                className={`tab-pill ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Signals ({buySignals.length + sellSignals.length})
              </button>
              <button
                className={`tab-pill buy ${activeTab === 'buy' ? 'active' : ''}`}
                onClick={() => setActiveTab('buy')}
              >
                <span className="dot green"></span>
                Optimal Buys ({buySignals.length})
              </button>
              <button
                className={`tab-pill sell ${activeTab === 'sell' ? 'active' : ''}`}
                onClick={() => setActiveTab('sell')}
              >
                <span className="dot red"></span>
                Optimal Sells ({sellSignals.length})
              </button>
            </div>
          </div>
        </div>

        {/* Signals Dual Grid */}
        <div className="signals-columns-layout">
          {/* OPTIMAL BUY SECTION */}
          {(activeTab === 'all' || activeTab === 'buy') && (
            <div className="signals-column buy-col fade-up">
              <div className="column-header buy-header">
                <div className="header-badge green">
                  <span className="pulse-dot green"></span>
                  RECOMMENDED PURCHASES
                </div>
                <h3>Optimal Buying Opportunities</h3>
                <p>Curated stocks with maximum alpha momentum and favorable covariance shrinkage.</p>
              </div>

              <div className="signal-cards-stack">
                {buySignals.map((item) => {
                  const isOwned = item.isCurrentlyHeld;
                  return (
                    <div className="signal-card buy-card" key={item.ticker}>
                      {/* Top Bar */}
                      <div className="card-top-row">
                        <div className="card-identity">
                          <div className="ticker-badge-wrap">
                            <span className="card-ticker">{item.ticker}</span>
                            <span className="card-sector">{item.sector}</span>
                          </div>
                          <span className="card-company-name">{item.name}</span>
                        </div>
                        <div className="card-price-block">
                          <span className="card-live-price">${item.price.toFixed(2)}</span>
                          <span className={`card-change ${item.changePct >= 0 ? 'pos' : 'neg'}`}>
                            {item.changePct >= 0 ? '+' : ''}{item.changePct}%
                          </span>
                        </div>
                      </div>

                      {/* Quantitative Metrics Bar */}
                      <div className="card-metrics-strip">
                        <div className="metric-chip">
                          <span className="chip-label">Neural Alpha</span>
                          <span className="chip-val alpha-pos">+{item.projectedAlphaPct}%</span>
                        </div>
                        <div className="metric-chip">
                          <span className="chip-label">Optimal Weight</span>
                          <span className="chip-val weight-gold">{item.optimalWeightPct}%</span>
                        </div>
                        <div className="metric-chip">
                          <span className="chip-label">Conviction</span>
                          <span className="chip-val score-high">{item.convictionScore}%</span>
                        </div>
                      </div>

                      {/* Rationale */}
                      <p className="card-rationale">
                        <span className="rationale-tag">AI Rationale:</span> {item.rationale}
                      </p>

                      {/* Order Suggestion & BUY CTA */}
                      <div className="card-footer-action">
                        <div className="order-suggestion">
                          <span className="sugg-label">Suggested Order:</span>
                          <span className="sugg-val">
                            {item.suggestedShares} shares (~${item.suggestedAmount.toLocaleString()})
                          </span>
                        </div>

                        <button
                          className="btn-zerodha-buy"
                          onClick={() => handleOpenTrade(item, 'buy')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <span>BUY {item.ticker}</span>
                        </button>
                      </div>

                      {isOwned && (
                        <div className="card-owned-indicator">
                          <span>💼 Already in My Portfolio: {item.heldShares} shares</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* OPTIMAL SELL SECTION */}
          {(activeTab === 'all' || activeTab === 'sell') && (
            <div className="signals-column sell-col fade-up">
              <div className="column-header sell-header">
                <div className="header-badge red">
                  <span className="pulse-dot red"></span>
                  OPTIMAL EXITS &amp; PROFIT HARVESTING
                </div>
                <h3>Optimal Selling Recommendations</h3>
                <p>Identifies holdings ready for profit realization or stocks with downside alpha decay.</p>
              </div>

              <div className="signal-cards-stack">
                {sellSignals.map((item) => {
                  return (
                    <div className={`signal-card sell-card ${item.isPortfolioHolding ? 'holding-highlight' : ''}`} key={item.ticker}>
                      {/* Top Bar */}
                      <div className="card-top-row">
                        <div className="card-identity">
                          <div className="ticker-badge-wrap">
                            <span className="card-ticker">{item.ticker}</span>
                            <span className="card-sector">{item.sector}</span>
                            {item.isPortfolioHolding && (
                              <span className="portfolio-alert-tag">⚡ Current Holding</span>
                            )}
                          </div>
                          <span className="card-company-name">{item.name}</span>
                        </div>
                        <div className="card-price-block">
                          <span className="card-live-price">${item.price.toFixed(2)}</span>
                          <span className={`card-change ${item.changePct >= 0 ? 'pos' : 'neg'}`}>
                            {item.changePct >= 0 ? '+' : ''}{item.changePct}%
                          </span>
                        </div>
                      </div>

                      {/* Sell Details Banner */}
                      <div className="sell-metrics-strip">
                        <div className="sell-urgency-badge">
                          <span>Urgency: <strong>{item.urgency}</strong></span>
                        </div>
                        {item.isPortfolioHolding && item.unrealizedPnlPct !== 0 && (
                          <div className={`sell-pnl-chip ${item.unrealizedPnlPct >= 0 ? 'gain' : 'loss'}`}>
                            <span>
                              {item.unrealizedPnlPct >= 0 ? '▲ Profit: +' : '▼ Loss: '}
                              {item.unrealizedPnlPct}% (${item.unrealizedPnlAmount.toLocaleString()})
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Rationale */}
                      <p className="card-rationale sell">
                        <span className="rationale-tag red">Sell Rationale:</span> {item.rationale}
                      </p>

                      {/* Action Row */}
                      <div className="card-footer-action">
                        <div className="order-suggestion">
                          <span className="sugg-label">Holding Status:</span>
                          <span className="sugg-val">
                            {item.userShares > 0 ? `${item.userShares} shares owned` : '0 shares owned (Avoid / Exit)'}
                          </span>
                        </div>

                        <button
                          className="btn-zerodha-sell"
                          onClick={() => handleOpenTrade(item, 'sell')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                            <path d="M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                          </svg>
                          <span>{item.userShares > 0 ? `SELL ${item.ticker}` : `EXIT / SHORT`}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Trade Execution Modal */}
        {selectedStockForTrade && (
          <TradeModal
            isOpen={isTradeModalOpen}
            onClose={() => setIsTradeModalOpen(false)}
            initialMode={tradeMode}
            stock={selectedStockForTrade}
            cashBalance={cashBalance}
            heldShares={
              holdings.find((h) => h.ticker === selectedStockForTrade.ticker)?.shares || 0
            }
            avgBuyPrice={
              holdings.find((h) => h.ticker === selectedStockForTrade.ticker)?.avgBuyPrice || 0
            }
            onExecuteTrade={handleTradeSuccess}
          />
        )}
      </div>
    </section>
  );
}
