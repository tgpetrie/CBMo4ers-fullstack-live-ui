import eventlet
# Ensure monkey patching is done before other imports
eventlet.monkey_patch()

import eventlet.hubs
# Force eventlet to use the poll hub instead of kqueue (macOS compatibility issue)
eventlet.hubs.use_hub('poll')

from flask import Flask, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests
import time
import threading
from collections import defaultdict, deque
import logging

# CBMo4ers Crypto Dashboard Backend
# Data Sources: Public Coinbase Exchange API + CoinGecko (backup)
# No API keys required - uses public market data only

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
app.app_context().push()  # Ensure application context is set
app.config['SECRET_KEY'] = 'crypto-dashboard-secret'
socketio = SocketIO(app, cors_allowed_origins="*")

# Enable CORS for the Flask app
CORS(app)

# Cache and price history storage
cache = {
    "data": None,
    "timestamp": 0,
    "ttl": 60  # Cache for 60 seconds for WebSocket updates
}

# Store price history for 3-minute calculations
# Each coin will have a deque of (timestamp, price) tuples
price_history = defaultdict(lambda: deque(maxlen=20))  # Keep last 20 data points (10 minutes worth)
INTERVAL_MINUTES = 3  # Calculate changes over 3 minutes

def get_current_prices():
    """Fetch current prices from Coinbase with CoinGecko fallback"""
    try:
        # Primary: Try Coinbase first
        return get_coinbase_prices()
    except Exception as e:
        logging.error(f"Coinbase API failed: {e}, trying CoinGecko backup...")
        return get_coingecko_prices()

def get_coinbase_prices():
    """Fetch current prices from Coinbase"""
    try:
        products_url = "https://api.exchange.coinbase.com/products"
        products_response = requests.get(products_url, timeout=10)
        if products_response.status_code == 200:
            products = products_response.json()
            return products
        else:
            logging.error(f"Products API Error: {products_response.status_code}")
            return {}
    except Exception as e:
        logging.error(f"Error fetching current prices from Coinbase: {e}")
        return {}

def get_coingecko_prices():
    """Fetch current prices from CoinGecko as backup"""
    try:
        # Get top 50 coins by market cap
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'market_cap_desc',
            'per_page': 50,
            'page': 1,
            'sparkline': False,
            'price_change_percentage': '1h,24h'
        }
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            coins = response.json()
            current_prices = {}
            
            # Convert CoinGecko format to Coinbase-like format
            for coin in coins:
                # Create a symbol like "BTC-USD" from CoinGecko data
                symbol = f"{coin['symbol'].upper()}-USD"
                current_prices[symbol] = float(coin['current_price'])
            
            logging.info(f"Successfully fetched {len(current_prices)} prices from CoinGecko backup")
            return current_prices
        else:
            logging.error(f"CoinGecko API Error: {response.status_code}")
            return {}
    except Exception as e:
        logging.error(f"Error fetching prices from CoinGecko: {e}")
        return {}

def get_1h_volume_weighted_data():
    """Fetch volume-weighted data using public APIs with CoinGecko backup"""
    try:
        # Primary: Try public Coinbase Exchange API
        return get_coinbase_1h_data()
    except Exception as e:
        logging.error(f"Coinbase public API failed: {e}, trying CoinGecko backup...")
        return get_coingecko_1h_data()

def fetch_product_stats(product_id):
    """Fetch 24h stats and ticker data for a product."""
    try:
        product_stats_url = f"https://api.exchange.coinbase.com/products/{product_id}/stats"
        stats_response = requests.get(product_stats_url, timeout=5)
        if stats_response.status_code != 200:
            return None
        stats_data = stats_response.json()

        ticker_url = f"https://api.exchange.coinbase.com/products/{product_id}/ticker"
        ticker_response = requests.get(ticker_url, timeout=3)
        if ticker_response.status_code != 200:
            return None
        ticker_data = ticker_response.json()

        return stats_data, ticker_data
    except Exception as e:
        logging.warning(f"Error fetching stats for {product_id}: {e}")
        return None

def process_product_data(product, stats_data, ticker_data):
    """Process product data to calculate volume and price changes."""
    try:
        current_price = float(ticker_data.get('price', 0))
        volume_24h = float(stats_data.get('volume', 0))
        open_24h = float(stats_data.get('open', 0))

        estimated_hourly_volume = volume_24h / 24
        price_change_24h = ((current_price - open_24h) / open_24h) * 100 if open_24h > 0 else 0

        volume_change_proxy = abs(price_change_24h) * 5
        if price_change_24h > 2:
            volume_change_proxy *= 1.5
        elif price_change_24h < -2:
            volume_change_proxy *= 1.3

        volume_significance = volume_change_proxy * volume_24h

        if volume_24h > 0:
            return {
                "symbol": product["id"],
                "current_price": current_price,
                "price_change_percentage_1h": price_change_24h,
                "volume_1h": estimated_hourly_volume,
                "volume_change_percentage": volume_change_proxy,
                "volume_significance_score": volume_significance
            }
    except Exception as e:
        logging.warning(f"Error processing product data: {e}")
    return None

