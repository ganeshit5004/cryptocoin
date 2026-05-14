from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class AssetBase(BaseModel):
    symbol: str
    name: str

class Asset(AssetBase):
    class Config:
        from_attributes = True

class MarketDataResponse(BaseModel):
    symbol: str
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    price: float
    volume: float
    timestamp: datetime

    class Config:
        from_attributes = True

class AnalyticsResponse(BaseModel):
    symbol: str
    price_change_pct: Optional[float]
    volume_change_pct: Optional[float]

class StrategySignal(BaseModel):
    symbol: str
    signal: str  # BUY, SELL, HOLD
    short_sma: Optional[float]
    long_sma: Optional[float]
    latest_price: Optional[float]
