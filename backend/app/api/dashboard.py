from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.products import Product
from app.models.users import User

router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"]
)


@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):

    total_products = db.query(Product).count()

    total_users = db.query(User).count()

    total_stock = (
        db.query(func.sum(Product.stock))
        .scalar() or 0
    )

    average_price = (
        db.query(func.avg(Product.current_price))
        .scalar() or 0
    )

    return {
        "total_products": total_products,
        "total_users": total_users,
        "total_stock": total_stock,
        "average_price": round(average_price, 2),
        "forecast_accuracy": "96.8%",
        "ai_recommendations": 23
    }