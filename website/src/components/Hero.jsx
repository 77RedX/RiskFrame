import { useEffect, useRef, useCallback } from 'react';

export default function Hero() {
  const orbsRef = useRef([]);

  // Parallax orbs on scroll
  useEffect(() => {
    const handleScroll = () => {
      orbsRef.current.forEach((orb, i) => {
        if (orb) {
          orb.style.transform = `translateY(${window.scrollY * (0.08 + i * 0.04)}px)`;
        }
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const smoothScroll = useCallback((e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 80,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <section id="hero" aria-labelledby="hero-heading">
      <div className="hero-bg"></div>
      <div className="hero-grid" aria-hidden="true"></div>
      <div className="orb orb-1" aria-hidden="true" ref={(el) => (orbsRef.current[0] = el)}></div>
      <div className="orb orb-2" aria-hidden="true" ref={(el) => (orbsRef.current[1] = el)}></div>
      <div className="orb orb-3" aria-hidden="true" ref={(el) => (orbsRef.current[2] = el)}></div>
      <div className="container">
        <div className="hero-content">
          <div className="hero-badge" aria-label="Project status">
            <span className="dot" aria-hidden="true"></span>
            Powered by Deep Learning &amp; Modern Portfolio Theory
          </div>
          <h1 className="hero-title" id="hero-heading">
            Risk<span className="gradient-text">Frame</span>
          </h1>
          <p className="hero-desc">
            Pick <strong>up to 35 stocks</strong> from the S&amp;P 500.
            We fetch <strong>live market data</strong>, then calculate your portfolio's
            real annualized return, volatility, and Sharpe Ratio.
          </p>
          <div className="hero-actions">
            <a
              href="#stock-selector"
              className="btn-primary"
              id="hero-start-btn"
              onClick={(e) => smoothScroll(e, '#stock-selector')}
            >
              <span aria-hidden="true">🚀</span> Build My Portfolio
            </a>
            <a
              href="https://github.com/77RedX/RiskFrame"
              target="_blank"
              rel="noopener"
              className="btn-secondary"
              id="hero-github-btn"
            >
              <span aria-hidden="true">⭐</span> View on GitHub
            </a>
          </div>
          <div className="hero-stats" aria-label="Project highlights">
            <div className="hero-stat">
              <div className="stat-value">150+</div>
              <div className="stat-label">Stocks Available</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">35</div>
              <div className="stat-label">Max Selection</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">1Y</div>
              <div className="stat-label">Live Market Data</div>
            </div>
            <div className="hero-stat">
              <div className="stat-value">252</div>
              <div className="stat-label">Trading Days / Year</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
