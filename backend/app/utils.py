import requests
import time
from typing import List, Dict, Tuple, Union

# --- Price Tracking ---
price_history: Dict[str, List[Tuple[float, float]]] = {}

def get_current_prices(products: List[str]) -> Dict[str, float]:
    prices = {}
    for product in products:
        url = f"https://api.exchange.coinbase.com/products/{product}/ticker"
        response = requests.get(url)
        if response.ok:
            prices[product] = float(response.json().get("price", 0))
    return prices

def calculate_interval_changes(product_prices: Dict[str, float], interval: int = 180) -> Dict[str, float]:
    global price_history
    now = time.time()
    changes = {}

    for product, price in product_prices.items():
        if product not in price_history:
            price_history[product] = []

        price_history[product].append((now, price))
        price_history[product] = [
            (t, p) for (t, p) in price_history[product] if now - t <= interval
        ]

        if len(price_history[product]) > 1:
            oldest_price = price_history[product][0][1]
            changes[product] = round(((price - oldest_price) / oldest_price) * 100, 4)
        else:
            changes[product] = 0.0

    return changes

# --- Volume Tracking ---
volume_history: Dict[str, List[Tuple[float, float]]] = {}

def get_1h_volume_weighted_data(products: List[str], interval: int = 3600) -> Dict[str, float]:
    now = time.time()
    changes = {}

    for product in products:
        url = f"https://api.exchange.coinbase.com/products/{product}/stats"
        try:
            response = requests.get(url, timeout=5)
            if not response.ok:
                continue

            volume = float(response.json().get("volume", 0))

            if product not in volume_history:
                volume_history[product] = []
            volume_history[product].append((now, volume))

            # Remove old entries
            volume_history[product] = [
                (t, v) for (t, v) in volume_history[product] if now - t <= interval
            ]

            if len(volume_history[product]) > 1:
                oldest_volume = volume_history[product][0][1]
                percent_change = ((volume - oldest_volume) / oldest_volume) * 100 if oldest_volume else 0
                changes[product] = round(percent_change, 2)

        except Exception as e:
            print(f"[Volume Error] {product}: {e}")

    return changes

# --- Formatters ---
def format_crypto_data(percent_changes: Dict[str, float]) -> List[Dict[str, Union[str, float]]]:
    return sorted(
        [{"product": product, "percent_change": change} for product, change in percent_changes.items()],
        key=lambda x: x["percent_change"],
        reverse=True
    )

def format_banner_data(products_24h: List[Dict[str, Union[str, float]]]) -> List[Dict[str, Union[str, float]]]:
    return sorted(products_24h, key=lambda x: x["percent_change"], reverse=True)
