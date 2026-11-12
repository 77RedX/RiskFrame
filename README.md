# RiskFrame

**Deep Learning Alpha Generation & Constrained Portfolio Optimization Terminal**

[![Python](https://img.shields.io/badge/Python-3.10%2B-2b5b84?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.0%2B-ee4c2c?style=flat-square&logo=pytorch&logoColor=white)](https://pytorch.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=flat-square&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ed?style=flat-square&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## Executive Overview

Modern Portfolio Theory (Markowitz, 1952) establishes that optimal capital allocation depends on expected asset returns and their mutual covariance. However, in practical quantitative finance, naive sample-based mean-variance optimization suffers from the **error maximization phenomenon**:
1. **Sample Means Are Extremely Noisy**: Historical trailing returns exhibit weak predictive power for future price trajectories. Feeding raw historical averages into an optimizer results in extreme, fragile portfolio weights.
2. **Sample Covariance Matrices Overfit**: When the number of assets $N$ is large relative to historical observations $T$, sample covariance matrices $\mathbf{S}$ suffer from eigenvalue dispersion, underestimating actual out-of-sample portfolio variance.

**RiskFrame** resolves these structural limitations through a coupled machine learning and quantitative optimization pipeline:
- **Predictive Alpha Engine**: A specialized **Temporal Convolutional Network (Temporal CNN)** ingests 63-day lookback windows across 20 engineered technical indicators to predict **21-day forward excess returns** (market-relative alpha) for 174 S&P 500 assets and macro ETFs.
- **Robust Risk Estimation**: Implements **Ledoit-Wolf covariance shrinkage**, pulling the empirical covariance matrix toward an optimal structured target to eliminate estimation noise.
- **Constrained Quadratic Optimization**: Uses **Sequential Least Squares Programming (SLSQP)** to maximize the Sharpe Ratio under strict single-position concentration limits ($w_i \le 35\%$) and full-investment constraints ($\sum w_i = 1$).
- **Interactive Quantitative Terminal**: A modern React 19 dashboard serving dynamic allocation analytics, portfolio metrics, asset-level breakdowns, and historical price charts powered by a lightweight Flask backend.

---

## System Architecture

```mermaid
flowchart TD
    subgraph DataPipeline ["Data Ingestion & Engineering"]
        A["Yahoo Finance / S&P 500 Universe (174 Assets)"] --> B[("Database Layer (PostgreSQL / SQLite)")]
        B --> C["In-Memory Feature Engine (20 Indicators × 174 Assets)"]
    end

    subgraph DeepLearning ["Alpha Generation (Deep Learning)"]
        C --> D["Sliding Window Tensor (63 Trading Days)"]
        D --> E["Temporal CNN (Conv1D + Residual Blocks + Pooling)"]
        E --> F["Cross-Sectional Interaction Head"]
        F --> G["Predicted 21-Day Excess Returns (Alpha Vector)"]
    end

    subgraph RiskOptimization ["Quantitative Risk & Portfolio Optimization"]
        B --> H["Daily Returns Matrix"]
        H --> I["Ledoit-Wolf Shrinkage (Annualized Covariance)"]
        G & I --> J["SLSQP Optimizer (Maximize Sharpe Ratio)"]
        K["Constraints: Weights 0 to 35%, Sum = 100%"] --> J
        J --> L["Optimal Portfolio Weights"]
    end

    subgraph Presentation ["Application & Visualization"]
        L --> M["Flask REST API (6h In-Memory Cache)"]
        M --> N["React 19 Quantitative Terminal (Vite + Chart.js)"]
    end
```

---

## Quantitative Methodology

### 1. Alpha Formulation & Target Normalization

Rather than predicting raw price changes—which are dominated by broader market beta—RiskFrame predicts **cross-sectional excess return (alpha)** over a 21-day forward investment horizon ($H = 21$ trading days, approximately one calendar month):

$$R_{i, t \to t+H} = \frac{P_{i, t+H}}{P_{i, t}} - 1$$

$$\alpha_{i, t} = R_{i, t \to t+H} - \frac{1}{N}\sum_{j=1}^{N} R_{j, t \to t+H}$$

Subtracting the equal-weighted cross-sectional market return forces the neural network to isolate idiosyncratic asset performance rather than macroeconomic momentum. Expected returns are subsequently annualized for the optimizer:

$$\hat{\mu}_i = \alpha_{i, \text{predicted}} \times \left(\frac{252}{H}\right)$$

### 2. Temporal Convolutional Neural Network (Temporal CNN)

Traditional recurrent architectures (LSTMs, GRUs) suffer from sequential processing bottlenecks, vanishing gradients over long lookbacks, and sensitivity to step-by-step noise. RiskFrame uses 1D temporal convolutions with residual skip connections:

```text
Input Tensor: [Batch, Window=63, Assets=174, Features=20]
      │
      ▼ Reshape: Decouple temporal extraction per asset
[Batch × 174, Channels=20, Length=63]
      │
      ▼ Input Projection: Conv1D(20 → 64, kernel=3, pad=1) + BatchNorm1d + ReLU
      │
      ▼ Residual Stack: 2 × ResidualBlock(64 Channels, Dropout=0.20)
      │   ├── Conv1D(64 → 64, kernel=3, pad=1) + BatchNorm1d + ReLU
      │   ├── Conv1D(64 → 64, kernel=3, pad=1) + BatchNorm1d + Dropout(0.20)
      │   └── Skip Connection: Output = ReLU(x + F(x))
      │
      ▼ Global Temporal Pooling: AdaptiveAvgPool1d(1)
[Batch × 174, 64]
      │
      ▼ Reshape & Cross-Asset Flattening
[Batch, 174 × 64 = 11,136]
      │
      ▼ Cross-Sectional Interaction Head
      │   Linear(11136 → 128) + ReLU + Dropout(0.20) + Linear(128 → 174)
      ▼
Output Tensor: [Batch, 174] (Predicted excess returns for all assets)
```

**Key architectural features:**
- **Shared Temporal Feature Extraction**: Early convolution layers share weights across all 174 assets, ensuring the model learns universal technical indicator dynamics without overfitting to individual tickers.
- **Cross-Sectional Interaction Head**: Flattening the pooled representations of all assets into a unified linear layer allows the network to model inter-asset dependencies and relative cross-sectional rankings.
- **Huber Loss Criterion**: Trained using Huber loss ($\delta = 1.0$), providing quadratic penalties for moderate deviations while behaving linearly for extreme market outliers, preventing parameter destabilization during sudden market shocks.

### 3. Ledoit-Wolf Covariance Shrinkage

In sample covariance estimation $\mathbf{S} = \frac{1}{T-1} \mathbf{X}^T \mathbf{X}$, small eigenvalues are underestimated and large eigenvalues are overestimated when $N \approx T$. This leads to unstable, highly leveraged portfolio weights. 

RiskFrame applies Ledoit-Wolf shrinkage to produce a well-conditioned covariance matrix $\hat{\mathbf{\Sigma}}_{\text{LW}}$:

$$\hat{\mathbf{\Sigma}}_{\text{LW}} = \delta \mathbf{F} + (1 - \delta) \mathbf{S}$$

where $\mathbf{F}$ is a structured shrinkage target (constant correlation model) and $\delta \in [0, 1]$ is the analytically computed optimal shrinkage intensity that minimizes the expected mean squared error under the Frobenius norm. The resulting matrix is annualized by multiplying by 252.

### 4. Portfolio Optimization Formulation

Portfolio return and portfolio volatility are computed as:

$$\mu_p = \mathbf{w}^T \hat{\mathbf{\mu}}, \qquad \sigma_p = \sqrt{\mathbf{w}^T \hat{\mathbf{\Sigma}}_{\text{LW}} \mathbf{w}}$$

The optimization objective minimizes the negative Sharpe Ratio subject to institutional portfolio constraints:

$$\min_{\mathbf{w}} \quad -\frac{\mathbf{w}^T \hat{\mathbf{\mu}} - R_f}{\sqrt{\mathbf{w}^T \hat{\mathbf{\Sigma}}_{\text{LW}} \mathbf{w}}}$$

$$\text{subject to} \quad \sum_{i=1}^{K} w_i = 1, \qquad 0 \le w_i \le w_{\max} \quad (\forall i)$$

- **Risk-Free Rate ($R_f$)**: Set to 4.0% ($0.04$), reflecting current treasury yield conditions.
- **Single Asset Position Limit ($w_{\max}$)**: Capped at 35% ($0.35$), preventing single-stock concentration while allowing the optimizer to tilt aggressively toward high-conviction alpha signals.
- **Solver**: Sequential Least Squares Programming (`scipy.optimize.minimize(method='SLSQP')`) initialized from equal weights $\mathbf{w}_0 = \frac{1}{K}\mathbf{1}$.

---

## Core Subsystems

### 1. Data Ingestion & Storage Architecture
- **Multi-Asset Universe**: Covers 174 liquid instruments across all 11 S&P 500 sectors (Information Technology, Healthcare, Financials, Consumer Discretionary, Consumer Staples, Energy, Industrials, Utilities, Real Estate, Materials, Communication Services) plus diversified macro ETFs (`GLD` gold, `TLT` 20+ year treasuries, `IEF` 7-10 year treasuries, `SHY` 1-3 year treasuries, `TIP` inflation-protected bonds).
- **Dual Database Strategy**: Configured through SQLAlchemy to support PostgreSQL (e.g. Neon serverless Postgres) or local SQLite (`local_fallback.db`).
- **Dynamic In-Memory Feature Engine**: Standard relational databases enforce column limits (e.g., PostgreSQL has a 1,600-column table cap). With 174 assets and 20 features per asset, the complete feature space requires 3,480 columns. RiskFrame stores raw daily prices in the database and computes the full feature matrix dynamically in-memory upon startup and training, bypassing database schema limits and ensuring zero synchronization lag.
- **Split-Adjusted Data Synchronization**: Rather than appending unadjusted rows, daily updates perform full-window synchronization. Because corporate actions and stock splits adjust price histories retroactively, this guarantees longitudinal consistency.

### 2. Feature Engineering Pipeline
Each asset generates 20 statistical and technical features, standard-normalized across the lookback window ($Z = \frac{x - \mu}{\sigma + \epsilon}$):

| Feature Category | Indicators | Description |
| :--- | :--- | :--- |
| **Price & Returns** | `Price`, `Return_1`, `Return_5`, `Return_10`, `Return_20`, `Log_Return` | Daily closing prices, 1/5/10/20-day percentage changes, and continuous log returns $\ln(P_t / P_{t-1})$. |
| **Moving Average Ratios** | `MA5_Ratio`, `MA10_Ratio`, `MA20_Ratio`, `MA50_Ratio` | Ratio of current price to rolling simple moving averages ($P_t / \text{SMA}_k$), identifying medium and short-term trend extension. |
| **Volatility Metrics** | `Volatility_5`, `Volatility_20` | Rolling standard deviation of daily percentage returns over 5-day and 20-day windows. |
| **Momentum Oscillators** | `RSI`, `MACD`, `MACD_Signal`, `EMA12_Ratio`, `EMA26_Ratio` | 14-period Relative Strength Index, standard 12/26/9 MACD and signal lines, and price-to-EMA ratios. |
| **Mean Reversion** | `BB_Position` | Relative location within Bollinger Bands: $\frac{P_t - \text{Lower}}{\text{Upper} - \text{Lower}}$ where bands represent 20-day $\mu \pm 2\sigma$. |
| **Cross-Sectional Momentum** | `Rank_Return_5`, `Rank_Return_20` | Percentile return rank ($[0, 1]$) of the asset relative to all 174 assets in the universe on date $t$. |

### 3. Model Training & MLOps Pipeline
- **Strict Chronological Splitting**: Chronological 80% train / 20% validation split without time-shuffling to completely prevent lookahead bias.
- **Optimization**: AdamW optimizer ($lr = 10^{-3}, \text{weight decay} = 10^{-4}$) coupled with `ReduceLROnPlateau` (halving learning rate after 5 epochs without validation improvement) and gradient clipping ($\|\mathbf{g}\| \le 1.0$).
- **Early Stopping & Model Versioning**: Early stopping terminates training after 20 epochs of plateaued validation loss. Checkpoints are automatically synced to Hugging Face Hub if credentials are provided.

### 4. Interactive Quantitative Terminal (React 19 + Vite)
- **Asset Selection**: Filter across sectors, search tickers, or deploy preset thematic baskets (e.g. *Magnificent 7*, *Dividend Kings*, *Balanced Core*, *Tech Titans*).
- **Dynamic Portfolio Optimization**: Sends user-selected subsets ($2 \le K \le 35$) to the backend optimizer, displaying real-time allocation distributions via Chart.js doughuts and metrics tables.
- **Comparative Metrics**: Displays expected portfolio annualized return, volatility, Sharpe Ratio, alongside asset-level historical returns, volatility, and AI predicted 21-day returns.
- **Optimal Buy & Sell Signals (Groww & Zerodha Style)**: Algorithmic order hub directly advising which assets are mathematically optimal to buy and which assets are optimal to sell/exit, complete with instant order dialogs and cash margin checks.
- **My Portfolio Ledger**: Real-time holding ledger reflecting all bought assets, current market values, purchase cost basis, live unrealized P&L ($ and %), and rebalancing alignment with model targets.
- **Price Trajectory Inspector**: Dedicated chart module fetching 15-day closing price trends for any universe asset.

---

## Repository Structure

```text
RiskFrame/
├── app.py                     # Flask production API server with static frontend hosting
├── main.py                    # CLI end-to-end inference and portfolio optimization script
├── train.py                   # PyTorch training loop with early stopping and HF Hub sync
├── model.py                   # TemporalCNN and ResidualBlock PyTorch architectures
├── dataset.py                 # PyTorch PortfolioDataset loader and global CONFIG schema
├── feature_eng.py             # Quantitative feature engineering (20 indicators per asset)
├── data_loader.py             # Yahoo Finance ingestion and database caching layer
├── optimizer.py               # Ledoit-Wolf covariance shrinkage and SciPy SLSQP optimizer
│
├── temporal_cnn_weights.pth   # Pretrained model checkpoint
├── requirements.txt           # Python dependency specifications
├── Dockerfile                 # Multi-stage Docker build (Node.js Vite + Python Gunicorn)
│
├── .github/workflows/
│   ├── daily_update.yml       # Scheduled GitHub Action: Daily post-market price ingestion
│   └── weekly_training.yml    # Scheduled GitHub Action: Weekly Saturday model retraining
│
├── scripts/
│   └── update_data.py         # Dedicated sync script for automated price database updates
│
└── website/                   # React 19 Quantitative Web Terminal
    ├── src/
    │   ├── App.jsx            # Top-level state coordinator and API communication
    │   ├── components/        # Modular UI (Navbar, Hero, StockSelector, Results, PriceHistory)
    │   └── data/stocks.js     # S&P 500 universe metadata and sector classifications
    ├── package.json           # Frontend dependencies (React 19, Chart.js, Vite)
    └── vite.config.js         # Vite bundler configuration
```

---

## API Reference

The backend exposes a lightweight REST API running under Flask:

### `POST /api/optimize`
Runs model inference and portfolio optimization for a selected subset of assets.

**Request Payload:**
```json
{
  "tickers": ["AAPL", "NVDA", "MSFT", "AMZN", "GOOGL"]
}
```

**Response Payload:**
```json
{
  "allocation": {
    "AAPL": 0.2312,
    "NVDA": 0.3500,
    "MSFT": 0.1843,
    "AMZN": 0.1345,
    "GOOGL": 0.1000
  },
  "metrics": {
    "expected_return": 0.2845,
    "volatility": 0.1921,
    "sharpe_ratio": 1.2728
  },
  "ai_predictions": {
    "AAPL": 0.2450,
    "NVDA": 0.3812,
    "MSFT": 0.1980,
    "AMZN": 0.1650,
    "GOOGL": 0.1420
  },
  "individual_metrics": {
    "AAPL": {
      "historical_return": 0.2104,
      "historical_volatility": 0.2231,
      "historical_sharpe": 0.7638
    }
  }
}
```

### `GET /api/prices?ticker={SYMBOL}`
Returns historical closing prices over the last 15 trading days.

**Response Payload:**
```json
{
  "dates": ["2026-02-18", "2026-02-19", "..."],
  "prices": [228.45, 230.12, "..."]
}
```

### `GET /api/signals`
Returns real-time algorithmic Buy and Sell order recommendations generated by Temporal CNN alpha inference and Ledoit-Wolf risk weighting.

**Response Payload:**
```json
{
  "buy_signals": [
    { "ticker": "NVDA", "alpha": 0.3840, "price": 138.25, "change_pct": 2.40, "signal": "STRONG_BUY" },
    { "ticker": "AAPL", "alpha": 0.2860, "price": 234.80, "change_pct": 1.15, "signal": "BUY" }
  ],
  "sell_signals": [
    { "ticker": "INTC", "alpha": -0.0420, "price": 22.80, "change_pct": -1.80, "signal": "SELL" }
  ]
}
```

---

## Installation & Quick Start

### 1. Prerequisites
- Python 3.10 or higher
- Node.js 18+ and npm
- (Optional) CUDA-compatible GPU for accelerated model training

### 2. Local Setup

Clone the repository:
```bash
git clone https://github.com/77RedX/RiskFrame.git
cd RiskFrame
```

Create and activate a virtual environment:
```bash
# macOS / Linux
python3 -m venv .venv
source .venv/bin/activate

# Windows
python -m venv .venv
.venv\Scripts\activate
```

Install Python dependencies:
```bash
pip install -r requirements.txt
```

Build the React frontend:
```bash
cd website
npm install
npm run build
cd ..
```

### 3. Launching the Web Application

Start the unified Flask server:
```bash
python app.py
```
The server will initialize the backend, load pre-calculated covariance matrices and neural weights, and serve the terminal at:
```text
http://localhost:5000
```

> [!NOTE]
> During development, you can run the Vite frontend independently (`cd website && npm run dev`) with hot module replacement, proxying API calls to `http://localhost:5000`.

### 4. Running CLI Inference

To run the complete pipeline directly in your console without the UI:
```bash
python main.py
```
This prints:
- Annualized Ledoit-Wolf covariance matrix.
- 21-day model return predictions scaled to annualized rates.
- Optimal asset allocations ($w_i > 1\%$).
- Portfolio expected return, volatility, and Sharpe Ratio.

### 5. Training the Model from Scratch

To retrain the Temporal CNN on fresh market data:
```bash
python train.py
```
The training procedure executes 150 epochs with early stopping (patience 20), saves the optimal checkpoint to `temporal_cnn_weights.pth`, and optionally pushes the checkpoint to Hugging Face Hub if credentials are configured.

---

## Running with Docker Compose

RiskFrame provides complete container orchestration via **Docker Compose** so you never have to manually install Node.js, run `npm run build`, or configure Redis/MongoDB manually:

Before either command, create `server/.env` from `server/.env.example` if it does not exist. Generate a private signing key with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` and set `JWT_SECRET` to that value in your local file. Keep this file out of Git. Compose requires this key and does not automatically read `server/.env`; the commands below load it explicitly. Keep the same key across restarts to preserve valid sessions.

### Option A: One-Command Production Stack (Auto-built React + NGINX + API + Quant + Redis + Mongo)
```bash
docker compose --env-file server/.env up --build
```
This compiles the frontend and starts NGINX on port `3000`, Express on `5000`, and Python on `5001`. Redis is reachable only inside the Docker network.

Set `MONGODB_URI` in `server/.env` to your Atlas connection string or explicitly to `mongodb://mongo:27017/riskframe` for the included Docker database. `127.0.0.1` inside Node's container points to that container, not MongoDB. The backend never switches databases when the selected database is unavailable; account requests report an outage instead. The development stack explicitly selects its own Docker MongoDB. Set `DATABASE_URL` to the PostgreSQL connection string used by Python.
* Access the web terminal at: **`http://localhost:3000`**
* Access the backend API at: **`http://localhost:5000/api/health`**

### Option B: Zero-Build Live Hot-Reloading Development (No `npm run build` Ever Needed)
```bash
docker compose --env-file server/.env -f docker-compose.dev.yml up
```
Mounts your local source code into the containers with **Vite Hot Module Replacement (HMR)** and **Node.js watch mode**. Any code changes to `.jsx` or `.css` are reflected live in your browser instantly without restarting containers or running builds.

To stop without deleting containers or volumes:
```bash
docker compose --env-file server/.env stop
```

---

## Configuration & Environment Variables

Local configuration uses ignored `.env` files; commit only the `.env.example` templates. When adding a key, update its template and this documentation in the same change, then set the private value locally or in the hosting service. Git never needs the real file.

| Service | Variables | Direct local startup |
| :--- | :--- | :--- |
| Node API | `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ALLOWED_ORIGINS`, `PYTHON_QUANT_URL`, optional `REDIS_URL`, `PORT` | `server/.env` |
| Python engine | `DATABASE_URL`, `HF_MODEL_REPO`, optional `HF_TOKEN` | root `.env`, based on `.env.example` |
| Vite frontend | `VITE_API_URL` (public API base URL) | `website/.env`, optional for localhost |

Compose reads `server/.env` using `--env-file`, including the Python values listed in that template, and forwards them to their owning containers. This differs from starting Node or Python directly. The development Compose file deliberately uses SQLite and Docker MongoDB. Its MongoDB host port is bound only to localhost; production MongoDB and Redis have no host-published ports. Node running directly on your laptop cannot reach Docker's internal Redis hostname. Without a separately configured Redis endpoint it uses the optional memory cache.

`/api/live` checks that Node responds; `/api/health` returns 503 until both MongoDB and Python are ready. Redis failure falls back to memory and is reported separately. Account outages do not silently select another database. Deposits and trades are simulated and update the UI only after the database confirms them.

On Render, enter variables on each owning service's Environment page. Environment groups are optional for shared settings; keep database and signing secrets off the frontend. Use deployed service addresses for `PYTHON_QUANT_URL`, `REDIS_URL` and `VITE_API_URL`, and set `ALLOWED_ORIGINS` to the frontend origin. For native Vite builds, `VITE_API_URL` is read at build time. The current frontend Dockerfile fixes that value to an empty string, so a custom API URL for Docker deployment still needs a reviewed build-argument change. The current `render.yaml` configures only Python; a reviewed multi-service deployment is still required. Compose is not automatically deployed by that file. If a production service used a historical committed JWT key, replace it with a fresh private key; this invalidates old sessions. No key rotation is performed by this branch.

Key parameters are centralized in `dataset.py` (`CONFIG`) and can be overridden via environment variables:

| Variable | Default | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `sqlite:///local_fallback.db` | SQLAlchemy connection string (e.g. `postgresql://user:pass@host/db`). |
| `HF_MODEL_REPO` | `redx-was-taken/RiskFrame` | Hugging Face Hub model repository for weight downloads and checkpoint sync. |
| `HF_TOKEN` | *Empty* | Hugging Face token; read permission for downloads, write permission only for explicitly running training uploads. |
| `PORT` | `7860` | Network port for Gunicorn / Flask production serving. |
| `WINDOW_SIZE` | `63` | Lookback trading days for Temporal CNN feature input. |
| `PREDICTION_HORIZON` | `21` | Forward return horizon in trading days (used for alpha generation). |
| `MAX_WEIGHT` | `0.35` | Maximum individual asset weight constraint in portfolio optimization. |
| `RISK_FREE_RATE` | `0.04` | Annualized risk-free benchmark rate ($4\%$) used in the Sharpe Ratio. |

---

## Groq Quant Copilot

The copilot uses Groq for conversation and the existing Python engine for numerical calculations. Configure these **Node backend** variables in ignored `server/.env` (or the Node service's Render Environment settings):

```dotenv
GROQ_API_KEY=
GROQ_MODEL=openai/gpt-oss-20b
```

Set the key privately; the example intentionally has no value. Both Compose files forward these variables only to Node. Apply changes with `docker compose --env-file server/.env up -d --no-deps backend`. No Groq key belongs in a VITE variable, browser bundle, source commit or Docker image. If Groq is unconfigured or unavailable, chat reports an error; the rest of the application remains usable.

The assistant can optimize a supported basket, assess a verified calculation, retrieve dated historical closes, and read owned saved strategies when signed in with **Allow saved portfolio context with Groq** enabled. That checkbox starts a new conversation; permission is also enforced by the server. Messages and permitted tool data are sent to Groq. Public analysis is the default. The copilot cannot execute trades, deposit cash, save strategies or change accounts.

Example: ask "Optimize AAPL MSFT NVDA with a 35% maximum weight and 4% risk-free rate", then "Explain the concentration risk using those results". Expand **Sources & calculations** to inspect engine/date/settings rather than treating generated prose as the numerical source of truth. Quotes are historical closes, forecasts are model estimates, and targets are not incremental trade instructions.

Owned conversations retain at most 40 messages; provider context is further bounded. Guest context stays in the open browser conversation. **New** clears it; logout/account changes clear messages, permission and session IDs. Older command-only sessions must start fresh before using AI. Failed requests offer an explicit retry; they do not silently become canned successes.

Initial limits: three model rounds, four tool executions, a 45-second tool/provider deadline, bounded output and history, ten messages per minute per account/guest IP and one in-flight request per client. Rate counters are per Node process; use shared Redis counters before adding replicas. Provider account limits still apply. Render topology/proxy/CORS configuration and custom frontend Docker API build arguments remain separate deployment work.

---

## Automated CI/CD Workflows

The repository includes GitHub Actions for automated maintenance:
1. **Daily Market Ingestion (`.github/workflows/daily_update.yml`)**:
   Runs Monday through Friday at 21:30 UTC (4:30 PM EST, shortly after US market close). Executes `scripts/update_data.py` to refresh database prices with current market data.
2. **Weekly Model Retraining (`.github/workflows/weekly_training.yml`)**:
   Runs every Saturday at 00:00 UTC. Retrains the Temporal CNN on updated market regimes and pushes updated weights to Hugging Face Hub.

---

## Quantitative Disclaimer

> [!WARNING]
> This software is developed for research and educational purposes only. Nothing contained in this repository constitutes financial, investment, legal, or tax advice. Financial markets are subject to substantial risk of loss. Historical performance and deep learning return predictions do not guarantee future results.
