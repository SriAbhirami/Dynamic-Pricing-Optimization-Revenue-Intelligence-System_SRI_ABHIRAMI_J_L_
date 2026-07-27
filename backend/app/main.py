from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine

# Import models
from app.models.products import Product
from app.models.users import User

# Import routers
from app.api.products import router as product_router
from app.api.users import router as user_router
from app.api.dashboard import router as dashboard_router

app = FastAPI(
    title="PricePilot AI API",
    description="Dynamic Pricing Optimization & Revenue Intelligence System",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "Welcome to PricePilot AI 🚀"
    }


# Register API Routers
app.include_router(product_router)
app.include_router(user_router)
app.include_router(dashboard_router)