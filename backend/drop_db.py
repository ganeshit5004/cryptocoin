from database import engine, Base
import models

print("Dropping tables...")
Base.metadata.drop_all(bind=engine)
print("Tables dropped. They will be recreated on next reload.")
