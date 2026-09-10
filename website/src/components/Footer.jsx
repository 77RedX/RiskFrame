import { useCallback } from 'react';

export default function Footer() {
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
    <footer id="footer" role="contentinfo">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="nav-logo-icon" style={{ width: 28, height: 28 }} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 20V4H12C15.3137 4 18 6.68629 18 10C18 13.3137 15.3137 16 12 16H4"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path d="M12 16L18 20" stroke="#EAE0CE" strokeWidth="2" strokeLinecap="round" />
                <circle cx="19" cy="5" r="2" fill="#2EE59D" />
              </svg>
            </div>
            <span>RiskFrame</span>
          </div>

          <nav className="footer-links" aria-label="Footer navigation">
            <a
              href="#stock-selector"
              id="footer-selector"
              onClick={(e) => smoothScroll(e, '#stock-selector')}
            >
              Asset Universe
            </a>
            <a
              href="#results"
              id="footer-results"
              onClick={(e) => smoothScroll(e, '#results')}
            >
              Quantitative Analytics
            </a>
            <a
              href="#price-history"
              id="footer-history"
              onClick={(e) => smoothScroll(e, '#price-history')}
            >
              Market Feed
            </a>
            <a
              href="https://github.com/77RedX/RiskFrame"
              target="_blank"
              rel="noopener"
              id="footer-github"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <span>GitHub</span>
              <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </a>
          </nav>

          <p className="footer-copy">
            Engineered with Modern Portfolio Theory, Ledoit-Wolf Shrinkage &amp; Deep Temporal CNNs.
          </p>
        </div>
      </div>
    </footer>
  );
}
