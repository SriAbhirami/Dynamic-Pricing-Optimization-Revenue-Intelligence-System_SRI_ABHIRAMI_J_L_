from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, Integer

from app.database.database import get_db
from app.models.products import Product
from app.models.users import User
from app.models.pricing_demand import PricingDemand


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    # -------------------------------------------------
    # Product Management Statistics
    # -------------------------------------------------

    total_products = db.query(Product).count()

    total_users = db.query(User).count()

    total_stock = (
        db.query(func.sum(Product.stock))
        .scalar() or 0
    )

    # -------------------------------------------------
    # Pricing & Demand Statistics
    # -------------------------------------------------

    pricing_summary = db.query(
        func.coalesce(
            func.sum(PricingDemand.revenue),
            0
        ).label("total_revenue"),

        func.coalesce(
            func.sum(PricingDemand.units_sold),
            0
        ).label("total_units_sold"),

        func.coalesce(
            func.avg(PricingDemand.demand_index),
            0
        ).label("average_demand_index"),

        func.coalesce(
            func.avg(PricingDemand.current_price),
            0
        ).label("average_current_price"),

        func.coalesce(
            func.avg(PricingDemand.discount_pct),
            0
        ).label("average_discount_pct"),

        func.coalesce(
            func.sum(
                func.cast(
                    PricingDemand.stockout_flag,
                    Integer
                )
            ),
            0
        ).label("stockout_count")
    ).first()

    return {
        # Product management
        "total_products": total_products,
        "total_users": total_users,
        "total_stock": int(total_stock),

        # Pricing & demand analytics
        "total_revenue": round(
            float(pricing_summary.total_revenue),
            2
        ),

        "total_units_sold": int(
            pricing_summary.total_units_sold
        ),

        "average_demand_index": round(
            float(pricing_summary.average_demand_index),
            2
        ),

        "average_current_price": round(
            float(pricing_summary.average_current_price),
            2
        ),

        "average_discount_pct": round(
            float(pricing_summary.average_discount_pct),
            2
        ),

        "stockout_count": int(
            pricing_summary.stockout_count
        ),

        # Keep these for now.
        # We will make them dynamic later
        # when the forecasting and recommendation
        # modules are implemented.
        "forecast_accuracy": "96.8%",
        "ai_recommendations": 23
    }