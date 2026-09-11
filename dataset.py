import os
import io
import requests
import numpy as np
import pandas as pd
from sqlalchemy import create_engine, inspect

import torch
from torch.utils.data import Dataset

from data_loader import load_portfolio_data
from feature_eng import save_engineered_features, engineer_features

# ==========================================================
# GLOBAL CONFIGURATION
# ==========================================================
CONFIG = {
    "NUM_TICKERS": 174,               # Number of top S&P 500 tickers to use
    "TICKERS": [
        "AAPL", "MSFT", "NVDA", "AVGO", "AMD", "ADBE", "QCOM", "TXN", "INTC", "AMAT", "MU", "LRCX", "KLAC", "SNPS", "CDNS", "CRM", "NOW", "INTU", "ORCL", "IBM", "ACN", "PANW", "CRWD", "FTNT", "ANET", "MRVL", "NXPI", "GOOGL", "GOOG", "META", "NFLX", "DIS", "CMCSA", "T", "VZ", "TMUS", "CHTR", "EA", "TTWO", "LLY", "UNH", "JNJ", "ABBV", "MRK", "PFE", "TMO", "ABT", "DHR", "ISRG", "SYK", "MDT", "VRTX", "REGN", "GILD", "AMGN", "HUM", "CVS", "CI", "ELV", "BSX", "ZTS", "JPM", "V", "MA", "GS", "BAC", "WFC", "MS", "BLK", "SCHW", "AXP", "SPGI", "C", "USB", "PGR", "CB", "ICE", "CME", "AON", "MET", "AMZN", "TSLA", "HD", "MCD", "NKE", "SBUX", "LOW", "BKNG", "TJX", "GM", "F", "ABNB", "RCL", "CCL", "MAR", "HLT", "ORLY", "AZO", "EBAY", "PG", "KO", "COST", "PEP", "WMT", "PM", "MO", "MDLZ", "CL", "KMB", "KR", "GIS", "HSY", "XOM", "CVX", "COP", "EOG", "SLB", "MPC", "PSX", "OXY", "KMI", "HAL", "BKR", "DVN", "CAT", "GE", "UNP", "RTX", "HON", "LMT", "BA", "DE", "UPS", "FDX", "CSX", "NSC", "ETN", "PH", "GD", "NOC", "MMM", "AME", "CARR", "OTIS", "NEE", "SO", "DUK", "D", "AEP", "EXC", "SRE", "PCG", "PLD", "AMT", "EQIX", "SPG", "WELL", "CCI", "PSA", "O", "LIN", "APD", "SHW", "FCX", "NEM", "ECL", "DD", "ALB", "PPG", "GLD", "TLT", "IEF", "SHY", "TIP"
    ],
    "PERIOD": "3y",                  # Historical download period
    "WINDOW_SIZE": 63,               # Number of lookback trading days for TemporalCNN input
    "PREDICTION_HORIZON": 21,        # Forward return days to predict
    "FEATURES_PER_ASSET": 20,        # Technical indicators per asset (including 2 new rank features)
    "HIDDEN_CHANNELS": 64,           # CNN hidden channels
    "DROPOUT": 0.2,                  # CNN dropout rate
    "DATA_DIR": "data",
    "DATABASE_URL": os.environ.get("DATABASE_URL", "sqlite:///local_fallback.db"),
    "HF_MODEL_REPO": os.environ.get("HF_MODEL_REPO", "redx-was-taken/RiskFrame"),
    "HF_TOKEN": os.environ.get("HF_TOKEN", ""),
    "MODEL_PATH": "temporal_cnn_weights.pth",
}


def get_tickers(config=CONFIG):
    """
    Returns the list of tickers configured in CONFIG.
    If CONFIG["TICKERS"] is None, scrapes S&P 500 from Wikipedia and takes top NUM_TICKERS.
    """
    if config["TICKERS"] is not None:
        return config["TICKERS"]

    print("Scraping official S&P 500 tickers...", flush=True)
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    response = requests.get(url, headers=headers)
    sp500_table = pd.read_html(io.StringIO(response.text))[0]
    tickers = sp500_table["Symbol"].tolist()

    # Yahoo Finance uses '-' instead of '.' for stock share classes (e.g., BRK.B -> BRK-B)
    tickers = [ticker.replace(".", "-") for ticker in tickers]

    if config.get("NUM_TICKERS"):
        tickers = tickers[: config["NUM_TICKERS"]]

    return tickers


