from sqlalchemy import Column, Integer, String, Float, DateTime
from database import Base
import datetime

class CryptoAsset(Base):
    __tablename__ = "assets"

    symbol = Column(String, primary_key=True, index=True)
    name = Column(String)

class MarketData(Base):
    __tablename__ = "market_data"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True)
    open = Column(Float, nullable=True)
    high = Column(Float, nullable=True)
    low = Column(Float, nullable=True)
    price = Column(Float) # This acts as 'close'
    volume = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow, index=True)
