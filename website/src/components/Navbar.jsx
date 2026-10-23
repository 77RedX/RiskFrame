import { useState, useEffect, useCallback } from 'react';

export default function Navbar({ currentUser, onOpenAuth, onLogout, holdingsCount = 0 }) {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Active section highlighting
  useEffect(() => {
    const sections = document.querySelectorAll('section[id]');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => {
      sections.forEach((s) => observer.unobserve(s));
    };
  }, []);

  const smoothScroll = useCallback((e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - 90,
        behavior: 'smooth',
      });
    }
  }, []);

  const linkStyle = (sectionId) => ({
    color: activeSection === sectionId ? '#EAE0CE' : undefined,
  });

  return (
    <header className="navbar-wrapper">
      <nav id="navbar" className={scrolled ? 'scrolled' : ''} aria-label="Main navigation">
        <div className="nav-inner">
          <a
            href="#hero"
            className="nav-logo"
            id="nav-logo-link"
            onClick={(e) => smoothScroll(e, '#hero')}
          >
            <div className="nav-logo-icon" aria-hidden="true">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 20V4H12C15.3137 4 18 6.68629 18 10C18 13.3137 15.3137 16 12 16H4"
                  stroke="#D4AF37"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M12 16L18 20"
                  stroke="#EAE0CE"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="19" cy="5" r="2" fill="#2EE59D" />
              </svg>
            </div>
            <span>RiskFrame</span>
          </a>

          <ul className="nav-links" role="list">
            <li>
              <a
                href="#stock-selector"
                id="nav-selector"
                style={linkStyle('stock-selector')}
                onClick={(e) => smoothScroll(e, '#stock-selector')}
              >
                Asset Selector
              </a>
            </li>
            <li>
              <a
                href="#results"
                id="nav-results"
                style={linkStyle('results')}
                onClick={(e) => smoothScroll(e, '#results')}
              >
                Analytics
              </a>
            </li>
            <li>
              <a
                href="#optimal-signals"
                id="nav-signals"
                style={linkStyle('optimal-signals')}
                onClick={(e) => smoothScroll(e, '#optimal-signals')}
              >
                Buy &amp; Sell
              </a>
            </li>
            <li>
              <a
                href="#my-portfolio"
                id="nav-portfolio"
                style={linkStyle('my-portfolio')}
                onClick={(e) => smoothScroll(e, '#my-portfolio')}
              >
                My Portfolio
                {holdingsCount > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      background: 'rgba(46, 229, 157, 0.18)',
                      color: '#2EE59D',
                      padding: '1px 6px',
                      borderRadius: 10,
                      border: '1px solid rgba(46, 229, 157, 0.35)',
                    }}
                  >
                    {holdingsCount}
                  </span>
                )}
              </a>
            </li>
            <li>
              <a
                href="#price-history"
                id="nav-history"
                style={linkStyle('price-history')}
                onClick={(e) => smoothScroll(e, '#price-history')}
              >
                Market Data
              </a>
            </li>
            <li>
              {currentUser ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={onOpenAuth}
                    className="nav-cta-pill"
                    title="Account Details"
                    style={{
                      background: 'rgba(46, 229, 157, 0.1)',
                      borderColor: 'rgba(46, 229, 157, 0.4)',
                      color: '#2ee59d',
                      cursor: 'pointer',
                    }}
                  >
                    <span>👤 {currentUser.name.split(' ')[0]}</span>
                  </button>
                  <button
                    onClick={onLogout}
                    className="nav-cta-pill"
                    id="nav-signout-btn"
                    title="Sign Out of RiskFrame"
                    style={{
                      background: 'rgba(255, 92, 92, 0.12)',
                      borderColor: 'rgba(255, 92, 92, 0.35)',
                      color: '#ff6b6b',
                      cursor: 'pointer',
                      padding: '7px 12px',
                    }}
                  >
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={onOpenAuth}
                  className="nav-cta-pill"
                  style={{
                    background: 'rgba(212, 175, 55, 0.15)',
                    borderColor: '#D4AF37',
                    color: '#EAE0CE',
                    cursor: 'pointer',
                  }}
                >
                  <span>Sign In</span>
                </button>
              )}
            </li>
            <li>
              <a
                href="https://github.com/77RedX/RiskFrame"
                target="_blank"
                rel="noopener"
                className="nav-cta-pill"
                id="nav-github"
              >
                <span>GitHub</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 9.5L9.5 2.5M9.5 2.5H4.5M9.5 2.5V7.5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
            </li>
          </ul>

          <button
            className="nav-mobile-toggle"
            aria-label="Toggle navigation menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span
              className="nav-hamburger-line"
              style={mobileMenuOpen ? { transform: 'rotate(45deg) translate(5px, 5px)' } : {}}
            />
            <span
              className="nav-hamburger-line"
              style={mobileMenuOpen ? { transform: 'rotate(-45deg) translate(4px, -4px)' } : {}}
            />
          </button>
        </div>

        {mobileMenuOpen && (
          <div
            className="nav-mobile-dropdown"
            style={{
              paddingTop: '16px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              marginTop: '12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <a
              href="#stock-selector"
              onClick={(e) => smoothScroll(e, '#stock-selector')}
              style={{ color: '#EAE0CE', fontSize: '0.92rem', padding: '6px 0' }}
            >
              Asset Selector
            </a>
            <a
              href="#results"
              onClick={(e) => smoothScroll(e, '#results')}
              style={{ color: '#EAE0CE', fontSize: '0.92rem', padding: '6px 0' }}
            >
              Analytics
            </a>
            <a
              href="#optimal-signals"
              onClick={(e) => smoothScroll(e, '#optimal-signals')}
              style={{ color: '#2EE59D', fontSize: '0.92rem', fontWeight: 600, padding: '6px 0' }}
            >
              ⚡ Optimal Buy &amp; Sell
            </a>
            <a
              href="#my-portfolio"
              onClick={(e) => smoothScroll(e, '#my-portfolio')}
              style={{ color: '#D4AF37', fontSize: '0.92rem', fontWeight: 600, padding: '6px 0' }}
            >
              💼 My Portfolio ({holdingsCount})
            </a>
            <a
              href="#price-history"
              onClick={(e) => smoothScroll(e, '#price-history')}
              style={{ color: '#EAE0CE', fontSize: '0.92rem', padding: '6px 0' }}
            >
              Market Data
            </a>
            <a
              href="https://github.com/77RedX/RiskFrame"
              target="_blank"
              rel="noopener"
              style={{ color: '#D4AF37', fontSize: '0.92rem', fontWeight: 600, padding: '6px 0' }}
            >
              GitHub Repository ↗
            </a>

            {currentUser ? (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 0',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                  marginTop: '4px',
                }}
              >
                <button
                  onClick={() => {
                    onOpenAuth();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2ee59d',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 600,
                  }}
                >
                  👤 {currentUser.name}
                </button>
                <button
                  onClick={() => {
                    onLogout();
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    background: 'rgba(255, 92, 92, 0.15)',
                    border: '1px solid rgba(255, 92, 92, 0.4)',
                    color: '#ff6b6b',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onOpenAuth();
                  setMobileMenuOpen(false);
                }}
                className="nav-cta-pill"
                style={{
                  background: 'rgba(212, 175, 55, 0.15)',
                  borderColor: '#D4AF37',
                  color: '#EAE0CE',
                  cursor: 'pointer',
                  width: '100%',
                  marginTop: '8px',
                  justifyContent: 'center',
                }}
              >
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
