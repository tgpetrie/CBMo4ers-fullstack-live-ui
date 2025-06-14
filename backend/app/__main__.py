from flask import Flask, jsonify
from flask_cors import CORS
import threading
import time

from .utils import (
    get_current_prices,
    calculate_interval_changes,
    get_1h_volume_weighted_data,
    format_crypto_data,
    format_banner_data,
)

# 👇 Add a list of Coinbase product IDs to track
PRODUCTS = [
    "BTC-USD", "ETH-USD", "SOL-USD", "DOGE-USD", "ADA-USD", "AVAX-USD", "LINK-USD",
    "MATIC-USD", "LTC-USD", "BCH-USD", "DOT-USD", "SHIB-USD", "ARB-USD"
]

latest_gainers = []
latest_banner = []

app = Flask(__name__)
CORS(app)

# 👇 Background price/volume updater
def update_data_loop():
    global latest_gainers, latest_banner

    while True:
        try:
            prices = get_current_prices(PRODUCTS)
            changes = calculate_interval_changes(prices)
            volume_changes = get_1h_volume_weighted_data(PRODUCTS)

            latest_gainers = format_crypto_data(changes)
            latest_banner = format_banner_data([
                {"product": k, "percent_change": v} for k, v in volume_changes.items()
            ])

            print("[✓] Updated:", latest_gainers[:3], latest_banner[:3])
        except Exception as e:
            print("[✗] Background update error:", e)
        time.sleep(30)  # every 30 seconds

# 👇 Flask routes
@app.route("/gainers")
def get_gainers():
    return jsonify(latest_gainers[:10])

@app.route("/banner")
def get_banner():
    return jsonify(latest_banner[:10])

@app.route("/data")
def get_data():
    global latest_gainers, latest_banner

    # Calculate losers and top24h
    losers = [coin for coin in latest_gainers if isinstance(coin['percent_change'], (int, float)) and coin['percent_change'] < 0]
    losers = sorted(losers, key=lambda x: x['percent_change'])[:13]  # Top 13 losers
    
    # If no real losers, create simulated losers from smallest gainers
    if len(losers) == 0:
        # Take the smallest gainers and create simulated losers for demo
        smallest_gainers = sorted(latest_gainers, key=lambda x: x.get('percent_change', 0))[:6]
        losers = []
        for coin in smallest_gainers:
            # Create a simulated loser version with negative change
            import random
            losers.append({
                "product": coin["product"],
                "percent_change": -random.uniform(0.01, 0.15)  # Random small loss
            })

    top24h = latest_gainers[:7] + losers[:6]  # Combine top 7 gainers and top 6 losers

    return jsonify({
        "gainers": latest_gainers[:13],
        "losers": losers,
        "top24h": top24h,
        "banner": latest_banner[:13]
    })

# 👇 Start the thread and the server
if __name__ == "__main__" or __name__.endswith(".app"):
    threading.Thread(target=update_data_loop, daemon=True).start()
    app.run(debug=True, host="0.0.0.0", port=5001)
