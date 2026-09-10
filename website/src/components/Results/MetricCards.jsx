import { useEffect, useRef } from 'react';

function animateValue(el, value, suffix, decimals, duration = 1000) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = (value * e).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function MetricCard({ icon, value, suffix, decimals, label, desc, colorClass, isNegative, id }) {
  const valueRef = useRef(null);

  useEffect(() => {
    if (valueRef.current && value !== null && value !== undefined) {
      animateValue(valueRef.current, value, suffix, decimals);
    }
  }, [value, suffix, decimals]);

  return (
    <div className={`metric-card ${colorClass}`} role="listitem" id={id}>
      <div className="metric-icon" aria-hidden="true">
        {icon}
      </div>
      <div
        className={`metric-value${isNegative ? ' negative' : ''}`}
        ref={valueRef}
        id={`metric-${id?.replace('card-', '')}`}
      >
        —
      </div>
      <div className="metric-label">{label}</div>
      <p className="metric-desc">{desc}</p>
    </div>
  );
}

export default function MetricCards({ metrics }) {
  if (!metrics) return null;

  const { expected_return, volatility, sharpe_ratio } = metrics;

  return (
    <div className="results-grid" role="list" id="results-metric-grid">
      <MetricCard
        icon="📈"
        value={expected_return * 100}
        suffix="%"
        decimals={2}
        label="Annualized Return"
        desc="AI-optimized portfolio expected annual return based on Neural Network predictions."
        colorClass="blue"
        isNegative={expected_return < 0}
        id="card-return"
      />
      <MetricCard
        icon="🛡️"
        value={volatility * 100}
        suffix="%"
        decimals={2}
        label="Annualized Volatility"
        desc="Portfolio risk — annualized standard deviation of daily returns."
        colorClass="green"
        isNegative={false}
        id="card-vol"
      />
      <MetricCard
        icon="⭐"
        value={sharpe_ratio}
        suffix=""
        decimals={3}
        label="Sharpe Ratio"
        desc="Risk-adjusted return (4% risk-free rate). > 1.0 is considered excellent."
        colorClass="purple"
        isNegative={sharpe_ratio < 0}
        id="card-sharpe"
      />
    </div>
  );
}
