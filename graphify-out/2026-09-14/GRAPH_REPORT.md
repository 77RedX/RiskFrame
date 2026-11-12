# Graph Report - Algorithmic-Portfolio-Optimizer  (2026-09-11)

## Corpus Check
- 33 files · ~10,431 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 159 nodes · 240 edges · 11 communities (8 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0d717e0f`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- app.py
- Dataset
- ResidualBlock
- 📈 Algorithmic Portfolio Optimizer
- StockSelector.jsx
- Results.jsx
- App.jsx
- devDependencies

## God Nodes (most connected - your core abstractions)
1. `download_and_prepare_data()` - 12 edges
2. `TemporalCNN` - 11 edges
3. `📈 Algorithmic Portfolio Optimizer` - 11 edges
4. `engineer_features()` - 8 edges
5. `PortfolioDataset` - 7 edges
6. `main()` - 7 edges
7. `calculate_portfolio_metrics()` - 7 edges
8. `optimize_portfolio()` - 7 edges
9. `initialize_backend()` - 6 edges
10. `calculate_daily_returns()` - 6 edges

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

## Communities (11 total, 1 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.11
Nodes (17): chart.js, react, react-chartjs-2, react-dom, dependencies, chart.js, react, react-chartjs-2 (+9 more)

### Community 1 - "app.py"
Cohesion: 0.15
Nodes (22): get_prices(), initialize_backend(), optimize(), refresh_cache_if_needed(), serve_frontend(), main(), x (batch, window, assets, features) -> (batch, assets), Temporal CNN for Portfolio Return Prediction. Input ----- (batch, window,… (+14 more)

### Community 2 - "Dataset"
Cohesion: 0.12
Nodes (20): get_sp500_tickers(), load_portfolio_data(), Loads historical adjusted close data. If data exists in the database, it loads…, Scrapes the current S&P 500 ticker list from Wikipedia., Dataset, download_and_prepare_data(), get_tickers(), PortfolioDataset (+12 more)

### Community 4 - "📈 Algorithmic Portfolio Optimizer"
Cohesion: 0.11
Nodes (17): 1. Clone the Repository, 2. Environment Variables (Optional), 3. Setup (Local), 4. Setup (Docker), 📈 Algorithmic Portfolio Optimizer, ⚙️ Automation (CI/CD), CLI Inference, 📐 Feature Engineering (+9 more)

### Community 5 - "StockSelector.jsx"
Cohesion: 0.19
Nodes (11): FilterTabs(), SelectedPreview(), SelectionBar(), StockCard(), StockGrid(), StockSelector(), MAX_STOCKS, RISK_FREE (+3 more)

### Community 6 - "Results.jsx"
Cohesion: 0.18
Nodes (10): BreakdownTable(), EmptyState(), LoadingState(), animateValue(), MetricCard(), MetricCards(), Results(), SharpeBadge() (+2 more)

### Community 7 - "App.jsx"
Cohesion: 0.21
Nodes (7): App(), Footer(), Hero(), Navbar(), PriceChart(), PriceHistory(), SP500_STOCKS

### Community 8 - "devDependencies"
Cohesion: 0.18
Nodes (11): @playwright/test, @types/react, @types/react-dom, vite, @vitejs/plugin-react, devDependencies, @playwright/test, @types/react (+3 more)

## Knowledge Gaps
- **32 isolated node(s):** `name`, `private`, `version`, `type`, `dev` (+27 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 57 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `download_and_prepare_data()` connect `Dataset` to `app.py`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **Why does `TemporalCNN` connect `app.py` to `Dataset`, `ResidualBlock`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **What connects `name`, `private`, `version` to the rest of the system?**
  _32 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._
- **Should `Dataset` be split into smaller, more focused modules?**
  _Cohesion score 0.11965811965811966 - nodes in this community are weakly interconnected._
- **Should `📈 Algorithmic Portfolio Optimizer` be split into smaller, more focused modules?**
  _Cohesion score 0.1111111111111111 - nodes in this community are weakly interconnected._