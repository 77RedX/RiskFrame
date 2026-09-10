import pandas as pd
import numpy as np
import scipy.optimize as sco

def calculate_daily_returns(prices_df):
    """
    Converts a DataFrame of daily closing prices into daily percentage returns.
    """
    print("Calculating daily percentage returns...")
    
    # pct_change() applies the return formula to every cell comparing it to the row above
    returns = prices_df.pct_change()
    
    # The first row will be NaN (Not a Number) because there is no previous day to compare it to.
    # We must drop this row to prevent mathematical errors later.
    returns = returns.dropna()
    
    return returns

def calculate_annualized_returns(daily_returns, trading_days=252):
    """
    Calculates the annualized expected return for each asset.
    Assuming 252 trading days in a year.
    """
    print("Calculating annualized expected returns...")
    
    # Calculate the average (mean) daily return for each column, then annualize it
    annualized_returns = daily_returns.mean() * trading_days
    
    return annualized_returns

def calculate_annualized_covariance(daily_returns, trading_days=252):
    """
    Calculates the annualized covariance matrix using Ledoit-Wolf shrinkage
    to reduce estimation noise and improve out-of-sample Sharpe Ratio stability.
    """
    print("Calculating annualized covariance matrix (with Ledoit-Wolf shrinkage)...")
    try:
        from sklearn.covariance import LedoitWolf
        lw = LedoitWolf()
        cov_matrix_array = lw.fit(daily_returns).covariance_ * trading_days
        cov_matrix = pd.DataFrame(cov_matrix_array, index=daily_returns.columns, columns=daily_returns.columns)
    except Exception as e:
        print(f"Fallback to sample covariance due to: {e}")
        cov_matrix = daily_returns.cov() * trading_days
        
    return cov_matrix

def calculate_portfolio_metrics(weights, annualized_returns, cov_matrix):
    """
    Calculates the expected return, variance, and volatility (risk) 
    of a portfolio given specific asset weights.
    """
    # 1. Expected Portfolio Return = Sum of (weight * individual return)
    portfolio_return = np.sum(annualized_returns * weights)
    
    # 2. Portfolio Variance = w^T * Covariance Matrix * w
    # We use np.dot() to do the matrix multiplication
    portfolio_variance = np.dot(weights.T, np.dot(cov_matrix, weights))
    
    # 3. Portfolio Volatility (Risk) = Square root of variance
    portfolio_volatility = np.sqrt(portfolio_variance)
    
    return portfolio_return, portfolio_variance, portfolio_volatility

def negative_sharpe(weights, annualized_returns, cov_matrix, risk_free_rate=0.04):
    """
    The objective function for SciPy to minimize. 
    Minimizing the negative Sharpe ratio is mathematically identical 
    to maximizing the actual Sharpe ratio.
    """
    # 1. Get the return and volatility using the function you just wrote
    p_ret, p_var, p_vol = calculate_portfolio_metrics(weights, annualized_returns, cov_matrix)
    
    # 2. Calculate the Sharpe Ratio
    sharpe = (p_ret - risk_free_rate) / p_vol
    
    # 3. Return the negative value for the optimizer
    return -sharpe

def optimize_portfolio(annualized_returns, cov_matrix, risk_free_rate=0.04, max_weight=0.20):
    """
    Uses SciPy to find the optimal portfolio weights that maximize the Sharpe Ratio.
    """
    num_assets = len(annualized_returns)
    
    # Ensure max_weight is at least 1/num_assets so weights can sum to 1.0
    effective_max_weight = max(max_weight, 1.0 / num_assets)
    
    # 1. Set the starting guess (e.g., equal weights for all stocks)
    initial_weights = np.array([1.0 / num_assets] * num_assets)
    
    # 2. Set the bounds: Minimum 0%, maximum effective_max_weight (default 20%) per stock to enforce diversification
    bounds = tuple((0.0, effective_max_weight) for _ in range(num_assets))
    
    # 3. Set the constraints: All weights must sum up to exactly 1.0 (100%)
    # In SciPy, an 'eq' constraint means the lambda function must equal exactly 0.
    constraints = ({'type': 'eq', 'fun': lambda w: np.sum(w) - 1.0})
    
    # 4. Run the optimization algorithm (SLSQP = Sequential Least Squares Programming)
    print("Running optimization algorithm...")
    result = sco.minimize(
        fun=negative_sharpe,        # The function we want to minimize
        x0=initial_weights,         # The starting point
        args=(annualized_returns, cov_matrix, risk_free_rate), 
        method='SLSQP',             # The specific calculus algorithm to use
        bounds=bounds,              # Apply our 0-100% bounds
        constraints=constraints     # Apply our 100% sum constraint
    )
    
    # The 'result' object contains a lot of info, but we only want the final weights ('x')
    optimal_weights = result.x
    
    return optimal_weights