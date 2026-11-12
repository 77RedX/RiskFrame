# Graph Report - RiskFrame  (2026-09-14)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 171 nodes · 257 edges · 12 communities (9 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ae32a778`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- app.py
- download_and_prepare_data
- App.jsx
- package.json
- 📈 Algorithmic Portfolio Optimizer
- StockSelector.jsx
- Results.jsx
- devDependencies
- ResidualBlock
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `download_and_prepare_data()` - 12 edges
2. `📈 Algorithmic Portfolio Optimizer` - 11 edges
3. `TemporalCNN` - 9 edges
4. `engineer_features()` - 8 edges
5. `PortfolioDataset` - 7 edges
6. `main()` - 7 edges
7. `calculate_portfolio_metrics()` - 7 edges
8. `optimize_portfolio()` - 7 edges
9. `initialize_backend()` - 6 edges
10. `calculate_annualized_covariance()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `train()` --calls--> `TemporalCNN`  [EXTRACTED]
  train.py → model.py
- `main()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  main.py → dataset.py
- `initialize_backend()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  app.py → dataset.py
- `initialize_backend()` --calls--> `TemporalCNN`  [EXTRACTED]
  app.py → model.py
- `main()` --calls--> `TemporalCNN`  [EXTRACTED]
  main.py → model.py

## Import Cycles
- None detected.

## Communities (12 total, 1 thin omitted)

### Community 0 - "app.py"
Cohesion: 0.15
Nodes (22): get_prices(), health(), initialize_backend(), optimize(), refresh_cache_if_needed(), main(), x (batch, window, assets, features) -> (batch, assets), Temporal CNN for Portfolio Return Prediction. Input ----- (batch, window,… (+14 more)

### Community 1 - "download_and_prepare_data"
Cohesion: 0.12
Nodes (19): get_sp500_tickers(), load_portfolio_data(), Loads historical adjusted close data. If data exists in the database, it loads…, Scrapes the current S&P 500 ticker list from Wikipedia., download_and_prepare_data(), get_tickers(), PortfolioDataset, Returns the list of tickers configured in CONFIG. If CONFIG["TICKERS"] is None,… (+11 more)

### Community 2 - "App.jsx"
Cohesion: 0.17
Nodes (12): checkHealth(), fetchPrices(), optimizePortfolio(), App(), Footer(), Hero(), LoadingScreen(), MESSAGES (+4 more)

### Community 3 - "package.json"
Cohesion: 0.11
Nodes (17): chart.js, react, react-chartjs-2, react-dom, dependencies, chart.js, react, react-chartjs-2 (+9 more)

### Community 4 - "📈 Algorithmic Portfolio Optimizer"
Cohesion: 0.11
Nodes (17): 1. Clone the Repository, 2. Environment Variables (Optional), 3. Setup (Local), 4. Setup (Docker), 📈 Algorithmic Portfolio Optimizer, ⚙️ Automation (CI/CD), CLI Inference, 📐 Feature Engineering (+9 more)

### Community 5 - "StockSelector.jsx"
Cohesion: 0.20
Nodes (11): FilterTabs(), SelectedPreview(), SelectionBar(), StockCard(), StockGrid(), MAX_STOCKS, RISK_FREE, SECTOR_BADGE (+3 more)

### Community 6 - "Results.jsx"
Cohesion: 0.18
Nodes (10): BreakdownTable(), EmptyState(), LoadingState(), animateValue(), MetricCard(), MetricCards(), Results(), SharpeBadge() (+2 more)

### Community 7 - "devDependencies"
Cohesion: 0.18
Nodes (11): @playwright/test, @types/react, @types/react-dom, vite, @vitejs/plugin-react, devDependencies, @playwright/test, @types/react (+3 more)

### Community 9 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, framework, outputDirectory, rewrites

## Knowledge Gaps
- **37 isolated node(s):** `MESSAGES`, `name`, `private`, `build`, `dev` (+32 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 62 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `download_and_prepare_data()` connect `download_and_prepare_data` to `app.py`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **Why does `TemporalCNN` connect `app.py` to `ResidualBlock`, `download_and_prepare_data`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **What connects `MESSAGES`, `name`, `private` to the rest of the system?**
  _37 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `download_and_prepare_data` be split into smaller, more focused modules?**
  _Cohesion score 0.1168091168091168 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `📈 Algorithmic Portfolio Optimizer` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._