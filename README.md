# 📈 RiskFrame

> **AI-powered portfolio optimization** combining a Deep Learning Temporal CNN for return prediction with Modern Portfolio Theory (MPT) to maximize risk-adjusted returns across 174 S&P 500 assets.

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue?style=flat-square&logo=python)](https://www.python.org/)
[![PyTorch](https://img.shields.io/badge/PyTorch-2.7%2B-ee4c2c?style=flat-square&logo=pytorch)](https://pytorch.org/)
[![Flask](https://img.shields.io/badge/Flask-Backend-black?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)

---

## 🧠 How It Works

This project fuses deep learning with quantitative finance into a single automated pipeline:

1. **Deep Learning** — A Temporal CNN predicts 21-day forward returns for each asset using 20 engineered technical indicators.
2. **Quantitative Finance** — Predicted returns feed into a Sharpe Ratio maximizer (SLSQP) with Ledoit-Wolf covariance shrinkage to discover mathematically optimal portfolio weights.

```text
Market Data (yfinance)
        │
        ▼
Feature Engineering (20 indicators/asset)
        │
        ▼
 Temporal CNN Model  ──► Predicted 21-Day Returns
        │
        ▼
 Ledoit-Wolf Covariance Matrix (Risk)
        │
        ▼
 SLSQP Sharpe Ratio Optimizer
        │
        ▼
 Optimal Portfolio Weights
```

---

## ✨ Features

- 🤖 **Temporal CNN**: Deep learning model with residual blocks designed for time-series stock return prediction.
- 📊 **Feature Engineering**: Computes 20 technical indicators per asset (RSI, MACD, Bollinger Bands, rolling volatility, momentum ranks, etc.).
- 🛡️ **Robust Risk Modeling**: Ledoit-Wolf covariance shrinkage for robust, out-of-sample risk estimation.
- ⚡ **Optimization**: Sharpe Ratio maximization via SciPy SLSQP with strict per-asset position limits (max 35%).
- 🌐 **Web Dashboard & AI Backend**: Flask-powered backend interacting with an interactive frontend to build portfolios dynamically.
- 💾 **Smart Caching**: SQLite fallback database to cache yfinance downloads for lightning-fast inference.
- 🐳 **Dockerized**: Easy deployment anywhere with the provided Dockerfile.
- 🤖 **Automation**: GitHub Actions workflow included for automated daily market data updates.

---

## 🗂️ Project Structure

```text
RiskFrame/
│
├── app.py                        # Flask API Backend for the Web UI
├── main.py                       # CLI End-to-end inference pipeline
├── train.py                      # Model training script
├── model.py                      # TemporalCNN architecture
├── dataset.py                    # PyTorch Dataset & Data Prep
├── feature_eng.py                # Technical indicator engineering
├── data_loader.py                # yfinance data fetching & caching
├── optimizer.py                  # Portfolio math & SLSQP optimizer
│
├── temporal_cnn_weights.pth      # Pretrained model weights
├── requirements.txt              # Python dependencies
├── Dockerfile                    # Docker configuration for deployment
│
├── .github/workflows/
│   └── daily_update.yml          # CI/CD: Automated daily data fetch
│
├── data/                         # Directory for CSV data
└── website/                      # Frontend UI assets
    ├── index.html
    ├── style.css
    └── script.js
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/77RedX/RiskFrame.git
cd RiskFrame
```

### 2. Environment Variables (Optional)

You can set the following environment variables to configure advanced features:

- `DATABASE_URL`: Connection string for the cache database (defaults to `sqlite:///local_fallback.db`).
- `HF_MODEL_REPO`: Hugging Face repository to pull/push model weights.
- `HF_TOKEN`: Hugging Face token for downloading private weights or uploading models.
- `PORT`: Port for the Flask/Gunicorn server (default `7860`).

### 3. Setup (Local)

Create a virtual environment and install dependencies:

```bash
python -m venv venv

# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
```

### 4. Setup (Docker)

If you prefer using Docker:

```bash
docker build -t portfolio-optimizer .
docker run -p 7860:7860 portfolio-optimizer
```

---

## 💻 Usage

### Web Dashboard (Flask Server)

Run the backend server to enable the interactive web interface:

```bash
python app.py
```
*(Or use Docker as shown above).*

This will:
- Download & cache historical price data.
- Engineer features & load the AI model.
- Start a Flask server on `http://127.0.0.1:5000` (or the configured `PORT`).

Open `website/index.html` in your browser to interact with the dashboard!

### CLI Inference

If you prefer to run the pipeline purely via the terminal:

```bash
python main.py
```
This script will output the optimal portfolio allocation, expected returns, and risk metrics directly to the console.

---

## 🏋️ Training from Scratch

To retrain the model on fresh data, simply run:

```bash
python train.py
```

**Training specifics:**
- **Epochs:** 150 (with early stopping patience of 20).
- **Optimizer:** AdamW (lr=0.001, wd=1e-4) with `ReduceLROnPlateau`.
- **Loss Function:** Huber Loss.
- **Split:** 80% Train / 20% Validation (chronological split to prevent data leakage).

The best checkpoint is automatically saved to `temporal_cnn_weights.pth` and can optionally be pushed to Hugging Face Hub (if `HF_TOKEN` and `HF_MODEL_REPO` are configured).

---

## 🧩 Model Architecture (Temporal CNN)

```text
Input: (batch, window=63, assets=174, features=20)
          │
          ▼  [Reshape per asset]
 (batch×assets, features=20, window=63)
          │
          ▼  Conv1d projection → BatchNorm → ReLU
          │
          ▼  ResidualBlock × 2 (Conv1d + BatchNorm + Dropout)
          │
          ▼  Global Average Pooling
          │
          ▼  Reshape & Flatten
          │
          ▼  Linear(11136, 128) → ReLU → Dropout → Linear(128, 174)
          │
Output: (batch, 174)  — predicted excess returns per asset
```

---

## 📐 Feature Engineering

For each asset, the following 20 features are engineered and Z-score normalized:
- **Price & Returns:** Raw price, Log Return, and rolling returns (1, 5, 10, 20-day).
- **Moving Average Ratios:** Price / MA (5, 10, 20, 50).
- **Volatility:** Rolling standard deviations (5 and 20 days).
- **Momentum & Trend:** RSI (14-period), MACD, MACD Signal, EMA12, and EMA26 ratios.
- **Mean Reversion:** Bollinger Band position.
- **Cross-Sectional Rank:** 5-day and 20-day relative return rank across all assets.

---

## 📊 Portfolio Optimization Details

The optimization phase relies on **Modern Portfolio Theory (MPT)**:
- **Covariance Estimation:** Ledoit-Wolf shrinkage to mitigate sample noise.
- **Objective:** Maximize Sharpe Ratio `(Return − Risk-Free Rate) / Volatility` (default risk-free rate is 4%).
- **Constraints:** Total weights = 100%. Max single asset weight = 35% (ensures diversification).
- **Solver:** SLSQP via `scipy.optimize`.

---

## ⚙️ Automation (CI/CD)

The repository includes a GitHub Actions workflow (`.github/workflows/daily_update.yml`) that runs at the close of US markets every weekday to automatically trigger data updates (via `scripts/update_data.py`), ensuring your cached database remains up-to-date.
