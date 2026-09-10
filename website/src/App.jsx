import { useState, useCallback, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StockSelector from './components/StockSelector/StockSelector';
import Results from './components/Results/Results';
import PriceHistory from './components/PriceHistory/PriceHistory';
import Footer from './components/Footer';

export default function App() {
  const [selected, setSelected] = useState(new Set());
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');

  // Fix scroll position on mount
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
  }, []);

  // Persistent IntersectionObserver + MutationObserver for dynamic .fade-up elements
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    // Observe all existing fade elements
    const observeAll = () => {
      document.querySelectorAll('.fade-up:not(.visible), .fade-in:not(.visible)').forEach((el) => {
        io.observe(el);
      });
    };

    // Initial observation after first paint
    const timer = setTimeout(observeAll, 100);

    // Watch for dynamically added .fade-up / .fade-in elements (e.g. chart container, loading cards)
    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;
          // Check the node itself
          if (node.matches?.('.fade-up:not(.visible), .fade-in:not(.visible)')) {
            io.observe(node);
          }
          // Check its descendants
          node.querySelectorAll?.('.fade-up:not(.visible), .fade-in:not(.visible)').forEach((el) => {
            io.observe(el);
          });
        }
      }
    });

    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      mo.disconnect();
      io.disconnect();
    };
  }, []); // Run once — MutationObserver handles all future DOM changes

  const handleToggle = useCallback((ticker) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(ticker)) {
        next.delete(ticker);
      } else {
        if (next.size >= 35) return prev;
        next.add(ticker);
      }
      return next;
    });
  }, []);

  // Batch select: add multiple tickers in a single state update
  const handleBatchSelect = useCallback((tickers) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const t of tickers) {
        if (next.size >= 35) break;
        next.add(t);
      }
      return next;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    setSelected(new Set());
    setResults(null);
    setErrorMessage('');
  }, []);

  const handleCalculate = useCallback(async () => {
    if (selected.size < 2 || isCalculating) return;

    setIsCalculating(true);
    setResults(null);
    setErrorMessage('');
    setLoadingProgress(20);
    setLoadingStatus('Connecting to AI Backend...');

    // Scroll to results
    setTimeout(() => {
      const el = document.getElementById('results');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);

    const tickers = Array.from(selected);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tickers }),
      });

      setLoadingProgress(60);
      setLoadingStatus('Optimizing Portfolio...');

      if (!response.ok) {
        throw new Error(`Backend Error: ${response.statusText}`);
      }

      const data = await response.json();
      setLoadingProgress(100);

      setResults(data);
    } catch (error) {
      console.error(error);
      setErrorMessage(
        `Could not connect to the backend API. Please ensure app.py is running. Error: ${error.message}`
      );
    }

    setIsCalculating(false);
  }, [selected, isCalculating]);

  const tickers = Array.from(selected);

  return (
    <>
      <Navbar />
      <Hero />
      <StockSelector
        selected={selected}
        onToggle={handleToggle}
        onBatchSelect={handleBatchSelect}
        onClearAll={handleClearAll}
        isCalculating={isCalculating}
        onCalculate={handleCalculate}
      />
      <Results
        results={results}
        isLoading={isCalculating}
        loadingProgress={loadingProgress}
        loadingStatus={loadingStatus}
        tickers={tickers}
        errorMessage={errorMessage}
      />
      <PriceHistory />
      <Footer />
    </>
  );
}
