import { useCallback } from 'react';

export default function Footer() {
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
    <footer id="footer" role="contentinfo">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-logo">
            <span aria-hidden="true">📈</span>
            <span>RiskFrame</span>
          </div>
          <nav className="footer-links" aria-label="Footer navigation">
            <a
              href="#stock-selector"
              id="footer-selector"
              onClick={(e) => smoothScroll(e, '#stock-selector')}
            >
              Stock Selector
            </a>
            <a
              href="#results"
              id="footer-results"
              onClick={(e) => smoothScroll(e, '#results')}
            >
              Results
            </a>
            <a
              href="https://github.com/77RedX/RiskFrame"
              target="_blank"
              rel="noopener"
              id="footer-github"
            >
              GitHub ↗
            </a>
          </nav>
          <p className="footer-copy">Built with Modern Portfolio Theory &amp; Deep Learning.</p>
        </div>
      </div>
    </footer>
  );
}
