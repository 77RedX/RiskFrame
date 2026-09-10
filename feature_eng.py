import pandas as pd
import numpy as np

# ==========================================================
# Feature Engineering Parameters
# ==========================================================

MA_WINDOWS = [5, 10, 20, 50]
VOL_WINDOWS = [5, 20]

RSI_WINDOW = 14

MACD_FAST = 12
MACD_SLOW = 26
MACD_SIGNAL = 9


# ==========================================================
# Technical Indicators
# ==========================================================

def compute_rsi(series, window=RSI_WINDOW):
    """
    Compute Relative Strength Index (RSI).
    """

    delta = series.diff()

    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(window).mean()
    avg_loss = loss.rolling(window).mean()

    rs = avg_gain / avg_loss

    rsi = 100 - (100 / (1 + rs))

    return rsi


def compute_macd(series):
    """
    Compute MACD and Signal Line.
    """

    ema_fast = series.ewm(span=MACD_FAST, adjust=False).mean()
    ema_slow = series.ewm(span=MACD_SLOW, adjust=False).mean()

    macd = ema_fast - ema_slow
    signal = macd.ewm(span=MACD_SIGNAL, adjust=False).mean()

    return macd, signal, ema_fast, ema_slow


# ==========================================================
# Feature Engineering
# ==========================================================

def engineer_features(price_df):
    """
    Generate technical indicators for every stock.

    Returns
    -------
    pd.DataFrame
        Engineered feature dataframe.
    """

    features = pd.DataFrame(index=price_df.index)

    # Precompute cross-sectional return momentum ranks across the entire market universe
    rank_return_5 = price_df.pct_change(5).rank(axis=1, pct=True)
    rank_return_20 = price_df.pct_change(20).rank(axis=1, pct=True)

    for ticker in price_df.columns:

        price = price_df[ticker]

        stock = pd.DataFrame(index=price.index)

        # --------------------------------------------------
        # Raw Price
        # --------------------------------------------------

        stock["Price"] = price

        # --------------------------------------------------
        # Returns
        # --------------------------------------------------

        daily_returns = price.pct_change()

        stock["Return_1"] = daily_returns
        stock["Return_5"] = price.pct_change(5)
        stock["Return_10"] = price.pct_change(10)
        stock["Return_20"] = price.pct_change(20)

        stock["Log_Return"] = np.log(price / price.shift(1))

        # --------------------------------------------------
        # Moving Average Ratios
        # --------------------------------------------------

        for window in MA_WINDOWS:

            ma = price.rolling(window).mean()

            stock[f"MA{window}_Ratio"] = price / ma

        # --------------------------------------------------
        # Rolling Volatility
        # --------------------------------------------------

        for window in VOL_WINDOWS:

            stock[f"Volatility_{window}"] = (
                daily_returns.rolling(window).std()
            )

        # --------------------------------------------------
        # RSI
        # --------------------------------------------------

        stock["RSI"] = compute_rsi(price)

        # --------------------------------------------------
        # MACD
        # --------------------------------------------------

        macd, signal, ema12, ema26 = compute_macd(price)

        stock["MACD"] = macd
        stock["MACD_Signal"] = signal

        stock["EMA12_Ratio"] = price / ema12
        stock["EMA26_Ratio"] = price / ema26

        # --------------------------------------------------
        # Bollinger Band Position
        # --------------------------------------------------

        rolling_mean = price.rolling(20).mean()
        rolling_std = price.rolling(20).std()

        upper = rolling_mean + 2 * rolling_std
        lower = rolling_mean - 2 * rolling_std

        stock["BB_Position"] = (
            (price - lower) /
            (upper - lower)
        )

        # --------------------------------------------------
        # Cross-Sectional Return Momentum Rank
        # --------------------------------------------------
        stock["Rank_Return_5"] = rank_return_5[ticker]
        stock["Rank_Return_20"] = rank_return_20[ticker]

        # --------------------------------------------------
        # Prefix every feature with ticker name
        # --------------------------------------------------

        stock.columns = [
            f"{ticker}_{col}"
            for col in stock.columns
        ]

        features = pd.concat(
            [features, stock],
            axis=1
        )

    # Remove rows containing NaNs from rolling windows
    features = features.dropna()

    # Apply Z-score normalization across all features (mean=0, std=1)
    features = (features - features.mean()) / (features.std() + 1e-8)

    return features


from sqlalchemy import create_engine

# ==========================================================
# Save Features
# ==========================================================

def save_engineered_features(
    price_df,
    database_url="sqlite:///local_fallback.db"
):
    """
    Generate engineered features and save them to the database.
    """

    features = engineer_features(price_df)

    engine = create_engine(database_url)
    table_name = "engineered_features"
    
    print(f"Saving engineered features to database table '{table_name}'...")
    features.to_sql(table_name, con=engine, if_exists='replace', index=True, index_label="Date")
    print("Engineered features successfully saved!")

    return features