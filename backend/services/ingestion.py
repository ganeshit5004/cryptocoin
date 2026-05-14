import requests
from sqlalchemy.orm import Session
from models import CryptoAsset, MarketData
from datetime import datetime

# Top 10 by market cap
SYMBOLS = ['bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana', 'ripple', 'usdc', 'cardano', 'avalanche-2', 'dogecoin']

def fetch_and_store_data(db: Session):
    print(f"[{datetime.utcnow()}] Fetching market data from CoinGecko...")
    url = "https://api.coingecko.com/api/v3/coins/markets"
    params = {
        'vs_currency': 'usd',
        'ids': ','.join(SYMBOLS),
        'order': 'market_cap_desc',
        'per_page': 10,
        'page': 1,
        'sparkline': False
    }
    
    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        data = response.json()
        
        for item in data:
            symbol = item['symbol'].upper()
            
            # Ensure asset exists
            asset = db.query(CryptoAsset).filter(CryptoAsset.symbol == symbol).first()
            if not asset:
                asset = CryptoAsset(symbol=symbol, name=item['name'])
                db.add(asset)
                db.commit()
                
            # Check if we need to seed history (if we have fewer than 20 points)
            history_count = db.query(MarketData).filter(MarketData.symbol == symbol).count()
            if history_count < 20:
                print(f"Seeding historical data for {symbol}...")
                
                # Attempt to fetch from Binance
                binance_symbol = f"{symbol}USDT"
                binance_url = f"https://api.binance.com/api/v3/klines?symbol={binance_symbol}&interval=5m&limit=50"
                try:
                    b_res = requests.get(binance_url)
                    b_res.raise_for_status()
                    klines = b_res.json()
                    
                    from datetime import timedelta
                    # Binance kline format: [Open time, Open, High, Low, Close, Volume, ...]
                    for kline in klines:
                        open_price = float(kline[1])
                        high_price = float(kline[2])
                        low_price = float(kline[3])
                        close_price = float(kline[4])
                        vol = float(kline[5])
                        # Convert ms timestamp to datetime
                        ts = datetime.utcfromtimestamp(kline[0] / 1000.0)
                        hist_data = MarketData(
                            symbol=symbol,
                            open=open_price,
                            high=high_price,
                            low=low_price,
                            price=close_price,
                            volume=vol,
                            timestamp=ts
                        )
                        db.add(hist_data)
                    db.commit()
                    print(f"Seeded {symbol} from Binance successfully.")
                except Exception as e:
                    print(f"Binance fetch failed for {symbol}: {e}. Falling back to random walk.")
                    import random
                    from datetime import timedelta
                    current_price = item['current_price']
                    current_vol = item['total_volume']
                    for i in range(50, 0, -1):
                        hist_price = current_price * (1 + random.uniform(-0.02, 0.02) * i)
                        hist_open = hist_price * (1 + random.uniform(-0.005, 0.005))
                        hist_high = max(hist_price, hist_open) * (1 + random.uniform(0, 0.005))
                        hist_low = min(hist_price, hist_open) * (1 - random.uniform(0, 0.005))
                        hist_vol = current_vol * (1 + random.uniform(-0.1, 0.1))
                        hist_data = MarketData(
                            symbol=symbol,
                            open=max(0.0001, hist_open),
                            high=max(0.0001, hist_high),
                            low=max(0.0001, hist_low),
                            price=max(0.0001, hist_price),
                            volume=max(0, hist_vol),
                            timestamp=datetime.utcnow() - timedelta(minutes=i*5)
                        )
                        db.add(hist_data)
                    db.commit()
            
            # Add market data (live poll tick)
            market_data = MarketData(
                symbol=symbol,
                open=item['current_price'],
                high=item['current_price'],
                low=item['current_price'],
                price=item['current_price'],
                volume=item['total_volume'],
                timestamp=datetime.utcnow()
            )
            db.add(market_data)
        
        db.commit()
        print("Data ingestion successful.")
    except Exception as e:
        print(f"Error fetching data: {e}")
