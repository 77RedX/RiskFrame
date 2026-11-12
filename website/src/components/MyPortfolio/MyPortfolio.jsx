import { createPortal } from 'react-dom';
import { useState } from 'react';
import useDialog from '../../hooks/useDialog';
import { getStockPrice } from '../../data/marketSignals';
import TradeModal from '../Trading/TradeModal';
import './MyPortfolio.css';

const money = value => value == null ? 'Unavailable' : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function MyPortfolio({ holdings = [], cashBalance = 0, quotes = {}, optimizationResults, onExecuteTrade, onAddCash }) {
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('value');
  const [trade, setTrade] = useState(null);
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState(10000);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const closeDeposit = () => { if (!saving) setDepositOpen(false); };
  const depositRef = useDialog(depositOpen, closeDeposit);
  const rows = holdings.map(h => {
    const quote = getStockPrice(h.ticker, quotes);
    const cost = h.shares * h.avgBuyPrice;
    const value = quote.price == null ? null : h.shares * quote.price;
    const pnl = value == null ? null : value - cost;
    const weight = optimizationResults?.allocation?.[h.ticker];
    return { ...h, ...quote, cost, value, pnl, pnlPct: pnl == null || !cost ? null : pnl / cost * 100,
      advice: weight == null ? 'Not analyzed' : weight < 0.05 ? 'Rebalance Exit' : 'Model allocation available' };
  });
  const missing = rows.some(h => h.value == null);
  const value = missing ? null : rows.reduce((sum, h) => sum + h.value, 0);
  const cost = rows.reduce((sum, h) => sum + h.cost, 0);
  const change = rows.some(h => h.changeAmount == null) ? null : rows.reduce((sum, h) => sum + h.changeAmount * h.shares, 0);
  const filtered = rows.filter(h => `${h.ticker} ${h.name || ''}`.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === 'ticker' ? a.ticker.localeCompare(b.ticker) : sort === 'shares' ? b.shares - a.shares : sort === 'pnl' ? (b.pnlPct ?? -Infinity) - (a.pnlPct ?? -Infinity) : (b.value ?? -Infinity) - (a.value ?? -Infinity));
  const openTrade = (holding, mode) => setTrade({ ...holding, mode });
  const deposit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true); setError('');
    try { await onAddCash(amount); setDepositOpen(false); }
    catch (error) { setError(error.message); }
    finally { setSaving(false); }
  };
  return <section id="my-portfolio" aria-labelledby="portfolio-heading"><div className="container">
    <span className="section-tag">Simulated Account Ledger</span><h2 className="section-title" id="portfolio-heading">My Portfolio</h2>
    <p className="section-subtitle">Paper holdings valued at the latest available closing prices. No real brokerage orders or cash deposits.</p>
    <div className="portfolio-metrics-grid">
      <div className="port-metric-card"><span className="port-metric-label">Equity Value</span><span className="port-live-dot">PAPER</span><div className="port-metric-main-val">{money(value)}</div><p>{holdings.length} Active Equities</p><p>Cash: {money(cashBalance)}</p></div>
      <div className="port-metric-card"><span className="port-metric-label">Invested Capital</span><div className="port-metric-val">{money(cost)}</div></div>
      <div className="port-metric-card"><span className="port-metric-label">Unrealized Profit &amp; Loss</span><div className="port-metric-val">{money(value == null ? null : value - cost)}</div></div>
      <div className="port-metric-card"><span className="port-metric-label">Change Since Previous Close</span><div className="port-metric-val">{money(change)}</div></div>
    </div>
    {missing && <p role="status">Some historical quotes are unavailable. Valuation and trading for those assets are disabled.</p>}
    <div className="portfolio-toolbar">
      <div className="toolbar-search-wrap"><input className="toolbar-search-input" aria-label="Search portfolio" placeholder="Search holdings" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="toolbar-controls"><select className="sort-select" aria-label="Sort portfolio" value={sort} onChange={e => setSort(e.target.value)}><option value="value">Highest Value</option><option value="pnl">Highest P&amp;L (%)</option><option value="shares">Shares Owned</option><option value="ticker">Ticker Symbol</option></select><button className="btn-toolbar-cash" onClick={() => setDepositOpen(true)}>+ Deposit Cash</button></div>
    </div>
    {!filtered.length ? <div className="portfolio-empty-state"><h4>No Active Stock Holdings Found</h4><p>{holdings.length ? 'No holdings matched your search.' : 'Your portfolio is empty. Add simulated funds and run an optimization to explore paper trades.'}</p></div> : <div className="portfolio-table-wrapper"><table className="portfolio-table"><thead><tr>{['Equity', 'Shares', 'Average Cost', 'Latest Close', 'Current Value', 'Unrealized P&L', 'Equity Weight', 'Model Status', 'Actions'].map(title => <th key={title}>{title}</th>)}</tr></thead><tbody>{filtered.map(h => <tr key={h.ticker}>
      <td><strong>{h.ticker}</strong><div>{h.name}</div></td><td>{h.shares}</td><td>{money(h.avgBuyPrice)}</td><td>{money(h.price)}<div>{h.asOf || 'No quote date'}</div></td><td>{money(h.value)}</td><td>{money(h.pnl)}</td><td>{value > 0 && h.value != null ? `${(h.value / value * 100).toFixed(1)}%` : 'Unavailable'}</td><td>{h.advice}</td><td><div className="holding-actions-group"><button className="btn-holding-buy" disabled={h.price == null} onClick={() => openTrade(h, 'buy')}>+ Buy</button><button className="btn-holding-sell" disabled={h.price == null} onClick={() => openTrade(h, 'sell')}>− Sell</button></div></td>
    </tr>)}</tbody></table></div>}
    {depositOpen && createPortal(<div className="trade-modal-backdrop" onClick={closeDeposit}><div ref={depositRef} role="dialog" aria-modal="true" aria-label="Deposit simulated cash" className="trade-modal-container deposit-container" onClick={e => e.stopPropagation()}>
      <div className="trade-modal-header"><h3>Deposit Simulated Cash</h3><button aria-label="Close deposit dialog" className="trade-modal-close" onClick={closeDeposit}>✕</button></div>
      <form className="deposit-form" onSubmit={deposit}><p className="deposit-desc">Add virtual funds for paper trading. This does not transfer real money.</p><div className="deposit-chips-row">{[5000, 10000, 25000, 50000].map(n => <button type="button" className="dep-chip" key={n} onClick={() => setAmount(n)}>+${n / 1000}k</button>)}</div><label htmlFor="deposit-amount">Custom Amount ($)</label><input className="trade-qty-input custom-dep" id="deposit-amount" type="number" min="100" step="0.01" required value={amount} onChange={e => setAmount(Number(e.target.value))} />{error && <p role="alert">{error}</p>}<button disabled={saving} type="submit" className="trade-execute-btn buy-btn">Deposit {money(amount)} to Cash Balance</button></form>
    </div></div>, document.body)}
    {trade && <TradeModal isOpen stock={trade} initialMode={trade.mode} onClose={() => setTrade(null)} cashBalance={cashBalance} heldShares={trade.shares} avgBuyPrice={trade.avgBuyPrice} onExecuteTrade={onExecuteTrade} />}
  </div></section>;
}
