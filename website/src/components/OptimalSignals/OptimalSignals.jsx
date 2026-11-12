import { useState, useMemo } from 'react';
import { generateOptimalSignals } from '../../data/marketSignals';
import TradeModal from '../Trading/TradeModal';
import './OptimalSignals.css';

export default function OptimalSignals({ isAuthenticated = false, holdings = [], cashBalance = 0, quotes = {}, optimizationResults, onExecuteTrade, onTriggerOptimization, isOptimizing, onSignIn }) {
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
    {!optimizationResults && <p className="proposal-empty">Run an optimization to see model allocations. No model recommendations have been calculated yet.</p>}
    {!isAuthenticated && <div className="proposal-account-note"><p>Explore target allocations below. Paper trades use your account's available cash and owned shares.</p><button className="proposal-signin" onClick={onSignIn}>Sign in to paper trade</button></div>}
    <div className={`signals-columns-layout ${isAuthenticated ? '' : 'single-column'}`}>
      {[['buy', buySignals], ...(isAuthenticated ? [['sell', sellSignals]] : [])].map(([mode, signals]) => <div className={`signals-column ${mode}-col`} key={mode}>
        <div className="proposal-group-heading"><h3>{mode === 'buy' ? 'Positive Target Allocations' : 'Holdings With Low Target Allocations'}</h3><span>{signals.length} {signals.length === 1 ? 'asset' : 'assets'}</span></div>
        {optimizationResults && !signals.length && <p className="proposal-empty">{mode === 'sell' ? 'No owned holdings have a low target allocation in this calculation. Unselected holdings are not assessed.' : 'This calculation has no positive target allocations.'}</p>}
        <div className="signal-cards-stack">{signals.map(item => <article className={`signal-card ${mode}-card`} key={item.ticker}>
          <div className="card-header"><strong className="card-ticker">{item.ticker}</strong><span className="proposal-company">{item.name}</span></div>
          <dl className="proposal-facts">
            <div><dt>Target weight</dt><dd>{(item.weight * 100).toFixed(2)}%</dd></div>
            <div><dt>Annualized model return</dt><dd>{item.projectedAlphaPct == null ? 'Not reported' : `${item.projectedAlphaPct >= 0 ? '+' : ''}${Number(item.projectedAlphaPct.toFixed(2))}%`}</dd></div>
          </dl>
          <p className="proposal-quote">Latest available close: <strong>{item.price == null ? 'Unavailable' : `$${item.price.toFixed(2)}`}</strong>{item.price != null && <> | <time dateTime={item.asOf}>{item.asOf}</time></>}</p>
          <div className="proposal-sizing">
            {mode === 'buy' && <p>Hypothetical order: {item.suggestedShares} whole shares</p>}
            {isAuthenticated && <p>Held: {item.heldShares} shares</p>}
          </div>
          {isAuthenticated && <button className={`btn-zerodha-${mode}`} disabled={item.price == null} onClick={() => setTrade({ ...item, mode })}>{mode.toUpperCase()} {item.ticker}</button>}
        </article>)}</div>
      </div>)}
    </div>
    {optimizationResults && <p className="proposal-footnote">Targets describe the modeled basket, not additional shares to trade. Hypothetical sizing excludes your existing holdings; order limits are checked against your paper account.</p>}
    {trade && <TradeModal isOpen stock={trade} initialMode={trade.mode} onClose={() => setTrade(null)} cashBalance={cashBalance} heldShares={holdings.find(h => h.ticker === trade.ticker)?.shares ?? 0} avgBuyPrice={holdings.find(h => h.ticker === trade.ticker)?.avgBuyPrice ?? 0} onExecuteTrade={onExecuteTrade} />}
  </div></section>;
}
