import { useCallback } from 'react';

export default function EmptyState() {
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
    <div id="results-empty" className="results-empty fade-up">
      <svg
        className="empty-blueprint-icon"
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="8"
          y="12"
          width="48"
          height="40"
          rx="12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 4"
        />
        <circle cx="32" cy="32" r="12" stroke="currentColor" strokeWidth="1.5" />
        <path d="M32 20V32L40 40" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" />
        <circle cx="20" cy="24" r="2" fill="#2EE59D" />
        <circle cx="44" cy="24" r="2" fill="#EAE0CE" />
      </svg>
      <div className="empty-title">Awaiting Asset Configuration</div>
      <p className="empty-desc">
        Curate a minimum of two equities from the selector above, then execute the{' '}
        <strong style={{ color: '#EAE0CE' }}>Optimize Portfolio</strong> solver to calculate neural alpha trajectories and Sharpe frontier.
      </p>
      <a
        href="#stock-selector"
        className="btn-luxury-secondary empty-cta"
        id="empty-go-btn"
        onClick={(e) => smoothScroll(e, '#stock-selector')}
      >
        <span>Access Asset Universe</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path
            d="M6 9.5V2.5M6 2.5L2.5 6M6 2.5L9.5 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </a>
    </div>
  );
}
