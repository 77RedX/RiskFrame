export function sharpeLabel(s) {
  if (s >= 2.0) return { cls: 'excellent', text: 'Institutional Grade // Sharpe ≥ 2.0' };
  if (s >= 1.0) return { cls: 'excellent', text: 'Superior Alpha // Sharpe ≥ 1.0' };
  if (s >= 0.5) return { cls: 'good',      text: 'Moderate Risk-Adjusted // Sharpe ≥ 0.5' };
  if (s >= 0.0) return { cls: 'average',   text: 'Suboptimal Efficiency // Sharpe < 0.5' };
  return              { cls: 'poor',       text: 'Negative Excess Alpha' };
}

export default function SharpeBadge({ sharpeRatio, meta }) {
  const ql = sharpeLabel(sharpeRatio);

  return (
    <div className="sharpe-badge-row fade-up">
      <div className={`sharpe-badge ${ql.cls}`} id="sharpe-badge">
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
            display: 'inline-block',
          }}
        />
        {ql.text}
      </div>
      <span className="results-meta" id="results-meta">
        {meta}
      </span>
    </div>
  );
}
