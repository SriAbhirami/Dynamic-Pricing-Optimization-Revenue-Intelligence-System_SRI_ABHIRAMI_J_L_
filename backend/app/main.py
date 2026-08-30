from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import Base, engine

# Import models
from app.models.products import Product
from app.models.users import User
from app.models.sales import Sale
from app.models.pricing_demand import PricingDemand
from app.models.historical_sales import HistoricalSales
from app.models.seasonal_sales import SeasonalSales


# Import routers
from app.api.products import router as product_router
from app.api.users import router as user_router
from app.api.dashboard import router as dashboard_router
from app.api.demand_forecasting import router as demand_forecasting_router
from app.api import price_prediction
from app.routers.pricing_demand import router as pricing_demand_router
from app.api.competitor_analysis import router as competitor_analysis_router
from app.api.profitability_analytics import router as profitability_router
from app.api.business_intelligence import router as business_intelligence_router

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
app.include_router(pricing_demand_router)
app.include_router(demand_forecasting_router)
app.include_router(price_prediction.router)
app.include_router(competitor_analysis_router)
app.include_router(profitability_router)
app.include_router(business_intelligence_router)