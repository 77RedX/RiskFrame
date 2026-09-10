import { useEffect, useRef } from 'react';

function animateValue(el, value, suffix, decimals, duration = 900) {
  const start = performance.now();
  const update = (now) => {
    const t = Math.min((now - start) / duration, 1);
    const e = 1 - Math.pow(1 - t, 3);
    el.textContent = (value * e).toFixed(decimals) + suffix;
    if (t < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

function MetricCard({ svgIcon, value, suffix, decimals, label, desc, highlightClass, isNegative, id }) {
  const valueRef = useRef(null);

  useEffect(() => {
    if (valueRef.current && value !== null && value !== undefined) {
      animateValue(valueRef.current, value, suffix, decimals);
    }
  }, [value, suffix, decimals]);

  return (
    <div className="metric-card" role="listitem" id={id}>
      <div className="metric-icon-box" aria-hidden="true">
        {svgIcon}
      </div>
      <div
        className={`metric-value ${highlightClass} ${isNegative ? 'negative' : ''}`}
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
        svgIcon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 17L9 11L13 15L21 7M21 7H15M21 7V13"
              stroke="#D4AF37"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        value={expected_return * 100}
        suffix="%"
        decimals={2}
        label="Expected Annualized Return"
        desc="Deep Learning neural network projection annualized over a 252 trading-day horizon."
        highlightClass="highlight-gold"
        isNegative={expected_return < 0}
        id="card-return"
      />

      <MetricCard
        svgIcon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
              stroke="#EAE0CE"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        value={volatility * 100}
        suffix="%"
        decimals={2}
        label="Portfolio Volatility"
        desc="Ledoit-Wolf shrunk covariance matrix standard deviation for downside containment."
        highlightClass=""
        isNegative={false}
        id="card-vol"
      />

      <MetricCard
        svgIcon={
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              stroke="#2EE59D"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        value={sharpe_ratio}
        suffix=""
        decimals={3}
        label="Sharpe Efficiency Ratio"
        desc="Risk-adjusted alpha ratio relative to 4.0% risk-free rate threshold."
        highlightClass="highlight-mint"
        isNegative={sharpe_ratio < 0}
        id="card-sharpe"
      />
    </div>
  );
}
