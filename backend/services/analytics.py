import pandas as pd
from sqlalchemy.orm import Session
from models import MarketData

def get_analytics(db: Session, symbol: str):
    data = db.query(MarketData).filter(MarketData.symbol == symbol).order_by(MarketData.timestamp.asc()).all()
    if len(data) < 2:
        return {"symbol": symbol, "price_change_pct": 0, "volume_change_pct": 0}
    
    df = pd.DataFrame([{
        "price": d.price,
        "volume": d.volume
    } for d in data])
    
    first_price = df.iloc[0]['price']
    last_price = df.iloc[-1]['price']
    price_change = ((last_price - first_price) / first_price) * 100 if first_price else 0
    
    first_vol = df.iloc[0]['volume']
    last_vol = df.iloc[-1]['volume']
    vol_change = ((last_vol - first_vol) / first_vol) * 100 if first_vol else 0
    
    return {
        "symbol": symbol,
        "price_change_pct": round(price_change, 2),
        "volume_change_pct": round(vol_change, 2)
    }
