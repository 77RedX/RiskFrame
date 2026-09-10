import os
import sys

# Add parent directory to path so we can import from the main app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dataset import download_and_prepare_data, CONFIG

if __name__ == "__main__":
    if not os.environ.get("DATABASE_URL"):
        print("Error: DATABASE_URL environment variable is required to update data.", file=sys.stderr)
        sys.exit(1)
        
    print("=== Starting Daily Data Update ===")
    
    # We force download to replace the entire 3-year history.
    # This is necessary because stock splits adjust all historical prices backwards.
    # Appending would result in inconsistent price histories across split dates.
    try:
        historical_data, engineered_features, tickers = download_and_prepare_data(CONFIG, force_download=True)
        print("=== Daily Data Update Completed Successfully ===")
    except Exception as e:
        print(f"Error during daily update: {e}", file=sys.stderr)
        sys.exit(1)
