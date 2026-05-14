from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import requests
from datetime import datetime

from database import get_db
import models
import schemas
from services.analytics import get_analytics
from services.strategy import run_strategy

import time

router = APIRouter()

CG_ID_MAP = {
    'BTC': 'bitcoin', 'ETH': 'ethereum', 'USDT': 'tether', 'BNB': 'binancecoin',
    'SOL': 'solana', 'XRP': 'ripple', 'USDC': 'usdc', 'ADA': 'cardano',
    'AVAX': 'avalanche-2', 'DOGE': 'dogecoin'
}

# Simple in-memory cache to prevent 429 errors from CoinGecko
# Format: { 'symbol': { 'data': [...], 'timestamp': 1234567890 } }
DAILY_CACHE = {}
CACHE_TTL = 300 # 5 minutes

@router.get("/markets", response_model=List[schemas.Asset])
def read_markets(db: Session = Depends(get_db)):
    assets = db.query(models.CryptoAsset).all()
    return assets

@router.get("/prices", response_model=schemas.MarketDataResponse)
def read_latest_price(symbol: str, db: Session = Depends(get_db)):
    data = db.query(models.MarketData).filter(models.MarketData.symbol == symbol.upper()).order_by(models.MarketData.timestamp.desc()).first()
    if not data:
        raise HTTPException(status_code=404, detail="Data not found")
    return data

@router.get("/history", response_model=List[schemas.MarketDataResponse])
def read_history(symbol: str, limit: int = 100, db: Session = Depends(get_db)):
    data = db.query(models.MarketData).filter(models.MarketData.symbol == symbol.upper()).order_by(models.MarketData.timestamp.desc()).limit(limit).all()
    return data

@router.get("/history/daily")
def read_daily_history(symbol: str, days: int = 5):
    sym = symbol.upper()
    cg_id = CG_ID_MAP.get(sym)
    if not cg_id:
        raise HTTPException(status_code=400, detail="Unsupported symbol for daily history")
    
    # Check cache first
    now = time.time()
    if sym in DAILY_CACHE and now - DAILY_CACHE[sym]['timestamp'] < CACHE_TTL:
        return DAILY_CACHE[sym]['data']
    
    url = f"https://api.coingecko.com/api/v3/coins/{cg_id}/market_chart"
    params = {'vs_currency': 'usd', 'days': days, 'interval': 'daily'}
    
    try:
        response = requests.get(url, params=params)
        
        # If rate limited, try to return stale cache if available
        if response.status_code == 429:
            if sym in DAILY_CACHE:
                return DAILY_CACHE[sym]['data']
            else:
                raise HTTPException(status_code=429, detail="Rate limit exceeded from CoinGecko. Please wait a few minutes.")
                
        response.raise_for_status()
        data = response.json()
        
        # Parse prices [timestamp, price]
        prices = data.get('prices', [])
        # Often returns days+1 elements, slice the last 'days' elements
        prices = prices[-days:]
        
        result = []
        for p in prices:
            ts = datetime.utcfromtimestamp(p[0] / 1000.0)
            result.append({
                "timestamp": ts.isoformat(),
                "price": p[1]
            })
            
        # Reverse to show newest first
        final_data = result[::-1]
        
        # Update cache
        DAILY_CACHE[sym] = {
            'data': final_data,
            'timestamp': now
        }
        
        return final_data
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/analytics", response_model=schemas.AnalyticsResponse)
def get_asset_analytics(symbol: str, db: Session = Depends(get_db)):
    return get_analytics(db, symbol.upper())

@router.post("/strategy/run", response_model=schemas.StrategySignal)
def execute_strategy(symbol: str, db: Session = Depends(get_db)):
    return run_strategy(db, symbol.upper())