def download_and_prepare_data(config=CONFIG, force_download=False):
    """
    Downloads historical price data and engineers features based on CONFIG.
    Returns:
        historical_data (pd.DataFrame): Daily closing prices
        engineered_features (pd.DataFrame): features per asset
        tickers (list): List of ticker symbols
    """
    os.makedirs(config["DATA_DIR"], exist_ok=True)

    tickers = get_tickers(config)
    print(f"Using {len(tickers)} tickers: {tickers}", flush=True)

    engine = create_engine(config["DATABASE_URL"])
    inspector = inspect(engine)

    print("Fetching market data...", flush=True)
    historical_data = load_portfolio_data(
        tickers=tickers,
        period=config["PERIOD"],
        database_url=config["DATABASE_URL"],
        force_download=force_download
    )

    print("Generating engineered features in memory (bypassing DB column limits)...", flush=True)
    engineered_features = engineer_features(historical_data)

    return historical_data, engineered_features, tickers


class PortfolioDataset(Dataset):
    """
    Dataset for portfolio return prediction.

    Input
    -----
    Previous `window_size` trading days of engineered features.

    Target
    ------
    Forward return after `prediction_horizon` trading days for every asset.

    Returned Shapes
    ----------------
    X : (window_size, num_assets, features_per_asset)
    y : (num_assets,)
    """

    def __init__(self, config=CONFIG):
        self.config = config
        self.window_size = config["WINDOW_SIZE"]
        self.prediction_horizon = config["PREDICTION_HORIZON"]

        engine = create_engine(config["DATABASE_URL"])

        # --------------------------------------------------
        # Load prices
        # --------------------------------------------------
        self.prices = pd.read_sql_table(
            "historical_prices",
            con=engine,
            index_col="Date"
        )
        self.prices.index = pd.to_datetime(self.prices.index)
        
        # Filter by requested tickers
        if config["TICKERS"] is not None:
            self.prices = self.prices[config["TICKERS"]]

        # --------------------------------------------------
        # Compute engineered features
        # --------------------------------------------------
        from feature_eng import engineer_features
        self.features = engineer_features(self.prices)

        # Align dates
        self.prices = self.prices.loc[self.features.index]
        self.tickers = list(self.prices.columns)
        self.num_assets = len(self.tickers)
        self.features_per_asset = len(self.features.columns) // self.num_assets

        # --------------------------------------------------
        # Future Returns (Targets)
        # --------------------------------------------------
        future_prices = self.prices.shift(-self.prediction_horizon)
        self.targets = (future_prices / self.prices) - 1

        # Remove market beta by subtracting daily cross-sectional average (Excess Return / Alpha)
        market_return = self.targets.mean(axis=1)
        self.targets = self.targets.sub(market_return, axis=0)

        # Remove rows without future targets
        valid_rows = len(self.features) - self.prediction_horizon
        self.features = self.features.iloc[:valid_rows]
        self.targets = self.targets.iloc[:valid_rows]

        # Convert once to NumPy for faster indexing
        self.feature_array = self.features.to_numpy(dtype=np.float32)
        self.target_array = self.targets.to_numpy(dtype=np.float32)

    def __len__(self):
        return len(self.feature_array) - self.window_size + 1

    def __getitem__(self, idx):
        start = idx
        end = idx + self.window_size

        # Input Sequence
        x = self.feature_array[start:end]
        x = x.reshape(
            self.window_size,
            self.num_assets,
            self.features_per_asset,
        )

        # Target
        y = self.target_array[end - 1]

        return (
            torch.from_numpy(x),
            torch.from_numpy(y),
        )


if __name__ == "__main__":
    print("=== Downloading & Preparing Portfolio Dataset ===", flush=True)
    historical_data, engineered_features, tickers = download_and_prepare_data(CONFIG)

    print("\n=== Initializing PyTorch Dataset ===", flush=True)
    dataset = PortfolioDataset(CONFIG)

    print(f"Dataset Size : {len(dataset)}")
    x, y = dataset[0]

    print("Input Shape  :", x.shape)
    print("Target Shape :", y.shape)
    print("Number of Assets :", dataset.num_assets)
    print("Features / Asset :", dataset.features_per_asset)