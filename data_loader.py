import os
import pandas as pd
import yfinance as yf
from sqlalchemy import create_engine, inspect

def get_sp500_tickers():
    """
    Scrapes the current S&P 500 ticker list from Wikipedia.
    """
    print("Fetching S&P 500 ticker list from Wikipedia...")
    url = "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies"
    
    # read_html returns a list of tables; the first table contains the company data
    tables = pd.read_html(url, storage_options={'User-Agent': 'Mozilla/5.0'})
    df = tables[0]
    
    tickers = df['Symbol'].tolist()
    
    # CRITICAL CLEANING STEP:
    # Yahoo Finance uses hyphens (-) instead of dots (.) for share classes.
    # For example, Berkshire Hathaway (BRK.B) must be converted to BRK-B.
    cleaned_tickers = [ticker.replace('.', '-') for ticker in tickers]
    
    return cleaned_tickers

def load_portfolio_data(tickers=None, period="3y", database_url="sqlite:///local_fallback.db", force_download=False):
    """
    Loads historical adjusted close data. 
    If data exists in the database, it loads from there. Otherwise, it downloads fresh data.
    """
    engine = create_engine(database_url)
    table_name = "historical_prices"
    
    # Check if table exists
    inspector = inspect(engine)
    if not force_download and inspector.has_table(table_name):
        print(f"Checking database table: '{table_name}'...")
        try:
            df = pd.read_sql_table(table_name, con=engine, index_col="Date")
            # Parse dates just in case
            df.index = pd.to_datetime(df.index)
            
            if tickers is None or set(tickers).issubset(set(df.columns)):
                print("Database cache validated! Loading historical prices...")
                if tickers is not None:
                    return df[tickers]
                return df
            else:
                print("Cached data columns do not match requested tickers. Re-downloading fresh data...")
        except Exception as e:
            print(f"Error reading from database: {e}")
            print("Re-downloading fresh data...")
    
    # If no tickers are provided, default to fetching the entire S&P 500
    if tickers is None:
        tickers = get_sp500_tickers()
        
    print(f"Downloading data for {len(tickers)} assets from Yahoo Finance...")
    
    # Download data using group_by='column' to simplify extracting Adjusted Close
    raw_data = yf.download(tickers, period=period, interval="1d")
    
    # Isolate Adjusted Close prices
    closing_prices = raw_data['Close']
    
    # Clean up missing data caused by companies listing/delisting within the 3-year window
    closing_prices = closing_prices.ffill().bfill()
    
    # Save to database for future runs
    print(f"Saving data to database table '{table_name}'...")
    closing_prices.to_sql(table_name, con=engine, if_exists='replace', index=True, index_label="Date")
    print("Data successfully saved!")
    
    return closing_prices
