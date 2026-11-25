# Graph Report - RiskFrame  (2026-11-13)

## Corpus Check
- 101 files · ~229,673 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 495 nodes · 778 edges · 35 communities (19 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a9238f84`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- index.js
- app.py
- App.jsx
- website/package.json
- RiskFrame
- stocks.js
- Results.jsx
- optimize.routes.js
- MyPortfolio.jsx
- vercel.json
- dependencies
- RiskFrame UI and Account Corrections Implementation Plan
- dependencies
- RiskFrame UI audit — 2026-11-11
- OptimizationTests
- agent.service.js
- Optimization Button Fix Plan
- optimization.spec.js
- accounts.spec.js
- Groq Copilot Implementation Plan
- Trading and proposal UI follow-up - 2026-11-13
- Groq integration verification - 2026-11-13

## God Nodes (most connected - your core abstractions)
1. `RiskFrame UI and Account Corrections Implementation Plan` - 23 edges
2. `RiskFrame UI audit — 2026-11-11` - 20 edges
3. `getHeaders()` - 13 edges
4. `RiskFrame` - 13 edges
5. `download_and_prepare_data()` - 12 edges
6. `TemporalCNN` - 11 edges
7. `Groq Copilot Implementation Plan` - 11 edges
8. `optimize_portfolio()` - 10 edges
9. `runAgentConversation()` - 10 edges
10. `isRedisReady()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `initialize_backend()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  app.py → dataset.py
- `initialize_backend()` --calls--> `TemporalCNN`  [EXTRACTED]
  app.py → model.py
- `initialize_backend()` --calls--> `calculate_annualized_covariance()`  [EXTRACTED]
  app.py → optimizer.py
- `initialize_backend()` --calls--> `calculate_daily_returns()`  [EXTRACTED]
  app.py → optimizer.py
- `optimize()` --calls--> `calculate_portfolio_metrics()`  [EXTRACTED]
  app.py → optimizer.py

## Import Cycles
- None detected.

## Communities (35 total, 3 thin omitted)

### Community 0 - "index.js"
Cohesion: 0.09
Nodes (27): getJWTSecret(), connectDB(), disconnectDB(), allowedOrigins, app, startServer(), authenticate(), optionalAuthenticate() (+19 more)

### Community 1 - "app.py"
Cohesion: 0.06
Nodes (47): get_prices(), get_signals(), health(), initialize_backend(), optimize(), refresh_cache_if_needed(), supported_tickers(), get_sp500_tickers() (+39 more)

### Community 2 - "App.jsx"
Cohesion: 0.10
Nodes (34): checkHealth(), clearAuthToken(), deletePortfolio(), fetchPrices(), fetchSavedPortfolios(), getAuthToken(), getCacheStats(), getHeaders() (+26 more)

### Community 3 - "website/package.json"
Cohesion: 0.07
Nodes (28): chart.js, @playwright/test, react, react-chartjs-2, react-dom, @types/react, @types/react-dom, vite (+20 more)

### Community 4 - "RiskFrame"
Cohesion: 0.06
Nodes (31): 1. Alpha Formulation & Target Normalization, 1. Data Ingestion & Storage Architecture, 1. Prerequisites, 2. Feature Engineering Pipeline, 2. Local Setup, 2. Temporal Convolutional Neural Network (Temporal CNN), 3. Launching the Web Application, 3. Ledoit-Wolf Covariance Shrinkage (+23 more)

### Community 5 - "stocks.js"
Cohesion: 0.18
Nodes (12): FilterTabs(), SelectedPreview(), SelectionBar(), StockCard(), StockGrid(), StockSelector(), MAX_STOCKS, RISK_FREE (+4 more)

### Community 6 - "Results.jsx"
Cohesion: 0.18
Nodes (10): BreakdownTable(), EmptyState(), LoadingState(), animateValue(), MetricCard(), MetricCards(), Results(), SharpeBadge() (+2 more)

### Community 7 - "optimize.routes.js"
Cohesion: 0.15
Nodes (19): getRedis(), initRedis(), isRedisReady(), router, OptimizeRequestSchema, router, cacheStats, generateOptimizationHash() (+11 more)

### Community 8 - "MyPortfolio.jsx"
Cohesion: 0.38
Nodes (7): money(), MyPortfolio(), OptimalSignals(), TradeModal(), generateOptimalSignals(), getStockPrice(), useDialog()

### Community 9 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, outputDirectory, rewrites

### Community 12 - "dependencies"
Cohesion: 0.06
Nodes (32): axios, bcryptjs, cors, express, ioredis, jsonwebtoken, morgan, dependencies (+24 more)

### Community 13 - "RiskFrame UI and Account Corrections Implementation Plan"
Cohesion: 0.08
Nodes (25): Completion criteria, Exact diagnosis of the signed-out portfolio, Final status - 2026-11-13, Groq and UI follow-up completed - 2026-11-13, Groq feature queued - 2026-11-13, Implementation ledger, New issues reported after completion - 2026-11-13, New open high-priority issue - 2026-11-13 (+17 more)

### Community 14 - "dependencies"
Cohesion: 0.33
Nodes (5): dependencies, mongodb-memory-server, mongoose, mongodb-memory-server, mongoose

### Community 15 - "RiskFrame UI audit — 2026-11-11"
Cohesion: 0.10
Nodes (20): Completed in this pass, Limits, P1 — Copilot messages execute raw HTML, P1 — Empty portfolios are replaced by demo holdings, P1 — Every deposit preset fails browser validation, P1 — Failed portfolio saves are silently treated as local success, P1 — Python optimization ignores the user's exposure limit and risk-free rate, P1 — Reference prices and seeded recommendations are presented as live model output (+12 more)

### Community 17 - "agent.service.js"
Cohesion: 0.11
Nodes (19): Portfolio, PortfolioSchema, RebalanceEntrySchema, agentTools, basket, conversationContext(), definition(), publicTools (+11 more)

### Community 18 - "Optimization Button Fix Plan"
Cohesion: 0.40
Nodes (4): Optimization Button Fix Plan, Task 1: Regression and minimal fix, Task 2: Live integration verification, Verification record

### Community 29 - "Groq Copilot Implementation Plan"
Cohesion: 0.07
Nodes (25): Correction verified - 2026-11-13, Evidence, High - malformed optimization responses accepted and cached, Limits, Required correction, Completion criteria and exclusions, Completion status, Configuration (+17 more)

### Community 30 - "Trading and proposal UI follow-up - 2026-11-13"
Cohesion: 0.22
Nodes (8): Evidence and verification limits, Groq follow-on verification, P2 - Buy/sell proposal layout is unfinished, P2 - Hidden hypothetical capital and missing selection feedback, P2 - Optimization status overlaps Quant Copilot, P2 - Trade quantity controls allow invalid oversell attempts, Resolution update, Trading and proposal UI follow-up - 2026-11-13

### Community 31 - "Groq integration verification - 2026-11-13"
Cohesion: 0.29
Nodes (6): Copilot topic boundary - 2026-11-13, Groq integration verification - 2026-11-13, Implemented behavior, Limited live checks, Remaining boundaries, Verified gates

## Knowledge Gaps
- **174 isolated node(s):** `mongodb-memory-server`, `mongoose`, `name`, `version`, `description` (+169 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 228 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dotenv` connect `app.py` to `dependencies`?**
  _High betweenness centrality (0.020) - this node is a cross-community bridge._
- **Why does `dotenv` connect `dependencies` to `app.py`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `mongodb-memory-server`, `mongoose`, `name` to the rest of the system?**
  _174 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `index.js` be split into smaller, more focused modules?**
  _Cohesion score 0.09090909090909091 - nodes in this community are weakly interconnected._
- **Should `app.py` be split into smaller, more focused modules?**
  _Cohesion score 0.061507936507936505 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.09951690821256039 - nodes in this community are weakly interconnected._
- **Should `website/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._