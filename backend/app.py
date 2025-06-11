from flask import Flask, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit
import requests
import time
import threading

app = Flask(__name__)
app.config['SECRET_KEY'] = 'crypto-dashboard-secret'
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*")

# Cache to avoid hitting API limits
cache = {
    "data": None,
    "timestamp": 0,
    "ttl": 30  # Cache for 30 seconds for WebSocket updates
}

def get_coinbase_products():
    """Fetch all trading pairs from Coinbase"""
    try:
        url = "https://api.exchange.coinbase.com/products"
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            products = response.json()
            # Filter for USD pairs only
            usd_products = [p for p in products if p["quote_currency"] == "USD" and p["status"] == "online"]
            return usd_products
        else:
            print(f"Products API Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"Error fetching products: {e}")
        return []

def get_coinbase_24h_stats(product_ids):
    """Fetch 24h stats for multiple products from Coinbase"""
    try:
        stats_data = []
        # Coinbase API allows batch requests, but we'll do individual calls for reliability
        for product_id in product_ids[:50]:  # Limit to first 50 to avoid rate limits
            try:
                url = f"https://api.exchange.coinbase.com/products/{product_id}/stats"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    stats = response.json()
                    stats["product_id"] = product_id
                    stats_data.append(stats)
                time.sleep(0.1)  # Small delay to avoid rate limits
            except Exception as e:
                print(f"Error fetching stats for {product_id}: {e}")
                continue
        return stats_data
    except Exception as e:
        print(f"Error fetching 24h stats: {e}")
        return []

def fetch_crypto_data():
    """Fetch cryptocurrency data from Coinbase API with caching"""
    current_time = time.time()
    
    # Check if we have valid cached data
    if cache["data"] and (current_time - cache["timestamp"]) < cache["ttl"]:
        return cache["data"]
    
    try:
        # Get all USD trading pairs
        products = get_coinbase_products()
        if not products:
            return cache["data"] or []
        
        # Get product IDs
        product_ids = [p["id"] for p in products]
        
        # Get 24h stats for all products
        stats_data = get_coinbase_24h_stats(product_ids)
        
        # Format the data
        formatted_data = []
        for stats in stats_data:
            try:
                last_price = float(stats.get("last", 0))
                open_price = float(stats.get("open", 0))
                
                if last_price > 0 and open_price > 0:
                    price_change_24h = ((last_price - open_price) / open_price) * 100
                    
                    formatted_data.append({
                        "symbol": stats["product_id"],
                        "current_price": last_price,
                        "price_change_percentage_24h": price_change_24h,
                        "volume": float(stats.get("volume", 0))
                    })
            except (ValueError, TypeError, ZeroDivisionError) as e:
                continue
        
        # Update cache
        cache["data"] = formatted_data
        cache["timestamp"] = current_time
        print(f"Successfully fetched {len(formatted_data)} coins from Coinbase")
        
        return formatted_data
        
    except Exception as e:
        print(f"Error fetching crypto data: {e}")
        return cache["data"] or []

def format_coin_data(coin):
    """Format coin data for frontend"""
    return {
        "symbol": coin["symbol"],
        "current": coin["current_price"],
        "gain": coin["price_change_percentage_24h"]
    }

@app.route("/top-gainers")
def top_gainers():
    crypto_data = fetch_crypto_data()
    if not crypto_data:
        # Fallback data if API fails
        return jsonify([
            {"symbol": "BTC-USD", "current": 97000.0, "gain": 2.11},
            {"symbol": "ETH-USD", "current": 3500.0, "gain": 1.98}
        ])
    
    # Filter and sort gainers (positive 24h change)
    gainers = [coin for coin in crypto_data if coin.get("price_change_percentage_24h", 0) > 0]
    gainers.sort(key=lambda x: x.get("price_change_percentage_24h", 0), reverse=True)
    
    # Return top 10 gainers
    top_gainers_formatted = [format_coin_data(coin) for coin in gainers[:10]]
    return jsonify(top_gainers_formatted)

@app.route("/top-losers")
def top_losers():
    crypto_data = fetch_crypto_data()
    if not crypto_data:
        # Fallback data if API fails
        return jsonify([
            {"symbol": "ADA-USD", "current": 0.398, "gain": -1.22},
            {"symbol": "DOGE-USD", "current": 0.146, "gain": -2.71}
        ])
    
    # Filter and sort losers (negative 24h change)
    losers = [coin for coin in crypto_data if coin.get("price_change_percentage_24h", 0) < 0]
    losers.sort(key=lambda x: x.get("price_change_percentage_24h", 0))
    
    # Return top 10 losers
    top_losers_formatted = [format_coin_data(coin) for coin in losers[:10]]
    return jsonify(top_losers_formatted)

@app.route("/top-24h")
def top_24h():
    crypto_data = fetch_crypto_data()
    if not crypto_data:
        # Fallback data if API fails
        return jsonify([
            {"symbol": "BTC-USD", "gain": 5.51},
            {"symbol": "ETH-USD", "gain": 4.12}
        ])
    
    # Sort by absolute 24h change (both positive and negative)
    sorted_coins = sorted(crypto_data, 
                         key=lambda x: abs(x.get("price_change_percentage_24h", 0)), 
                         reverse=True)
    
    # Return top 5 most volatile coins for ticker
    top_24h_formatted = [
        {"symbol": coin["symbol"], "gain": coin.get("price_change_percentage_24h", 0)}
        for coin in sorted_coins[:5]
    ]
    return jsonify(top_24h_formatted)

# WebSocket events
@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Send initial data when client connects
    crypto_data = fetch_crypto_data()
    if crypto_data:
        emit('crypto_update', {
            'gainers': get_top_gainers_data(crypto_data),
            'losers': get_top_losers_data(crypto_data),
            'top24h': get_top_24h_data(crypto_data)
        })

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def get_top_gainers_data(crypto_data):
    """Get formatted gainers data"""
    gainers = [coin for coin in crypto_data if coin.get("price_change_percentage_24h", 0) > 0]
    gainers.sort(key=lambda x: x.get("price_change_percentage_24h", 0), reverse=True)
    return [format_coin_data(coin) for coin in gainers[:10]]

def get_top_losers_data(crypto_data):
    """Get formatted losers data"""
    losers = [coin for coin in crypto_data if coin.get("price_change_percentage_24h", 0) < 0]
    losers.sort(key=lambda x: x.get("price_change_percentage_24h", 0))
    return [format_coin_data(coin) for coin in losers[:10]]

def get_top_24h_data(crypto_data):
    """Get formatted top 24h data"""
    sorted_coins = sorted(crypto_data, 
                         key=lambda x: abs(x.get("price_change_percentage_24h", 0)), 
                         reverse=True)
    return [
        {"symbol": coin["symbol"], "gain": coin.get("price_change_percentage_24h", 0)}
        for coin in sorted_coins[:5]
    ]

def background_crypto_updates():
    """Background thread to send periodic updates via WebSocket"""
    while True:
        time.sleep(30)  # Update every 30 seconds
        crypto_data = fetch_crypto_data()
        if crypto_data:
            socketio.emit('crypto_update', {
                'gainers': get_top_gainers_data(crypto_data),
                'losers': get_top_losers_data(crypto_data),
                'top24h': get_top_24h_data(crypto_data)
            })
            print(f"Sent WebSocket update with {len(crypto_data)} coins")

# Start background thread
background_thread = threading.Thread(target=background_crypto_updates)
background_thread.daemon = True
background_thread.start()

if __name__ == "__main__":
    socketio.run(app, port=5001, debug=True, allow_unsafe_werkzeug=True)
