from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, SessionLocal
from api.endpoints import router
from scheduler import start_scheduler, ingestion_job
import threading

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Crypto Market Data & Analytics App")

# Allow CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.on_event("startup")
def on_startup():
    print("Starting background scheduler...")
    start_scheduler()
    
    # Run a first ingestion in a separate thread to not block startup
    threading.Thread(target=ingestion_job).start()

@app.get("/")
def root():
    return {"message": "Crypto Market Data API is running"}
