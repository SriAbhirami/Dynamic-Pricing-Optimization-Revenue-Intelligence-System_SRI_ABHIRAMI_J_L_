from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, Integer
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.pricing_demand import PricingDemand
from app.schemas.pricing_demand import PricingDemandResponse


router = APIRouter(
    prefix="/pricing-demand",
    tags=["Pricing & Demand"]
)


@router.get("/", response_model=list[PricingDemandResponse])
def get_pricing_demand(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = None,
    brand: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    season: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingDemand)

    # Apply filters only when provided
    if category:
        query = query.filter(PricingDemand.category == category)

    if brand:
        query = query.filter(PricingDemand.brand == brand)

    if region:
        query = query.filter(PricingDemand.region == region)

    if channel:
        query = query.filter(PricingDemand.channel == channel)

    if season:
        query = query.filter(PricingDemand.season == season)

    # Pagination
    offset = (page - 1) * limit

    data = (
        query
        .order_by(PricingDemand.id)
        .offset(offset)
        .limit(limit)
        .all()
    )

    return data

@router.get("/summary")
def get_pricing_demand_summary(
    category: str | None = None,
    brand: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    season: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingDemand)

    # Apply the same filters
    if category:
        query = query.filter(PricingDemand.category == category)

    if brand:
        query = query.filter(PricingDemand.brand == brand)

    if region:
        query = query.filter(PricingDemand.region == region)

    if channel:
        query = query.filter(PricingDemand.channel == channel)

    if season:
        query = query.filter(PricingDemand.season == season)

    # Calculate summary metrics
    summary = query.with_entities(
        func.coalesce(func.sum(PricingDemand.revenue), 0).label("total_revenue"),
        func.coalesce(func.sum(PricingDemand.units_sold), 0).label("total_units_sold"),
        func.coalesce(func.avg(PricingDemand.demand_index), 0).label("average_demand_index"),
        func.coalesce(func.avg(PricingDemand.discount_pct), 0).label("average_discount_pct"),
        func.coalesce(func.avg(PricingDemand.current_price), 0).label("average_current_price"),
        func.count(PricingDemand.product_id.distinct()).label("number_of_products"),
        func.coalesce(
            func.sum(
                func.cast(PricingDemand.stockout_flag, Integer)
            ),
            0
        ).label("stockout_count")
    ).first()

    return {
        "total_revenue": round(float(summary.total_revenue), 2),
        "total_units_sold": int(summary.total_units_sold),
        "average_demand_index": round(float(summary.average_demand_index), 2),
        "average_discount_pct": round(float(summary.average_discount_pct), 2),
        "average_current_price": round(float(summary.average_current_price), 2),
        "number_of_products": int(summary.number_of_products),
        "stockout_count": int(summary.stockout_count)
    }
    
@router.get("/trends")
def get_pricing_demand_trends(
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingDemand)

    # Apply filters
    if category:
        query = query.filter(PricingDemand.category == category)

    if region:
        query = query.filter(PricingDemand.region == region)

    if channel:
        query = query.filter(PricingDemand.channel == channel)

    # Group data by date
    trends = (
        query
        .with_entities(
            PricingDemand.date,
            func.sum(PricingDemand.revenue).label("revenue"),
            func.sum(PricingDemand.units_sold).label("units_sold"),
            func.avg(PricingDemand.demand_index).label("demand_index")
        )
        .group_by(PricingDemand.date)
        .order_by(PricingDemand.date)
        .all()
    )

    return [
        {
            "date": row.date,
            "revenue": round(float(row.revenue or 0), 2),
            "units_sold": int(row.units_sold or 0),
            "demand_index": round(float(row.demand_index or 0), 2)
        }
        for row in trends
    ]
    
@router.get("/category-performance")
def get_category_performance(
    region: str | None = None,
    channel: str | None = None,
    season: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingDemand)

    # Apply filters
    if region:
        query = query.filter(PricingDemand.region == region)

    if channel:
        query = query.filter(PricingDemand.channel == channel)

    if season:
        query = query.filter(PricingDemand.season == season)

    # Group by category
    category_data = (
        query
        .with_entities(
            PricingDemand.category,

            func.sum(
                PricingDemand.revenue
            ).label("revenue"),

            func.sum(
                PricingDemand.units_sold
            ).label("units_sold"),

            func.avg(
                PricingDemand.demand_index
            ).label("demand_index"),

            func.avg(
                PricingDemand.discount_pct
            ).label("average_discount"),

            # NEW:
            # Average current selling price for the category
            func.avg(
                PricingDemand.current_price
            ).label("average_current_price")
        )
        .group_by(
            PricingDemand.category
        )
        .order_by(
            func.sum(
                PricingDemand.revenue
            ).desc()
        )
        .all()
    )

    return [
        {
            "category": row.category,

            "revenue": round(
                float(row.revenue or 0),
                2
            ),

            "units_sold": int(
                row.units_sold or 0
            ),

            "demand_index": round(
                float(row.demand_index or 0),
                2
            ),

            "average_discount": round(
                float(row.average_discount or 0),
                2
            ),

            # NEW:
            "average_current_price": round(
                float(row.average_current_price or 0),
                2
            )
        }
        for row in category_data
    ]
