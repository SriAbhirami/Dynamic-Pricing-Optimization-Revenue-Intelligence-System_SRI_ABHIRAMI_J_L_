from app.database.database import Base, engine

# Import all models
from app.models.products import Product

Base.metadata.create_all(bind=engine)

print("Tables created successfully!")