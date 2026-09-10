import { useCallback } from 'react';

export default function Hero() {
  const smoothScroll = useCallback((e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 90,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <section id="hero" aria-labelledby="hero-heading">
      <div className="hero-grid-ambient" aria-hidden="true"></div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-eyebrow" aria-label="Platform Architecture">
            <span className="status-dot-pulse" aria-hidden="true"></span>
            <span>Quantitative Asset Allocation // S&P 500</span>
          </div>

          <h1 className="hero-title" id="hero-heading">
            Risk<span className="gradient-text">Frame</span>
            <span className="hero-title-subtext">Precision Quantitative Intelligence</span>
          </h1>

          <p className="hero-desc">
            Select from <strong>174 S&P 500 assets</strong>. Our deep learning Temporal CNN predicts forward alpha trajectories, while <strong>Ledoit-Wolf covariance shrinkage</strong> and Modern Portfolio Theory calculate mathematically optimal Sharpe ratios.
          </p>

          <div className="hero-actions">
            <a
              href="#stock-selector"
              className="btn-luxury-primary"
              id="hero-start-btn"
              onClick={(e) => smoothScroll(e, '#stock-selector')}
            >
              <span>Engineer Portfolio</span>
              <span className="btn-icon-capsule" aria-hidden="true">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2.5 11.5L11.5 2.5M11.5 2.5H5.5M11.5 2.5V8.5"
                    stroke="#08080A"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>

            <a
              href="https://github.com/77RedX/RiskFrame"
              target="_blank"
              rel="noopener"
              className="btn-luxury-secondary"
              id="hero-github-btn"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
              </svg>
              <span>Explore Source</span>
            </a>
          </div>

          <div className="hero-stats" aria-label="Quantitative specifications">
            <div className="hero-stat-chip">
              <div className="stat-value">174</div>
              <div className="stat-label">S&P 500 Equities</div>
            </div>
            <div className="hero-stat-chip">
              <div className="stat-value">3,480</div>
              <div className="stat-label">Engineered Features</div>
            </div>
            <div className="hero-stat-chip">
              <div className="stat-value">21-Day</div>
              <div className="stat-label">Neural Horizon</div>
            </div>
            <div className="hero-stat-chip">
              <div className="stat-value">SLSQP</div>
              <div className="stat-label">Convex Solver</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
