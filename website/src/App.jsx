import useMarketQuotes from './hooks/useMarketQuotes';
import { useState, useCallback, useEffect, useRef } from 'react';
import { optimizePortfolio, getProfile, getAuthToken, clearAuthToken, updateUserPortfolio } from './api';
import LoadingScreen from './components/LoadingScreen';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StockSelector from './components/StockSelector/StockSelector';
import Results from './components/Results/Results';
import OptimalSignals from './components/OptimalSignals/OptimalSignals';
import MyPortfolio from './components/MyPortfolio/MyPortfolio';
import PriceHistory from './components/PriceHistory/PriceHistory';
import Footer from './components/Footer';
import AgentCopilot from './components/AgentCopilot/AgentCopilot';
import AuthModal from './components/UserAuth/AuthModal';

export default function App() {
  const [backendReady, setBackendReady] = useState(false);
  const markBackendReady = useCallback(() => setBackendReady(true), []);
  const [selected, setSelected] = useState(new Set());
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStatus, setLoadingStatus] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // User Portfolio & Trading State
  const [holdings, setHoldings] = useState([]);
  const [cashBalance, setCashBalance] = useState(0);
  const [accountStatus, setAccountStatus] = useState(getAuthToken() ? 'loading' : 'signed-out');
  const [settings, setSettings] = useState({ maxWeight: 0.35, riskFreeRate: 0.04 });
  const quotes = useMarketQuotes([...holdings.map(h => h.ticker), ...Object.keys(results?.allocation ?? {})]);
  const saving = useRef(false);
  const accountOwner = useRef(null);
  accountOwner.current = currentUser?._id;
  const calculationId = useRef(0);
  const invalidateResults = useCallback(() => {
    calculationId.current++;
    setResults(null);
    setErrorMessage('');
    setIsCalculating(false);
  }, []);


  // Restore only this token's account; late replies must not undo logout.
  useEffect(() => {
    const token = getAuthToken();
    if (!token) return;
    let cancelled = false;
    getProfile().then(data => {
      if (!cancelled && getAuthToken() === token) {
        setCurrentUser(data.user);
        setAccountStatus('ready');
      }
    }).catch(error => {
      if (cancelled || getAuthToken() !== token) return;
      if (error.status === 401) {
        clearAuthToken();
        setAccountStatus('signed-out');
      } else setAccountStatus('error');
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    invalidateResults();
    setSettings({ maxWeight: currentUser?.preferences?.maxAssetWeight ?? 0.35, riskFreeRate: currentUser?.preferences?.riskFreeRate ?? 0.04 });
    setHoldings(currentUser?.holdings ?? []);
    setCashBalance(currentUser?.cashBalance ?? 0);
  }, [currentUser?._id, currentUser?.preferences?.maxAssetWeight, currentUser?.preferences?.riskFreeRate]);

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
    invalidateResults();
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
    invalidateResults();
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
    invalidateResults();
  }, []);

  const handleCalculate = useCallback(async (customTickers = null) => {
    const listToOptimize = customTickers || Array.from(selected);
    if (listToOptimize.length < 2 || isCalculating) return false;

    if (!Number.isFinite(settings.maxWeight) || settings.maxWeight < 0.05 || settings.maxWeight > 1 || !Number.isFinite(settings.riskFreeRate) || settings.riskFreeRate < 0 || settings.riskFreeRate > 1) {
      setErrorMessage('Enter a valid exposure limit (5 to 100%) and risk-free rate (0 to 100%).');
      return false;
    }
    if (listToOptimize.length * settings.maxWeight < 1 - 1e-9) {
      setErrorMessage(`Select at least ${Math.ceil(1 / settings.maxWeight)} stocks or raise the maximum per-stock allocation.`);
      return false;
    }
    const id = ++calculationId.current;
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

    try {
      setLoadingProgress(40);
      setLoadingStatus('Optimizing Portfolio...');

      const data = await optimizePortfolio(listToOptimize, settings);
      if (id !== calculationId.current) return false;
      setLoadingProgress(100);
      setResults(data);
      return true;
    } catch (error) {
      if (id !== calculationId.current) return false;
      console.error(error);
      setErrorMessage(
        `Could not connect to the backend API. Error: ${error.message}`
      );
      return false;
    } finally {
      if (id === calculationId.current) setIsCalculating(false);
    }
  }, [selected, isCalculating, settings]);

  const saveOperation = useCallback(async operation => {
    if (!currentUser) throw new Error('Sign in to change your portfolio.');
    if (saving.current) throw new Error('An account update is already pending.');
    saving.current = true;
    const owner = currentUser._id;
    try {
      const data = await updateUserPortfolio(operation);
      if (accountOwner.current !== owner) throw new Error('Account changed. Reload your portfolio.');
      setHoldings(data.holdings);
      setCashBalance(data.cashBalance);
      setCurrentUser(user => ({ ...user, ...data }));
      return data;
    } finally { saving.current = false; }
  }, [currentUser?._id]);
  const handleExecuteTrade = useCallback(order => saveOperation({ operation: order.type.toLowerCase(), ticker: order.ticker, shares: order.shares }), [saveOperation]);
  const handleAddCash = useCallback(amount => saveOperation({ operation: 'deposit', amount }), [saveOperation]);

  const handleLogout = useCallback(() => {
    clearAuthToken();
    invalidateResults();
    setCurrentUser(null);
    setSelected(new Set());
    setResults(null);
    setHoldings([]);
    setCashBalance(0);
    setAccountStatus('signed-out');
  }, []);

  const handleTriggerOptimizationFromSignals = useCallback(() => {
    if (selected.size >= 2) {
      return handleCalculate();
    } else {
      // Select high-conviction core basket
      const defaultBasket = ['NVDA', 'AAPL', 'MSFT', 'AVGO', 'AMZN', 'LLY', 'GOOGL', 'META'];
      setSelected(new Set(defaultBasket));
      return handleCalculate(defaultBasket);
    }
  }, [selected, handleCalculate]);

  const tickers = Array.from(selected);

  if (!backendReady) {
    return <LoadingScreen onReady={markBackendReady} />;
  }

  return (
    <>
      <Navbar
        currentUser={currentUser}
        holdingsCount={holdings.length}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />
      <Hero />
      <StockSelector
        selected={selected}
        onToggle={handleToggle}
        onBatchSelect={handleBatchSelect}
        onClearAll={handleClearAll}
        isCalculating={isCalculating}
        onCalculate={handleCalculate}
        settings={settings}
        onSettingsChange={(next) => { invalidateResults(); setSettings(next); }}
      />
      <Results
        results={results}
        isLoading={isCalculating}
        loadingProgress={loadingProgress}
        loadingStatus={loadingStatus}
        tickers={tickers}
        errorMessage={errorMessage}
      />
      {/* Groww & Zerodha Style Optimal Trade Signals Section */}
      <OptimalSignals
        quotes={quotes}
        holdings={holdings}
        cashBalance={cashBalance}
        optimizationResults={results}
        isAuthenticated={Boolean(currentUser)}
        onExecuteTrade={handleExecuteTrade}
        onTriggerOptimization={handleTriggerOptimizationFromSignals}
        isOptimizing={isCalculating}
      />
      {/* My Portfolio Ledger Section */}
      {currentUser ? <MyPortfolio
        quotes={quotes}
        holdings={holdings}
        cashBalance={cashBalance}
        optimizationResults={results}
        onExecuteTrade={handleExecuteTrade}
        onAddCash={handleAddCash}
      /> : <section id="my-portfolio" aria-labelledby="portfolio-heading">
        <div className="container">
          <h2 id="portfolio-heading">My Portfolio</h2>
          <p role="status">{accountStatus === 'loading' ? 'Loading your account...' : accountStatus === 'error' ? 'Your account is temporarily unavailable. Retry to load your portfolio.' : 'Sign in to view your portfolio'}</p>
          {accountStatus === 'signed-out' && <button className="nav-cta-pill" onClick={() => setIsAuthModalOpen(true)}>Sign In</button>}
          {accountStatus === 'error' && <button onClick={() => window.location.reload()}>Retry Account</button>}
        </div>
      </section>}
      <PriceHistory />
      <Footer />

      {/* RiskFrame v2 Agentic Co-Pilot & Account Modal */}
      <AgentCopilot key={currentUser?._id || 'guest'} currentUser={currentUser} />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        user={currentUser}
        onAuthSuccess={(user) => { setCurrentUser(user); setAccountStatus('ready'); }}
        onLogout={handleLogout}
      />
    </>
  );
}
