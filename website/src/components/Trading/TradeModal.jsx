import { useState, useEffect } from 'react';
import './TradeModal.css';

export default function TradeModal({
  isOpen,
  onClose,
  initialMode = 'buy', // 'buy' or 'sell'
  stock, // { ticker, name, price, ... }
  cashBalance = 25000,
  heldShares = 0,
  avgBuyPrice = 0,
  onExecuteTrade, // (order: { type: 'BUY'|'SELL', ticker, shares, price, total }) => void
}) {
  const [mode, setMode] = useState(initialMode);
  const [shares, setShares] = useState(10);
  const [orderType, setOrderType] = useState('DELIVERY'); // 'DELIVERY' or 'INTRADAY'
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setShares(initialMode === 'sell' && heldShares > 0 ? heldShares : 10);
      setError('');
    }
  }, [isOpen, initialMode, heldShares]);

  if (!isOpen || !stock) return null;

  const price = stock.price || 100;
  const totalAmount = Number((shares * price).toFixed(2));
  const isBuy = mode === 'buy';

  const maxBuyShares = Math.floor(cashBalance / price);
  const maxSellShares = heldShares;

  const handleSharesChange = (val) => {
    setError('');
    const num = parseInt(val, 10);
    if (isNaN(num) || num < 1) {
      setShares(1);
    } else {
      setShares(num);
    }
  };

  const handlePresetAdd = (amount) => {
    setError('');
    setShares((prev) => Math.max(1, prev + amount));
  };

  const handleSetMax = () => {
    setError('');
    if (isBuy) {
      setShares(Math.max(1, maxBuyShares));
    } else {
      setShares(Math.max(1, maxSellShares));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (shares <= 0) {
      setError('Please select at least 1 share.');
      return;
    }

    if (isBuy) {
      if (totalAmount > cashBalance) {
        setError(`Insufficient funds. Available: $${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        return;
      }
    } else {
      if (heldShares <= 0) {
        setError(`You do not own any shares of ${stock.ticker} in your portfolio to sell.`);
        return;
      }
      if (shares > heldShares) {
        setError(`Cannot sell ${shares} shares. You currently own ${heldShares} shares.`);
        return;
      }
    }

    onExecuteTrade({
      type: isBuy ? 'BUY' : 'SELL',
      ticker: stock.ticker,
      name: stock.name,
      shares,
      price,
      total: totalAmount,
      orderType,
    });

    onClose();
  };

  // Sell profit preview
  const estimatedProfit = !isBuy && avgBuyPrice > 0
    ? Number(((price - avgBuyPrice) * shares).toFixed(2))
    : 0;
  const estimatedProfitPct = !isBuy && avgBuyPrice > 0
    ? Number((((price - avgBuyPrice) / avgBuyPrice) * 100).toFixed(2))
    : 0;

  return (
    <div className="trade-modal-backdrop" onClick={onClose}>
      <div className="trade-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="trade-modal-header">
          <div className="trade-modal-stock-info">
            <div className="trade-stock-ticker-row">
              <span className="trade-ticker">{stock.ticker}</span>
              <span className="trade-exchange-tag">S&P 500 • Groww/Zerodha Execution</span>
            </div>
            <h3 className="trade-stock-name">{stock.name}</h3>
          </div>
          <button className="trade-modal-close" onClick={onClose} aria-label="Close trade dialog">
            ✕
          </button>
        </div>

        {/* Live Price Ticker Banner */}
        <div className="trade-price-banner">
          <div className="trade-price-left">
            <span className="trade-price-label">Market Price</span>
            <span className="trade-price-val">${price.toFixed(2)}</span>
          </div>
          <div className="trade-price-right">
            <span className={`trade-change-badge ${stock.changePct >= 0 ? 'pos' : 'neg'}`}>
              {stock.changePct >= 0 ? '▲ +' : '▼ '}
              {Math.abs(stock.changePct || 0).toFixed(2)}%
            </span>
          </div>
        </div>

        {/* Buy / Sell Tab Switcher */}
        <div className="trade-tabs-switch">
          <button
            type="button"
            className={`trade-tab-btn buy ${isBuy ? 'active' : ''}`}
            onClick={() => {
              setMode('buy');
              setError('');
            }}
          >
            <span className="tab-dot green"></span>
            BUY (Optimal Entry)
          </button>
          <button
            type="button"
            className={`trade-tab-btn sell ${!isBuy ? 'active' : ''}`}
            onClick={() => {
              setMode('sell');
              setError('');
              if (heldShares > 0) setShares(heldShares);
            }}
          >
            <span className="tab-dot red"></span>
            SELL (Optimal Exit)
          </button>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="trade-form">
          {/* Order Type Toggle */}
          <div className="trade-form-row">
            <label className="trade-label">Order Type</label>
            <div className="trade-pill-group">
              <button
                type="button"
                className={`trade-pill-btn ${orderType === 'DELIVERY' ? 'active' : ''}`}
                onClick={() => setOrderType('DELIVERY')}
              >
                Delivery (Long Term CNC)
              </button>
              <button
                type="button"
                className={`trade-pill-btn ${orderType === 'INTRADAY' ? 'active' : ''}`}
                onClick={() => setOrderType('INTRADAY')}
              >
                Intraday (MIS)
              </button>
            </div>
          </div>

          {/* Quantity Controls */}
          <div className="trade-form-row">
            <div className="trade-label-with-meta">
              <label className="trade-label">Shares / Quantity</label>
              <span className="trade-meta-hint">
                {isBuy
                  ? `Max Affordable: ${maxBuyShares} shares`
                  : `Portfolio Holding: ${heldShares} shares`}
              </span>
            </div>

            <div className="trade-qty-control">
              <button
                type="button"
                className="trade-qty-stepper"
                onClick={() => setShares((s) => Math.max(1, s - 1))}
              >
                −
              </button>
              <input
                type="number"
                min="1"
                step="1"
                className="trade-qty-input"
                value={shares}
                onChange={(e) => handleSharesChange(e.target.value)}
              />
              <button
                type="button"
                className="trade-qty-stepper"
                onClick={() => setShares((s) => s + 1)}
              >
                +
              </button>
            </div>

            {/* Quick Share Preset Chips */}
            <div className="trade-quick-chips">
              <button type="button" onClick={() => handlePresetAdd(5)}>+5</button>
              <button type="button" onClick={() => handlePresetAdd(10)}>+10</button>
              <button type="button" onClick={() => handlePresetAdd(25)}>+25</button>
              <button type="button" onClick={() => handlePresetAdd(50)}>+50</button>
              <button type="button" className="chip-max" onClick={handleSetMax}>
                MAX ({isBuy ? maxBuyShares : maxSellShares})
              </button>
            </div>
          </div>

          {/* Pricing & Balances Breakdown */}
          <div className="trade-breakdown-card">
            <div className="breakdown-row">
              <span>Price per Share</span>
              <span className="breakdown-val">${price.toFixed(2)}</span>
            </div>
            <div className="breakdown-row">
              <span>Quantity</span>
              <span className="breakdown-val">{shares} Shares</span>
            </div>
            <div className="breakdown-divider"></div>
            <div className="breakdown-row total">
              <span>Estimated Order Value</span>
              <span className={`breakdown-val total ${isBuy ? 'text-green' : 'text-red'}`}>
                ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Context Details */}
            {isBuy ? (
              <div className="breakdown-row balance">
                <span>Available Cash Balance</span>
                <span className={`breakdown-val ${cashBalance < totalAmount ? 'text-warn' : ''}`}>
                  ${cashBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            ) : (
              heldShares > 0 && (
                <>
                  <div className="breakdown-row">
                    <span>Avg Purchase Cost</span>
                    <span className="breakdown-val">${avgBuyPrice.toFixed(2)}</span>
                  </div>
                  <div className="breakdown-row">
                    <span>Estimated Realized P&L</span>
                    <span className={`breakdown-val ${estimatedProfit >= 0 ? 'text-green' : 'text-red'}`}>
                      {estimatedProfit >= 0 ? '+' : ''}${estimatedProfit.toFixed(2)} ({estimatedProfitPct >= 0 ? '+' : ''}{estimatedProfitPct}%)
                    </span>
                  </div>
                </>
              )
            )}
          </div>

          {error && <div className="trade-error-msg">{error}</div>}

          {/* Execute CTA */}
          <button
            type="submit"
            className={`trade-execute-btn ${isBuy ? 'buy-btn' : 'sell-btn'}`}
          >
            <span className="trade-btn-icon">
              {isBuy ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              )}
            </span>
            <span>
              {isBuy ? `BUY ${stock.ticker}` : `SELL ${stock.ticker}`} • ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </button>
        </form>

        <div className="trade-modal-footer">
          <span>⚡ Simulated Zerodha / Groww Instant Settlement API</span>
          <span>Zero Commission • 100% Capital Reserve</span>
        </div>
      </div>
    </div>
  );
}
