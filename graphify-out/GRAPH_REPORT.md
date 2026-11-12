# Graph Report - RiskFrame  (2026-11-11)

## Corpus Check
- 59 files · ~28,656 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 321 nodes · 539 edges · 16 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 6 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8f87100f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.py
- Dataset
- api.js
- website/package.json
- RiskFrame
- stocks.js
- Results.jsx
- index.js
- App.jsx
- vercel.json
- dependencies
- server/package.json
- dependencies

## God Nodes (most connected - your core abstractions)
1. `getHeaders()` - 13 edges
2. `download_and_prepare_data()` - 12 edges
3. `RiskFrame` - 12 edges
4. `TemporalCNN` - 11 edges
5. `App()` - 11 edges
6. `engineer_features()` - 8 edges
7. `isRedisReady()` - 8 edges
8. `PortfolioDataset` - 7 edges
9. `main()` - 7 edges
10. `calculate_portfolio_metrics()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `initialize_backend()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  app.py → dataset.py
- `initialize_backend()` --calls--> `TemporalCNN`  [EXTRACTED]
  app.py → model.py
- `main()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  main.py → dataset.py
- `main()` --calls--> `TemporalCNN`  [EXTRACTED]
  main.py → model.py
- `initialize_backend()` --calls--> `calculate_annualized_covariance()`  [EXTRACTED]
  app.py → optimizer.py

## Import Cycles
- None detected.

## Communities (16 total, 0 thin omitted)

### Community 0 - "app.py"
Cohesion: 0.19
Nodes (20): get_prices(), get_signals(), health(), initialize_backend(), optimize(), refresh_cache_if_needed(), main(), calculate_annualized_covariance() (+12 more)

### Community 1 - "Dataset"
Cohesion: 0.08
Nodes (25): get_sp500_tickers(), load_portfolio_data(), Loads historical adjusted close data. If data exists in the database, it loads…, Scrapes the current S&P 500 ticker list from Wikipedia., Dataset, download_and_prepare_data(), get_tickers(), PortfolioDataset (+17 more)

### Community 2 - "api.js"
Cohesion: 0.13
Nodes (24): checkHealth(), deletePortfolio(), fetchPrices(), fetchSavedPortfolios(), getAuthToken(), getCacheStats(), getHeaders(), getProfile() (+16 more)

### Community 3 - "website/package.json"
Cohesion: 0.07
Nodes (28): chart.js, @playwright/test, react, react-chartjs-2, react-dom, @types/react, @types/react-dom, vite (+20 more)

### Community 4 - "RiskFrame"
Cohesion: 0.06
Nodes (30): 1. Alpha Formulation & Target Normalization, 1. Data Ingestion & Storage Architecture, 1. Prerequisites, 2. Feature Engineering Pipeline, 2. Local Setup, 2. Temporal Convolutional Neural Network (Temporal CNN), 3. Launching the Web Application, 3. Ledoit-Wolf Covariance Shrinkage (+22 more)

### Community 5 - "stocks.js"
Cohesion: 0.18
Nodes (12): FilterTabs(), SelectedPreview(), SelectionBar(), StockCard(), StockGrid(), StockSelector(), MAX_STOCKS, RISK_FREE (+4 more)

### Community 6 - "Results.jsx"
Cohesion: 0.18
Nodes (10): BreakdownTable(), EmptyState(), LoadingState(), animateValue(), MetricCard(), MetricCards(), Results(), SharpeBadge() (+2 more)

### Community 7 - "index.js"
Cohesion: 0.07
Nodes (40): connectDB(), disconnectDB(), getRedis(), initRedis(), isRedisReady(), allowedOrigins, app, startServer() (+32 more)

### Community 8 - "App.jsx"
Cohesion: 0.14
Nodes (22): clearAuthToken(), App(), Footer(), Hero(), MyPortfolio(), Navbar(), OptimalSignals(), TradeModal() (+14 more)

### Community 9 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, outputDirectory, rewrites

### Community 12 - "dependencies"
Cohesion: 0.10
Nodes (21): axios, bcryptjs, cors, dotenv, express, ioredis, jsonwebtoken, mongoose (+13 more)

### Community 13 - "server/package.json"
Cohesion: 0.15
Nodes (12): description, devDependencies, mongodb-memory-server, mongodb-memory-server, main, name, scripts, dev (+4 more)

### Community 14 - "dependencies"
Cohesion: 0.50
Nodes (3): dependencies, mongodb-memory-server, mongodb-memory-server

## Knowledge Gaps
- **82 isolated node(s):** `mongodb-memory-server`, `name`, `version`, `description`, `main` (+77 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 110 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `server/package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **Why does `dotenv` connect `dependencies` to `app.py`, `Dataset`?**
  _High betweenness centrality (0.039) - this node is a cross-community bridge._
- **What connects `mongodb-memory-server`, `name`, `version` to the rest of the system?**
  _82 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Dataset` be split into smaller, more focused modules?**
  _Cohesion score 0.08250355618776671 - nodes in this community are weakly interconnected._
- **Should `api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `website/package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06896551724137931 - nodes in this community are weakly interconnected._
- **Should `RiskFrame` be split into smaller, more focused modules?**
  _Cohesion score 0.06451612903225806 - nodes in this community are weakly interconnected._