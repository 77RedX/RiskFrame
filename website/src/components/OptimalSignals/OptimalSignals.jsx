import { useState, useMemo } from 'react';
import { generateOptimalSignals } from '../../data/marketSignals';
import TradeModal from '../Trading/TradeModal';
import './OptimalSignals.css';

export default function OptimalSignals({ isAuthenticated = false, holdings = [], cashBalance = 0, quotes = {}, optimizationResults, onExecuteTrade, onTriggerOptimization, isOptimizing }) {
  const [capital, setCapital] = useState(15000);
  const [trade, setTrade] = useState(null);
  const [message, setMessage] = useState('');
  const [pending, setPending] = useState(false);
  const { buySignals, sellSignals } = useMemo(() => generateOptimalSignals(holdings, optimizationResults, capital, quotes), [holdings, optimizationResults, capital, quotes]);
  const optimize = async () => {
    setMessage(''); setPending(true);
    try { if (await onTriggerOptimization?.()) setMessage('Optimization Complete: Allocations updated from the calculation results.'); }
    finally { setPending(false); }
  };
  return <section id="optimal-signals" aria-labelledby="optimal-signals-heading"><div className="container">
    <span className="section-tag">Step 03 // Model Allocations</span>
    <h2 id="optimal-signals-heading" className="section-title">Model Buy &amp; Sell Proposals</h2>
    <p className="section-subtitle">Research allocations from your latest calculation. Orders are simulated using dated closing prices, not live brokerage execution.</p>
    <div className="signals-control-dock"><div className="dock-left">
      <button className="btn-optimize-signals" disabled={pending || isOptimizing} onClick={optimize}>Optimize According to Stocks</button>
      <div className="capital-picker"><span className="capital-label">Hypothetical capital: ${capital.toLocaleString('en-US')}</span><div className="capital-buttons">{[5000, 10000, 15000, 25000, 50000].map(value => <button className="cap-chip" key={value} aria-pressed={capital === value} onClick={() => setCapital(value)}>${value / 1000}k</button>)}</div></div>
    </div>
    {message && optimizationResults && <p role="status" className="signals-toast">{message}</p>}
    </div>
    {!optimizationResults && <p>Run an optimization to see model allocations. No model recommendations have been calculated yet.</p>}
    <div className="signals-columns-layout">{[['buy', buySignals], ...(isAuthenticated ? [['sell', sellSignals]] : [])].map(([mode, signals]) => <div className={`signals-column ${mode}-col`} key={mode}>
      <h3>{mode === 'buy' ? 'Positive Target Allocations' : 'Holdings With Low Target Allocations'}</h3>
      {signals.map(item => <div className={`signal-card ${mode}-card`} key={item.ticker}>
        <div className="card-header"><strong className="card-ticker">{item.ticker}</strong><span>{item.name}</span></div>
        <p>Target weight: {(item.weight * 100).toFixed(2)}%</p>
        <p>Annualized model return: {item.projectedAlphaPct == null ? 'Not reported' : `${item.projectedAlphaPct >= 0 ? '+' : ''}${Number(item.projectedAlphaPct.toFixed(2))}%`}</p>
        <p>Latest available close: {item.price == null ? 'Unavailable' : `$${item.price.toFixed(2)} · ${item.asOf}`}</p>
        {mode === 'buy' && <p>Hypothetical order: {item.suggestedShares} whole shares</p>}
        {item.heldShares > 0 && <p>Held: {item.heldShares} shares</p>}
        {isAuthenticated && <button className={`btn-zerodha-${mode}`} disabled={item.price == null} onClick={() => setTrade({ ...item, mode })}>{mode.toUpperCase()} {item.ticker}</button>}
      </div>)}
    </div>)}</div>
    {trade && <TradeModal isOpen stock={trade} initialMode={trade.mode} onClose={() => setTrade(null)} cashBalance={cashBalance} heldShares={holdings.find(h => h.ticker === trade.ticker)?.shares ?? 0} avgBuyPrice={holdings.find(h => h.ticker === trade.ticker)?.avgBuyPrice ?? 0} onExecuteTrade={onExecuteTrade} />}
  </div></section>;
}
