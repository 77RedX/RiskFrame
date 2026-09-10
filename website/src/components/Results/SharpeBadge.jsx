export function sharpeLabel(s) {
  if (s >= 2.0) return { cls: 'excellent', text: '🏆 Excellent (≥ 2.0)' };
  if (s >= 1.0) return { cls: 'excellent', text: '⭐ Very Good (≥ 1.0)' };
  if (s >= 0.5) return { cls: 'good',      text: '👍 Good (≥ 0.5)' };
  if (s >= 0.0) return { cls: 'average',   text: '➡️ Below Average' };
  return              { cls: 'poor',       text: '⚠️ Negative Sharpe' };
}

export default function SharpeBadge({ sharpeRatio, meta }) {
  const ql = sharpeLabel(sharpeRatio);

  return (
    <div className="sharpe-badge-row fade-up">
      <div className={`sharpe-badge ${ql.cls}`} id="sharpe-badge">
        {ql.text}
      </div>
      <span className="results-meta" id="results-meta">
        {meta}
      </span>
    </div>
  );
}
