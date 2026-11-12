import { useState, useCallback, useEffect } from 'react';
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
import {
  saveUserHoldings,
  saveCashBalance,
  recordTrade,
} from './data/marketSignals';
import { SP500_STOCKS } from './data/stocks';

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
    setHoldings(currentUser?.holdings ?? []);
    setCashBalance(currentUser?.cashBalance ?? 0);
  }, [currentUser?._id]);

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

  const handleCalculate = useCallback(async (customTickers = null) => {
    const listToOptimize = customTickers || Array.from(selected);
    if (listToOptimize.length < 2 || isCalculating) return false;

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

      const data = await optimizePortfolio(listToOptimize);
      setLoadingProgress(100);
      setResults(data);
      return true;
    } catch (error) {
      console.error(error);
      setErrorMessage(
        `Could not connect to the backend API. Error: ${error.message}`
      );
      return false;
    } finally {
      setIsCalculating(false);
    }
  }, [selected, isCalculating]);

  // Execute Buy / Sell Trade (Zerodha & Groww settlement model)
  const handleExecuteTrade = useCallback((order) => {
    if (!currentUser) throw new Error("Sign in to change your portfolio.");
    const userId = currentUser._id;
    const { type, ticker, name, shares, price, total } = order;

    if (type === 'BUY') {
      let nextCashValue;
      setCashBalance((prevCash) => {
        nextCashValue = Math.max(0, Number((prevCash - total).toFixed(2)));
        saveCashBalance(nextCashValue, userId);
        return nextCashValue;
      });

      setHoldings((prevHoldings) => {
        const existingIdx = prevHoldings.findIndex((h) => h.ticker === ticker);
        let nextHoldings;

        if (existingIdx >= 0) {
          const existing = prevHoldings[existingIdx];
          const newShares = existing.shares + shares;
          const newAvgPrice = Number(
            ((existing.shares * existing.avgBuyPrice + shares * price) / newShares).toFixed(2)
          );
          nextHoldings = [...prevHoldings];
          nextHoldings[existingIdx] = {
            ...existing,
            shares: newShares,
            avgBuyPrice: newAvgPrice,
          };
        } else {
          const stockMeta = SP500_STOCKS.find((s) => s.ticker === ticker);
          const newHolding = {
            ticker,
            name: name || stockMeta?.name || ticker,
            sector: stockMeta?.sector || 'Equities',
            shares,
            avgBuyPrice: price,
            buyDate: new Date().toISOString().split('T')[0],
          };
          nextHoldings = [newHolding, ...prevHoldings];
        }

        saveUserHoldings(nextHoldings, userId);
        if (userId) {
          updateUserPortfolio({ holdings: nextHoldings, cashBalance: nextCashValue, trade: order });
        }
        return nextHoldings;
      });

      recordTrade(order, userId);
    } else if (type === 'SELL') {
      let nextCashValue;
      setCashBalance((prevCash) => {
        nextCashValue = Number((prevCash + total).toFixed(2));
        saveCashBalance(nextCashValue, userId);
        return nextCashValue;
      });

      setHoldings((prevHoldings) => {
        const nextHoldings = prevHoldings
          .map((h) => {
            if (h.ticker === ticker) {
              const remaining = h.shares - shares;
              if (remaining <= 0) return null;
              return { ...h, shares: remaining };
            }
            return h;
          })
          .filter(Boolean);

        saveUserHoldings(nextHoldings, userId);
        if (userId) {
          updateUserPortfolio({ holdings: nextHoldings, cashBalance: nextCashValue, trade: order });
        }
        return nextHoldings;
      });

      recordTrade(order, userId);
    }
  }, [currentUser]);

  const handleAddCash = useCallback((amount) => {
    if (!currentUser) throw new Error("Sign in to change your portfolio.");
    const userId = currentUser._id;
    setCashBalance((prev) => {
      const next = Number((prev + amount).toFixed(2));
      saveCashBalance(next, userId);
      if (userId) {
        updateUserPortfolio({ cashBalance: next });
      }
      return next;
    });
  }, [currentUser]);

  const handleLogout = useCallback(() => {
    clearAuthToken();
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
      <AgentCopilot currentUser={currentUser} />
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