@router.get("/price-analysis")
def get_price_analysis(
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingDemand)

    # Apply filters
    if category:
        query = query.filter(PricingDemand.category == category)

    if region:
        query = query.filter(PricingDemand.region == region)

    if channel:
        query = query.filter(PricingDemand.channel == channel)

    price_data = (
        query
        .with_entities(
            PricingDemand.current_price,
            func.avg(PricingDemand.demand_index).label("demand_index"),
            func.sum(PricingDemand.units_sold).label("units_sold"),
            func.sum(PricingDemand.revenue).label("revenue"),
            func.avg(PricingDemand.discount_pct).label("discount_pct")
        )
        .group_by(PricingDemand.current_price)
        .order_by(PricingDemand.current_price)
        .all()
    )

    return [
        {
            "current_price": round(float(row.current_price), 2),
            "demand_index": round(float(row.demand_index or 0), 2),
            "units_sold": int(row.units_sold or 0),
            "revenue": round(float(row.revenue or 0), 2),
            "discount_pct": round(float(row.discount_pct or 0), 2)
        }
        for row in price_data
    ]
    
@router.get("/inventory")
def get_inventory_analysis(
    category: str | None = None,
    region: str | None = None,
    channel: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingDemand)

    # Apply filters
    if category:
        query = query.filter(PricingDemand.category == category)

    if region:
        query = query.filter(PricingDemand.region == region)

    if channel:
        query = query.filter(PricingDemand.channel == channel)

    inventory_data = (
        query
        .with_entities(
            PricingDemand.category,
            func.avg(PricingDemand.inventory_level).label("average_inventory"),
            func.sum(PricingDemand.units_sold).label("units_sold"),
            func.sum(
                func.cast(PricingDemand.stockout_flag, Integer)
            ).label("stockout_count"),
            func.avg(PricingDemand.demand_index).label("demand_index")
        )
        .group_by(PricingDemand.category)
        .order_by(
            func.sum(
                func.cast(PricingDemand.stockout_flag, Integer)
            ).desc()
        )
        .all()
    )

    return [
        {
            "category": row.category,
            "average_inventory": round(
                float(row.average_inventory or 0), 2
            ),
            "units_sold": int(row.units_sold or 0),
            "stockout_count": int(row.stockout_count or 0),
            "demand_index": round(
                float(row.demand_index or 0), 2
            )
        }
        for row in inventory_data
    ]
    
@router.get("/products")
def get_dataset_products(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    category: str | None = None,
    brand: str | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(PricingDemand)

    # Filters
    if category:
        query = query.filter(
            PricingDemand.category == category
        )

    if brand:
        query = query.filter(
            PricingDemand.brand == brand
        )

    # Get total number of unique products
    total = query.with_entities(
        PricingDemand.product_id
    ).distinct().count()

    # Aggregate product-level information
    product_data = (
        query
        .with_entities(
            PricingDemand.product_id,
            PricingDemand.category,
            PricingDemand.brand,

            func.avg(
                PricingDemand.current_price
            ).label("average_price"),

            func.sum(
                PricingDemand.units_sold
            ).label("total_units_sold"),

            func.sum(
                PricingDemand.revenue
            ).label("total_revenue"),

            func.avg(
                PricingDemand.demand_index
            ).label("average_demand_index"),

            func.avg(
                PricingDemand.discount_pct
            ).label("average_discount"),

            func.avg(
                PricingDemand.inventory_level
            ).label("average_inventory"),

            func.sum(
                func.cast(
                    PricingDemand.stockout_flag,
                    Integer
                )
            ).label("stockout_count")
        )
        .group_by(
            PricingDemand.product_id,
            PricingDemand.category,
            PricingDemand.brand
        )
        .order_by(
            func.sum(
                PricingDemand.revenue
            ).desc()
        )
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "items": [
            {
                "product_id": row.product_id,
                "category": row.category,
                "brand": row.brand,
                "average_price": round(
                    float(row.average_price or 0), 2
                ),
                "total_units_sold": int(
                    row.total_units_sold or 0
                ),
                "total_revenue": round(
                    float(row.total_revenue or 0), 2
                ),
                "average_demand_index": round(
                    float(row.average_demand_index or 0), 2
                ),
                "average_discount": round(
                    float(row.average_discount or 0), 2
                ),
                "average_inventory": round(
                    float(row.average_inventory or 0), 2
                ),
                "stockout_count": int(
                    row.stockout_count or 0
                )
            }
            for row in product_data
        ],
        "total": total,
        "page": page,
        "limit": limit
    }