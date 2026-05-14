import pandas as pd
from sqlalchemy.orm import Session
from models import MarketData

def run_strategy(db: Session, symbol: str):
    # Fetch historical data for the symbol
    data = db.query(MarketData).filter(MarketData.symbol == symbol).order_by(MarketData.timestamp.asc()).all()
    
    if len(data) < 5:
        return {
            "symbol": symbol,
            "signal": "HOLD",
            "short_sma": None,
            "long_sma": None,
            "latest_price": data[-1].price if data else None,
            "reason": "Not enough data"
        }
        
    df = pd.DataFrame([{
        "timestamp": d.timestamp,
        "price": d.price
    } for d in data])
    
    # We use small windows for POC since data is polled recently
    short_window = 3
    long_window = 5
    
    df['short_sma'] = df['price'].rolling(window=short_window).mean()
    df['long_sma'] = df['price'].rolling(window=long_window).mean()
    
    latest = df.iloc[-1]
    prev = df.iloc[-2]
    
    signal = "HOLD"
    # Crossover logic
    if pd.isna(latest['long_sma']):
        signal = "HOLD"
    elif prev['short_sma'] <= prev['long_sma'] and latest['short_sma'] > latest['long_sma']:
        signal = "BUY"
    elif prev['short_sma'] >= prev['long_sma'] and latest['short_sma'] < latest['long_sma']:
        signal = "SELL"
    else:
        # If short is above long, we could be in a BUY state, but signal is HOLD
        signal = "HOLD"
        
    return {
        "symbol": symbol,
        "signal": signal,
        "short_sma": None if pd.isna(latest['short_sma']) else round(latest['short_sma'], 2),
        "long_sma": None if pd.isna(latest['long_sma']) else round(latest['long_sma'], 2),
        "latest_price": round(latest['price'], 2)
    }
