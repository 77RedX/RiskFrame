import { useState, useEffect, useCallback } from 'react';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
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
      { threshold: 0.4 }
    );
    sections.forEach((s) => observer.observe(s));
    return () => {
      sections.forEach((s) => observer.unobserve(s));
    };
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

  const linkStyle = (sectionId) => ({
    color: activeSection === sectionId ? '#4F8EF7' : undefined,
  });

  return (
    <nav id="navbar" className={scrolled ? 'scrolled' : ''} aria-label="Main navigation">
      <div className="container nav-inner">
        <a
          href="#hero"
          className="nav-logo"
          id="nav-logo-link"
          onClick={(e) => smoothScroll(e, '#hero')}
        >
          <span className="logo-icon" aria-hidden="true">📈</span>
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
              Stock Selector
            </a>
          </li>
          <li>
            <a
              href="#results"
              id="nav-results"
              style={linkStyle('results')}
              onClick={(e) => smoothScroll(e, '#results')}
            >
              Results
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
            <a
              href="https://github.com/77RedX/RiskFrame"
              target="_blank"
              rel="noopener"
              className="nav-cta"
              id="nav-github"
            >
              GitHub ↗
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}
