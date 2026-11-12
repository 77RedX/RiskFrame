# Graph Report - Algorithmic-Portfolio-Optimizer  (2026-09-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 115 nodes · 172 edges · 6 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `72ed2b0b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- script.js
- app.py
- dataset.py
- TemporalCNN
- engineer_features
- toggleStock

## God Nodes (most connected - your core abstractions)
1. `download_and_prepare_data()` - 12 edges
2. `TemporalCNN` - 11 edges
3. `engineer_features()` - 8 edges
4. `PortfolioDataset` - 7 edges
5. `main()` - 7 edges
6. `calculate_portfolio_metrics()` - 7 edges
7. `optimize_portfolio()` - 7 edges
8. `initialize_backend()` - 6 edges
9. `calculate_annualized_covariance()` - 6 edges
10. `calculate_daily_returns()` - 6 edges

## Surprising Connections (you probably didn't know these)
- `initialize_backend()` --calls--> `TemporalCNN`  [EXTRACTED]
  app.py → model.py
- `main()` --calls--> `TemporalCNN`  [EXTRACTED]
  main.py → model.py
- `train()` --calls--> `TemporalCNN`  [EXTRACTED]
  train.py → model.py
- `initialize_backend()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  app.py → dataset.py
- `main()` --calls--> `download_and_prepare_data()`  [EXTRACTED]
  main.py → dataset.py

## Import Cycles
- None detected.

## Communities (6 total, 0 thin omitted)

### Community 0 - "script.js"
Cohesion: 0.04
Nodes (42): breakdownTbody, calculateBtn, clearBtn, COMPANY_MAP, copyBtn, ctx, filterTabs, historyBtn (+34 more)

### Community 1 - "app.py"
Cohesion: 0.19
Nodes (19): get_prices(), initialize_backend(), optimize(), refresh_cache_if_needed(), serve_frontend(), main(), calculate_annualized_covariance(), calculate_annualized_returns() (+11 more)

### Community 2 - "dataset.py"
Cohesion: 0.18
Nodes (11): get_sp500_tickers(), load_portfolio_data(), Loads historical adjusted close data. If data exists in the database, it loads…, Scrapes the current S&P 500 ticker list from Wikipedia., download_and_prepare_data(), get_tickers(), PortfolioDataset, Returns the list of tickers configured in CONFIG. If CONFIG["TICKERS"] is None,… (+3 more)

### Community 3 - "TemporalCNN"
Cohesion: 0.24
Nodes (5): x (batch, window, assets, features) -> (batch, assets), Temporal CNN for Portfolio Return Prediction. Input ----- (batch, window,…, Residual Temporal Convolution Block., ResidualBlock, TemporalCNN

### Community 4 - "engineer_features"
Cohesion: 0.27
Nodes (8): compute_macd(), compute_rsi(), engineer_features(), Generate engineered features and save them to the database., Compute Relative Strength Index (RSI)., Compute MACD and Signal Line., Generate technical indicators for every stock. Returns ------- pd.DataFrame…, save_engineered_features()

### Community 5 - "toggleStock"
Cohesion: 0.67
Nodes (4): buildGrid(), toggleStock(), updatePreview(), updateUI()

## Knowledge Gaps
- **42 isolated node(s):** `breakdownTbody`, `calculateBtn`, `clearBtn`, `COMPANY_MAP`, `copyBtn` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 71 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `download_and_prepare_data()` connect `dataset.py` to `app.py`, `engineer_features`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Why does `TemporalCNN` connect `TemporalCNN` to `app.py`, `dataset.py`?**
  _High betweenness centrality (0.051) - this node is a cross-community bridge._
- **Why does `engineer_features()` connect `engineer_features` to `dataset.py`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **What connects `breakdownTbody`, `calculateBtn`, `clearBtn` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `script.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0392156862745098 - nodes in this community are weakly interconnected._