def get_coinbase_1h_data():
    """Fetch 1-hour volume change data using public Coinbase API with 24h stats."""
    try:
        products_url = "https://api.exchange.coinbase.com/products"
        products_response = requests.get(products_url, timeout=10)
        if products_response.status_code != 200:
            return []

        products = products_response.json()
        usd_products = [p for p in products if p["quote_currency"] == "USD" and p["status"] == "online"]

        formatted_data = []

        for product in usd_products[:30]:
            stats_data, ticker_data = fetch_product_stats(product["id"])
            if stats_data and ticker_data:
                product_data = process_product_data(product, stats_data, ticker_data)
                if product_data:
                    formatted_data.append(product_data)

            time.sleep(0.1)

        formatted_data.sort(key=lambda x: x["volume_significance_score"], reverse=True)
        logging.info(f"Successfully fetched volume estimation data for {len(formatted_data)} coins using public API")
        return formatted_data[:20]
    except Exception as e:
        logging.error(f"Error fetching volume estimation data: {e}")
        return []

def get_coingecko_1h_data():
    """Fetch volume change data from CoinGecko as backup"""
    try:
        # Get trending coins and market data
        url = "https://api.coingecko.com/api/v3/coins/markets"
        params = {
            'vs_currency': 'usd',
            'order': 'volume_desc',  # Order by volume
            'per_page': 30,
            'page': 1,
            'sparkline': False,
            'price_change_percentage': '1h,24h'
        }
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            coins = response.json()
            formatted_data = []
            
            for coin in coins:
                try:
                    current_price = float(coin['current_price'])
                    price_change_1h = float(coin.get('price_change_percentage_1h_in_currency', 0))
                    volume_24h = float(coin['total_volume'])
                    
                    # CoinGecko doesn't provide hourly volume comparison, so we'll estimate
                    # Based on 24h volume, assume average hourly volume and add some variation
                    avg_hourly_volume = volume_24h / 24
                    # Simulate volume change based on price volatility (higher price change = higher volume change)
                    estimated_volume_change = abs(price_change_1h) * 10  # Rough estimation
                    
                    # Volume significance score
                    volume_significance = abs(estimated_volume_change) * volume_24h
                    
                    formatted_data.append({
                        "symbol": f"{coin['symbol'].upper()}-USD",
                        "current_price": current_price,
                        "price_change_percentage_1h": price_change_1h,
                        "volume_1h": avg_hourly_volume,
                        "volume_change_percentage": estimated_volume_change,
                        "volume_significance_score": volume_significance
                    })
                except Exception as e:
                    logging.warning(f"Error processing CoinGecko volume data for {coin.get('symbol', 'unknown')}: {e}")
                    continue
            
            # Sort by volume significance score
            formatted_data.sort(key=lambda x: x["volume_significance_score"], reverse=True)
            
            logging.info(f"Successfully fetched CoinGecko volume backup data for {len(formatted_data)} coins")
            return formatted_data[:20]
            
        else:
            logging.error(f"CoinGecko API Error: {response.status_code}")
            return []
    except Exception as e:
        logging.error(f"Error fetching CoinGecko volume data: {e}")
        return []

def calculate_interval_changes(current_prices):
    """Calculate price changes over the specified interval (3 minutes)"""
    current_time = time.time()
    interval_seconds = INTERVAL_MINUTES * 60
    
    # Update price history with current prices
    for symbol, price in current_prices.items():
        if price > 0:
            price_history[symbol].append((current_time, price))
    
    # Calculate changes for each symbol
    formatted_data = []
    for symbol, price in current_prices.items():
        if price <= 0:
            continue
            
        # Get price history for this symbol
        history = price_history[symbol]
        if len(history) < 2:
            # Not enough data yet, skip
            continue
            
        # Find the price from INTERVAL_MINUTES ago (or earliest available)
        interval_price = None
        
        # Look for price from exactly 3 minutes ago
        for timestamp, historical_price in history:
            if current_time - timestamp >= interval_seconds:
                interval_price = historical_price
                break
        
        # If no 3-minute data, use the oldest available price (adaptive interval)
        if interval_price is None and len(history) >= 2:
            interval_price = history[0][1]  # Use oldest price
        
        if interval_price is None or interval_price <= 0:
            # No usable historical data, skip
            continue
            
        # Calculate percentage change
        price_change = ((price - interval_price) / interval_price) * 100
        
        # Only include significant changes (> 0.01%) to reduce noise
        if abs(price_change) >= 0.01:
            formatted_data.append({
                "symbol": symbol,
                "current_price": price,
                "price_change_percentage_3min": price_change
            })
    
    return formatted_data

