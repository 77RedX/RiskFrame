# Graph Report - RiskFrame  (2026-11-13)

## Corpus Check
- 97 files · ~226,866 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 476 nodes · 743 edges · 34 communities (20 shown, 2 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `250ae7f1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- auth.routes.js
- app.py
- App.jsx
- website/package.json
- RiskFrame
- stocks.js
- Results.jsx
- index.js
- MyPortfolio.jsx
- vercel.json
- dependencies
- RiskFrame UI and Account Corrections Implementation Plan
- dependencies
- RiskFrame UI audit — 2026-11-11
- Dataset
- agent.service.js
- Optimization Button Fix Plan
- optimization.spec.js
- accounts.spec.js
- Groq Copilot Implementation Plan
- Trading and proposal UI follow-up - 2026-11-13
- Groq integration verification - 2026-11-13

## God Nodes (most connected - your core abstractions)
1. `RiskFrame UI and Account Corrections Implementation Plan` - 22 edges
2. `RiskFrame UI audit — 2026-11-11` - 20 edges
3. `getHeaders()` - 13 edges
4. `RiskFrame` - 13 edges
5. `download_and_prepare_data()` - 12 edges
6. `TemporalCNN` - 11 edges
7. `optimize_portfolio()` - 10 edges
8. `runAgentConversation()` - 10 edges
9. `Groq Copilot Implementation Plan` - 10 edges
10. `isRedisReady()` - 9 edges

## Surprising Connections (you probably didn't know these)
- `initialize_backend()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  app.py → dataset.py
- `main()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  main.py → dataset.py
- `train()` --calls--> `TemporalCNN`  [EXTRACTED]
  train.py → model.py
- `initialize_backend()` --calls--> `TemporalCNN`  [EXTRACTED]
  app.py → model.py
- `initialize_backend()` --calls--> `calculate_annualized_covariance()`  [EXTRACTED]
  app.py → optimizer.py

## Import Cycles
- None detected.

## Communities (34 total, 2 thin omitted)

### Community 0 - "auth.routes.js"
Cohesion: 0.12
Nodes (20): getJWTSecret(), authenticate(), optionalAuthenticate(), AgentSession, AgentSessionSchema, MessageSchema, User, UserSchema (+12 more)

### Community 1 - "app.py"
Cohesion: 0.08
Nodes (27): get_prices(), get_signals(), health(), initialize_backend(), optimize(), refresh_cache_if_needed(), supported_tickers(), main() (+19 more)

### Community 2 - "App.jsx"
Cohesion: 0.11
Nodes (33): checkHealth(), clearAuthToken(), deletePortfolio(), fetchPrices(), fetchSavedPortfolios(), getAuthToken(), getCacheStats(), getHeaders() (+25 more)

### Community 3 - "website/package.json"
Cohesion: 0.07
Nodes (28): chart.js, @playwright/test, react, react-chartjs-2, react-dom, @types/react, @types/react-dom, vite (+20 more)

### Community 4 - "RiskFrame"
Cohesion: 0.06
Nodes (31): 1. Alpha Formulation & Target Normalization, 1. Data Ingestion & Storage Architecture, 1. Prerequisites, 2. Feature Engineering Pipeline, 2. Local Setup, 2. Temporal Convolutional Neural Network (Temporal CNN), 3. Launching the Web Application, 3. Ledoit-Wolf Covariance Shrinkage (+23 more)

### Community 5 - "stocks.js"
Cohesion: 0.14
Nodes (14): PriceChart(), FilterTabs(), SelectedPreview(), SelectionBar(), StockCard(), StockGrid(), StockSelector(), COMPANY_MAP (+6 more)

### Community 6 - "Results.jsx"
Cohesion: 0.21
Nodes (9): BreakdownTable(), EmptyState(), LoadingState(), animateValue(), MetricCard(), MetricCards(), Results(), SharpeBadge() (+1 more)

### Community 7 - "index.js"
Cohesion: 0.13
Nodes (22): connectDB(), disconnectDB(), getRedis(), initRedis(), isRedisReady(), allowedOrigins, app, startServer() (+14 more)

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
Nodes (24): Completion criteria, Exact diagnosis of the signed-out portfolio, Final status - 2026-11-13, Groq and UI follow-up completed - 2026-11-13, Groq feature queued - 2026-11-13, Implementation ledger, New issues reported after completion - 2026-11-13, Paused work - resume after quota reset (+16 more)

### Community 14 - "dependencies"
Cohesion: 0.33
Nodes (5): dependencies, mongodb-memory-server, mongoose, mongodb-memory-server, mongoose

### Community 15 - "RiskFrame UI audit — 2026-11-11"
Cohesion: 0.10
Nodes (20): Completed in this pass, Limits, P1 — Copilot messages execute raw HTML, P1 — Empty portfolios are replaced by demo holdings, P1 — Every deposit preset fails browser validation, P1 — Failed portfolio saves are silently treated as local success, P1 — Python optimization ignores the user's exposure limit and risk-free rate, P1 — Reference prices and seeded recommendations are presented as live model output (+12 more)

### Community 16 - "Dataset"
Cohesion: 0.12
Nodes (21): get_sp500_tickers(), load_portfolio_data(), Loads historical adjusted close data. If data exists in the database, it loads…, Scrapes the current S&P 500 ticker list from Wikipedia., Dataset, download_and_prepare_data(), get_tickers(), PortfolioDataset (+13 more)

### Community 17 - "agent.service.js"
Cohesion: 0.12
Nodes (18): Portfolio, PortfolioSchema, RebalanceEntrySchema, router, SavePortfolioSchema, agentTools, basket, conversationContext() (+10 more)

### Community 18 - "Optimization Button Fix Plan"
Cohesion: 0.40
Nodes (4): Optimization Button Fix Plan, Task 1: Regression and minimal fix, Task 2: Live integration verification, Verification record

### Community 29 - "Groq Copilot Implementation Plan"
Cohesion: 0.10
Nodes (19): Completion criteria and exclusions, Completion status, Configuration, Execution ledger, Groq Copilot Implementation Plan, Step 1 - Backend provider configuration and failure behavior, Step 2 - Restricted validated tool calling, Step 3 - Owned multi-turn context and privacy boundary (+11 more)

### Community 30 - "Trading and proposal UI follow-up - 2026-11-13"
Cohesion: 0.22
Nodes (8): Evidence and verification limits, Groq follow-on verification, P2 - Buy/sell proposal layout is unfinished, P2 - Hidden hypothetical capital and missing selection feedback, P2 - Optimization status overlaps Quant Copilot, P2 - Trade quantity controls allow invalid oversell attempts, Resolution update, Trading and proposal UI follow-up - 2026-11-13

### Community 31 - "Groq integration verification - 2026-11-13"
Cohesion: 0.33
Nodes (5): Groq integration verification - 2026-11-13, Implemented behavior, Limited live checks, Remaining boundaries, Verified gates

## Knowledge Gaps
- **164 isolated node(s):** `mongodb-memory-server`, `mongoose`, `name`, `version`, `description` (+159 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 216 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dotenv` connect `Dataset` to `app.py`, `dependencies`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `dotenv` connect `dependencies` to `Dataset`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `mongodb-memory-server`, `mongoose`, `name` to the rest of the system?**
  _164 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `auth.routes.js` be split into smaller, more focused modules?**
  _Cohesion score 0.11586452762923351 - nodes in this community are weakly interconnected._
- **Should `app.py` be split into smaller, more focused modules?**
  _Cohesion score 0.08383838383838384 - nodes in this community are weakly interconnected._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10631229235880399 - nodes in this community are weakly interconnected._
- **Should `website/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
## Coverage verification - 2026-11-13

All 84 tracked Python/JavaScript/JSX/TypeScript code and test files are included in the manifest at source/documentation commit 250ae7f1. This is code-file coverage, not proof of every runtime relationship. Semantic document/community labels remain cached; no LLM relabeling was invoked. The next artifact commit records this refresh; assess later source changes against the source commit above.
