import { COMPANY_MAP } from '../../data/stocks';

export default function BreakdownTable({ data }) {
  if (!data) return null;

  const { allocation, ai_predictions, individual_metrics } = data;
  const tickers = Object.keys(allocation);

  // Sort by allocated weight descending
  const sortedTickers = [...tickers].sort((a, b) => allocation[b] - allocation[a]);

  return (
    <div className="breakdown-card fade-up">
      <div className="breakdown-header">
        <h3 className="breakdown-title">Optimal Asset Weights &amp; Risk Contribution</h3>
        <span className="breakdown-note" id="breakdown-note">
          Ledoit-Wolf Convex Solution // Neural Projections
        </span>
      </div>
      <div className="table-wrap">
        <table className="breakdown-table" id="breakdown-table" aria-label="Individual stock metrics">
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Asset Name</th>
              <th>Optimal Weight</th>
              <th>Neural Alpha (21D)</th>
              <th>Historical Return</th>
              <th>Historical Vol</th>
              <th>Sharpe (Hist)</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody id="breakdown-tbody">
            {sortedTickers.map((ticker, idx) => {
              const weight = allocation[ticker] || 0;
              const aiPred = ai_predictions[ticker] || 0;
              const metrics = individual_metrics ? individual_metrics[ticker] : null;

              const wPct = (weight * 100).toFixed(2);
              const aiPredPct = (aiPred * 100).toFixed(2);
              const aiPredCls = aiPred >= 0 ? 'positive' : 'negative';

              let histRetStr = '—';
              let histVolStr = '—';
              let histSharpeStr = '—';
              let histRetCls = 'na';
              let histSharpeCls = 'na';

              if (metrics) {
                const histRet = (metrics.historical_return * 100).toFixed(2);
                histRetStr = `${metrics.historical_return >= 0 ? '+' : ''}${histRet}%`;
                histRetCls = metrics.historical_return >= 0 ? 'positive' : 'negative';

                histVolStr = `${(metrics.historical_volatility * 100).toFixed(2)}%`;

                const sVal = metrics.historical_sharpe.toFixed(3);
                histSharpeStr = sVal;
                histSharpeCls =
                  metrics.historical_sharpe >= 1
                    ? 'excellent'
                    : metrics.historical_sharpe >= 0.5
                    ? 'good'
                    : 'poor';
              }

              return (
                <tr key={ticker} style={{ animationDelay: `${idx * 25}ms` }}>
                  <td className="td-ticker">{ticker}</td>
                  <td className="td-company">{COMPANY_MAP[ticker] || '—'}</td>
                  <td className="td-weight" style={{ color: weight >= 0.1 ? '#D4AF37' : '#FFFFFF' }}>
                    {wPct}%
                  </td>
                  <td className={`td-return ${aiPredCls}`}>
                    {aiPred >= 0 ? '+' : ''}
                    {aiPredPct}%
                  </td>
                  <td className={`td-return ${histRetCls}`}>{histRetStr}</td>
                  <td className="td-vol">{histVolStr}</td>
                  <td className={`td-sharpe ${histSharpeCls}`}>{histSharpeStr}</td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        background: 'rgba(46, 229, 157, 0.08)',
                        color: '#2EE59D',
                        border: '1px solid rgba(46, 229, 157, 0.2)',
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#2EE59D' }}></span>
                      Optimal
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