def format_crypto_data(crypto_data):
    """Format crypto data for frontend consumption"""
    return [
        {
            "symbol": coin["symbol"],
            "current": coin["current_price"],
            "gain": coin["price_change_percentage_3min"]
        }
        for coin in crypto_data
    ]

def format_banner_data(banner_data):
    """Format banner data for frontend consumption"""
    return [
        {
            "symbol": coin["symbol"],
            "current": coin["current_price"],
            "gain": coin["price_change_percentage_1h"],
            "volume": coin["volume_1h"],
            "volume_change": coin["volume_change_percentage"]
        }
        for coin in banner_data
    ]

def get_crypto_data():
    """Main function to fetch and process crypto data"""
    current_time = time.time()
    
    # Check cache first
    if cache["data"] and (current_time - cache["timestamp"]) < cache["ttl"]:
        return cache["data"]
    
    try:
        # Get current prices
        current_prices = get_current_prices()
        if not current_prices:
            return None
            
        # Calculate 3-minute interval changes
        crypto_data = calculate_interval_changes(current_prices)
        
        if not crypto_data:
            logging.warning(f"No crypto data available - {len(current_prices)} current prices, total symbols with history: {len(price_history)}")
            return None
        
        # Separate gainers and losers
        gainers = [coin for coin in crypto_data if coin.get("price_change_percentage_3min", 0) > 0]
        losers = [coin for coin in crypto_data if coin.get("price_change_percentage_3min", 0) < 0]
        
        # Sort by percentage change
        gainers.sort(key=lambda x: x["price_change_percentage_3min"], reverse=True)
        losers.sort(key=lambda x: x["price_change_percentage_3min"])
        
        # Get top movers (mix of gainers and losers)
        top_gainers = gainers[:8]
        top_losers = losers[:8]
        top24h = (top_gainers + top_losers)[:15]  # Limit to 15 items
        
        # Get 1-hour volume-weighted data for banner
        banner_data = get_1h_volume_weighted_data()
        
        result = {
            "gainers": format_crypto_data(gainers[:10]),
            "losers": format_crypto_data(losers[:10]),
            "top24h": format_crypto_data(top24h),
            "banner": format_banner_data(banner_data)
        }
        
        # Update cache
        cache["data"] = result
        cache["timestamp"] = current_time
        
        return result
        
    except Exception as e:
        logging.error(f"Error in get_crypto_data: {e}")
        return None

@app.route('/api/banner-1h')
def banner_1h():
    """Separate endpoint for 1-hour volume-weighted data for the scrolling banner"""
    banner_data = get_1h_volume_weighted_data()
    if not banner_data:
        # Fallback data if API fails
        return jsonify([
            {"symbol": "BTC-USD", "current": 97000.0, "gain": 1.25, "volume": 25000000},
            {"symbol": "ETH-USD", "current": 3500.0, "gain": -0.85, "volume": 15000000},
            {"symbol": "SOL-USD", "current": 162.0, "gain": 3.42, "volume": 8000000},
            {"symbol": "ADA-USD", "current": 0.45, "gain": -1.12, "volume": 5000000},
        ])
    
    # Format for frontend
    formatted_data = format_banner_data(banner_data)
    return jsonify(formatted_data)

@app.route('/api/crypto')
def get_crypto():
    """REST API endpoint for crypto data"""
    logging.debug("Received request for /api/crypto endpoint")
    data = get_crypto_data()
    if data:
        logging.debug("Successfully fetched crypto data")
        return jsonify(data)
    else:
        logging.error("Failed to fetch crypto data")
        return jsonify({"error": "Failed to fetch crypto data"}), 500

# Keep original routes for backward compatibility
@app.route('/banner-1h')
def banner_1h_legacy():
    return banner_1h()

@app.route('/crypto')
def get_crypto_legacy():
    return get_crypto()

@app.route('/favicon.ico')
def favicon():
    return '', 204  # Return an empty response with status code 204 (No Content)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Send initial data when client connects
    data = get_crypto_data()
    if data:
        emit('crypto_update', data)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def background_crypto_updates():
    """Background thread to send periodic updates"""
    while True:
        try:
            data = get_crypto_data()
            if data:
                socketio.emit('crypto_update', data)
                print(f"Sent update: {len(data['gainers'])} gainers, {len(data['losers'])} losers, {len(data['banner'])} banner items")
        except Exception as e:
            logging.error(f"Error in background update: {e}")
        
        time.sleep(60)  # Update every 60 seconds (1 minute)

# For Vercel deployment
app_instance = app

if __name__ == '__main__':
    # Start background thread for periodic updates (local development only)
    background_thread = threading.Thread(target=background_crypto_updates)
    background_thread.daemon = True
    background_thread.start()
    
    socketio.run(app, debug=False, host='0.0.0.0', port=0)
else:
    # Production mode for Vercel
    # Note: WebSocket background updates won't work in serverless
    # Consider using Vercel cron jobs or client-side polling for production
    pass
