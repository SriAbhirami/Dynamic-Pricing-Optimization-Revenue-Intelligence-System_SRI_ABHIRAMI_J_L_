from fastapi import FastAPI

from app.database.database import Base, engine

# Import models
from app.models.products import Product
from app.models.users import User

# Import routers
from app.api.products import router as product_router
from app.api.users import router as user_router

app = FastAPI()

# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {"message": "Welcome to PricePilot AI"}

# Product routes
app.include_router(product_router)

# User routes
app.include_router(user_router)