import os
import torch
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

from dataset import CONFIG, download_and_prepare_data
from optimizer import (
    calculate_daily_returns,
    calculate_annualized_covariance,
    calculate_portfolio_metrics,
    optimize_portfolio,
)
from model import TemporalCNN

app = Flask(__name__, static_folder='website/dist')
CORS(app)  # Allow frontend to make requests

# Global variables for caching
MODEL = None
ENGINEERED_FEATURES = None
COV_MATRIX = None
ANNUAL_MEANS = None
TICKERS_LIST = None
HISTORICAL_PRICES = None
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

import time
LAST_CACHE_UPDATE = 0
CACHE_TTL = 3600 * 6  # 6 hours

def refresh_cache_if_needed():
    global LAST_CACHE_UPDATE
    if time.time() - LAST_CACHE_UPDATE > CACHE_TTL:
        if LAST_CACHE_UPDATE != 0:
            print("Cache expired. Reloading from database...", flush=True)
        initialize_backend()

def initialize_backend():
    global MODEL, ENGINEERED_FEATURES, COV_MATRIX, TICKERS_LIST, ANNUAL_MEANS, HISTORICAL_PRICES
    
    print("=== Initializing AI Backend ===")
    
    # 1. Load Data
    historical_data, engineered_features, tickers = download_and_prepare_data(CONFIG)
    TICKERS_LIST = tickers
    ENGINEERED_FEATURES = engineered_features
    HISTORICAL_PRICES = historical_data
    
    # 2. Pre-calculate the full Covariance Matrix and Means once
    daily_returns = calculate_daily_returns(historical_data)
    COV_MATRIX = calculate_annualized_covariance(daily_returns)
    ANNUAL_MEANS = daily_returns.mean() * 252
    
    global LAST_CACHE_UPDATE
    LAST_CACHE_UPDATE = time.time()
    
    # 3. Load Model
    MODEL = TemporalCNN(
        num_assets=len(tickers),
        features_per_asset=CONFIG["FEATURES_PER_ASSET"],
        hidden_channels=CONFIG["HIDDEN_CHANNELS"],
        dropout=CONFIG["DROPOUT"],
    ).to(DEVICE)
    
    model_path = CONFIG["MODEL_PATH"]
    hf_repo = CONFIG.get("HF_MODEL_REPO")
    
    # Try downloading from Hugging Face Hub first
    if hf_repo and hf_repo != "username/Algorithmic-Portfolio-Optimizer":
        print(f"Attempting to download latest model weights from Hugging Face Hub ({hf_repo})...")
        try:
            from huggingface_hub import hf_hub_download
            hf_token = os.environ.get("HF_TOKEN")
            downloaded_path = hf_hub_download(
                repo_id=hf_repo,
                filename=CONFIG["MODEL_PATH"],
                token=hf_token
            )
            model_path = downloaded_path
            print(f"Successfully downloaded weights from HF Hub.")
        except Exception as e:
            print(f"Failed to download from HF Hub: {e}. Falling back to local file.")
            
    if os.path.exists(model_path):
        MODEL.load_state_dict(torch.load(model_path, map_location=DEVICE, weights_only=True))
        MODEL.eval()
        print("Backend Initialized Successfully!")
    else:
        print(f"Warning: Model weights not found at {model_path}. Please train the model first.")

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/api/prices', methods=['GET'])
def get_prices():
    refresh_cache_if_needed()
    ticker = request.args.get('ticker')
    if not ticker or ticker not in TICKERS_LIST:
        return jsonify({"error": "Invalid or missing ticker"}), 400
        
    # Get last 15 days of data
    last_15 = HISTORICAL_PRICES[ticker].dropna().tail(15)
    
    response = {
        "dates": last_15.index.strftime('%Y-%m-%d').tolist(),
        "prices": last_15.tolist()
    }
    return jsonify(response)

@app.route('/api/optimize', methods=['POST'])
def optimize():
    refresh_cache_if_needed()
    data = request.json
    if not data or 'tickers' not in data:
        return jsonify({"error": "Missing 'tickers' in request"}), 400
        
    selected_tickers = data['tickers']
    
    # Ensure selected tickers are supported
    valid_tickers = [t for t in selected_tickers if t in TICKERS_LIST]
    if len(valid_tickers) < 2:
        return jsonify({"error": "Select at least 2 valid stocks"}), 400

    # 1. Get latest window of data
    window_size = CONFIG["WINDOW_SIZE"]
    latest_window = ENGINEERED_FEATURES.iloc[-window_size:].to_numpy(dtype=np.float32)
    latest_tensor = (
        torch.tensor(latest_window)
        .reshape(1, window_size, len(TICKERS_LIST), CONFIG["FEATURES_PER_ASSET"])
        .to(DEVICE)
    )

    # 2. Predict Future Returns using AI
    with torch.no_grad():
        predicted_array = MODEL(latest_tensor).cpu().numpy()[0]
    
    ai_predicted_returns = pd.Series(predicted_array, index=TICKERS_LIST)
    
    # Annualize returns
    annualized_ai_returns = ai_predicted_returns * (252 / CONFIG["PREDICTION_HORIZON"])

    # 3. Filter predictions and covariance matrix for selected tickers
    subset_returns = annualized_ai_returns[valid_tickers]
    subset_cov_matrix = COV_MATRIX.loc[valid_tickers, valid_tickers]
    
    # 4. Optimize Portfolio
    optimal_weights = optimize_portfolio(subset_returns, subset_cov_matrix, max_weight=0.35)
    
    # 5. Calculate Metrics
    opt_return, opt_variance, opt_volatility = calculate_portfolio_metrics(
        optimal_weights, subset_returns, subset_cov_matrix
    )
    opt_sharpe = (opt_return - 0.04) / opt_volatility if opt_volatility > 0 else 0
    
    # 6. Gather Individual Historical Metrics
    individual_metrics = {}
    for ticker in valid_tickers:
        ann_ret = float(ANNUAL_MEANS[ticker])
        ann_vol = float(np.sqrt(COV_MATRIX.loc[ticker, ticker]))
        sharpe = (ann_ret - 0.04) / ann_vol if ann_vol > 0 else 0
        individual_metrics[ticker] = {
            "historical_return": ann_ret,
            "historical_volatility": ann_vol,
            "historical_sharpe": sharpe
        }
    
    # Format Response
    allocation = {ticker: float(weight) for ticker, weight in zip(valid_tickers, optimal_weights)}
    
    response = {
        "metrics": {
            "expected_return": float(opt_return),
            "volatility": float(opt_volatility),
            "sharpe_ratio": float(opt_sharpe)
        },
        "allocation": allocation,
        "ai_predictions": {ticker: float(subset_returns[ticker]) for ticker in valid_tickers},
        "individual_metrics": individual_metrics
    }
    
    return jsonify(response)

# Initialize backend globally so it runs on import (e.g. when run by Gunicorn on Render)
initialize_backend()

if __name__ == '__main__':
    app.run(debug=True, port=5000)
