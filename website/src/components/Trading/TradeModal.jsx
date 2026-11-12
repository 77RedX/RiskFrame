import useDialog from '../../hooks/useDialog';
import { createPortal } from 'react-dom';
import { useState, useEffect } from 'react';
import './TradeModal.css';

export default function TradeModal({
  isOpen,
  onClose,
  initialMode = 'buy', // 'buy' or 'sell'
  stock, // { ticker, name, price, ... }
  cashBalance = 0,
  heldShares = 0,
  avgBuyPrice = 0,
  onExecuteTrade, // (order: { type: 'BUY'|'SELL', ticker, shares, price, total }) => void
}) {
  const [mode, setMode] = useState(initialMode);
  const [quantity, setQuantity] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const close = () => { if (!saving) onClose(); };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      const affordable = stock?.price > 0 ? Math.floor(Math.round(cashBalance * 100) / Math.round(stock.price * 100)) : 0;
      setQuantity(String(initialMode === 'sell' ? heldShares : Math.min(10, affordable)));
      setError('');
    }
  }, [isOpen, initialMode, stock?.ticker]);

  const dialogRef = useDialog(isOpen && Boolean(stock), close);
  if (!isOpen || !stock) return null;

  const price = Number.isFinite(stock.price) ? Math.round(stock.price * 100) / 100 : 0;
  const isBuy = mode === 'buy';
  const maxBuyShares = price > 0 ? Math.max(0, Math.min(1000000, Math.floor(Math.round(cashBalance * 100) / Math.round(price * 100)))) : 0;
  const maxSellShares = Math.max(0, Math.min(1000000, heldShares));
  const limit = isBuy ? maxBuyShares : maxSellShares;
  const shares = Number(quantity);
  const validQuantity = /^\d+$/.test(quantity) && Number.isSafeInteger(shares) && shares >= 1 && shares <= limit;
  const validation = price <= 0 ? 'A verified closing price is required.'
    : !isBuy && !heldShares ? `You do not own any shares of ${stock.ticker} to sell.`
    : isBuy && !maxBuyShares ? 'Insufficient simulated cash to buy one share.'
    : !/^\d+$/.test(quantity) || !Number.isSafeInteger(shares) || shares < 1 ? 'Enter a positive whole number of shares.'
    : shares > limit ? (isBuy ? `You can afford ${limit} shares.` : `You currently own ${heldShares} shares.`) : '';
  const totalAmount = validQuantity ? Math.round(shares * Math.round(price * 100)) / 100 : 0;
  const changeQuantity = value => { setError(''); setQuantity(String(value)); };
  const addShares = amount => changeQuantity(Math.max(limit ? 1 : 0, Math.min(limit, (Number.isFinite(shares) ? shares : 0) + amount)));
  const switchMode = next => {
    setMode(next); setError('');
    setQuantity(String(next === 'sell' ? maxSellShares : Math.min(10, maxBuyShares)));
  };

  const handleSubmit = async (e) => {
    if (saving) { e.preventDefault(); return; }
    e.preventDefault();
    setError('');

    if (validation || !validQuantity) { setError(validation || 'Invalid order quantity.'); return; }

    setSaving(true);
    try { await onExecuteTrade({
      type: isBuy ? 'BUY' : 'SELL',
      ticker: stock.ticker,
      name: stock.name,
      shares,
      price,
      total: totalAmount,
    });

    onClose();
    } catch (error) { setError(error.message); } finally { setSaving(false); }
  };

  // Sell profit preview
  const estimatedProfit = !isBuy && validQuantity && avgBuyPrice > 0
    ? Number(((price - avgBuyPrice) * shares).toFixed(2))
    : 0;
  const estimatedProfitPct = !isBuy && avgBuyPrice > 0
    ? Number((((price - avgBuyPrice) / avgBuyPrice) * 100).toFixed(2))
    : 0;

  return createPortal(
    <div className="trade-modal-backdrop" onClick={close}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-label="Simulated trade" className="trade-modal-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="trade-modal-header">
          <div className="trade-modal-stock-info">
            <div className="trade-stock-ticker-row">
              <span className="trade-ticker">{stock.ticker}</span>
              <span className="trade-exchange-tag">Simulated stock order</span>
            </div>
            <h3 className="trade-stock-name">{stock.name}</h3>
          </div>
          <button className="trade-modal-close" onClick={close} disabled={saving} aria-label="Close trade dialog">
            ✕
          </button>
        </div>

        {/* Live Price Ticker Banner */}
        <div className="trade-price-banner">
          <div className="trade-price-left">
            <span className="trade-price-label">Latest Closing Price</span>
            <span className="trade-price-val">{price > 0 ? `$${price.toFixed(2)}` : 'Unavailable'} <small>{stock.asOf}</small></span>
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
            disabled={saving} onClick={() => switchMode('buy')}
          >
            <span className="tab-dot green"></span>
            BUY (Simulated)
          </button>
          <button
            type="button"
            className={`trade-tab-btn sell ${!isBuy ? 'active' : ''}`}
            disabled={saving} onClick={() => switchMode('sell')}
          >
            <span className="tab-dot red"></span>
            SELL (Simulated)
          </button>
        </div>

        {/* Order Form */}
        <form onSubmit={handleSubmit} className="trade-form">
          {/* Quantity Controls */}
          <div className="trade-form-row">
            <div className="trade-label-with-meta">
              <label className="trade-label" htmlFor="trade-quantity">Shares / Quantity</label>
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
                aria-label="Decrease shares" disabled={saving || shares <= 1 || !limit} onClick={() => addShares(-1)}
              >
                −
              </button>
              <input
                id="trade-quantity" aria-label="Number of shares" type="number"
                min="1"
                step="1" max={limit} disabled={saving} aria-invalid={Boolean(validation)} aria-describedby="trade-quantity-feedback"
                className="trade-qty-input"
                value={quantity}
                onChange={(e) => changeQuantity(e.target.value)}
              />
              <button
                type="button"
                className="trade-qty-stepper"
                aria-label="Increase shares" disabled={saving || shares >= limit || !limit} onClick={() => addShares(1)}
              >
                +
              </button>
            </div>

            {/* Quick Share Preset Chips */}
            <div className="trade-quick-chips">
              <button type="button" disabled={saving || shares >= limit || !limit} onClick={() => addShares(5)}>+5</button>
              <button type="button" disabled={saving || shares >= limit || !limit} onClick={() => addShares(10)}>+10</button>
              <button type="button" disabled={saving || shares >= limit || !limit} onClick={() => addShares(25)}>+25</button>
              <button type="button" disabled={saving || shares >= limit || !limit} onClick={() => addShares(50)}>+50</button>
              <button type="button" className="chip-max" disabled={saving || !limit} onClick={() => changeQuantity(limit)}>
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
                {validQuantity ? `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Unavailable'}
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

          <div id="trade-quantity-feedback" role={error || validation ? 'alert' : undefined} className={error || validation ? 'trade-error-msg' : 'trade-meta-hint'}>{error || validation || `Order limit: ${limit} whole shares`}</div>

          {/* Execute CTA */}
          <button
            type="submit"
            disabled={saving || Boolean(validation) || !validQuantity}
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
              {isBuy ? `BUY ${stock.ticker}` : `SELL ${stock.ticker}`} • {validQuantity ? `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Unavailable'}
            </span>
          </button>
        </form>

        <div className="trade-modal-footer">
          <span>Paper trading only | No broker connection</span>
          <span>No real money transferred</span>
        </div>
      </div>
    </div>, document.body
  );
}
