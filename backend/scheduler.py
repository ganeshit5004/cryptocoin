from apscheduler.schedulers.background import BackgroundScheduler
from services.ingestion import fetch_and_store_data
from database import SessionLocal

scheduler = BackgroundScheduler()

def ingestion_job():
    db = SessionLocal()
    try:
        fetch_and_store_data(db)
    finally:
        db.close()

def start_scheduler():
    # Run every 30 seconds to respect free-tier API rate limits
    scheduler.add_job(ingestion_job, 'interval', seconds=30)
    scheduler.start()
