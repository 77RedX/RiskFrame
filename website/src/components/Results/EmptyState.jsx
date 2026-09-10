import { useCallback } from 'react';

export default function EmptyState() {
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
    <div id="results-empty" className="results-empty fade-up">
      <div className="empty-icon" aria-hidden="true">
        📊
      </div>
      <div className="empty-title">No analysis yet</div>
      <p className="empty-desc">
        Select at least 2 stocks from the picker above, then click the{' '}
        <strong>Calculate</strong> button to compute real portfolio metrics.
      </p>
      <a
        href="#stock-selector"
        className="btn-primary empty-cta"
        id="empty-go-btn"
        onClick={(e) => smoothScroll(e, '#stock-selector')}
      >
        <span aria-hidden="true">↑</span> Go to Stock Selector
      </a>
    </div>
  );
}
