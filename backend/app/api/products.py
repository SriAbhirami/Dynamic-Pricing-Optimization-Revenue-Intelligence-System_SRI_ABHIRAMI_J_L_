from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.products import Product
from app.models.pricing_demand import PricingDemand
from app.schemas.product import (
    ProductCreate,
    ProductResponse,
    ProductListResponse,
)
from app.auth.oauth2 import (
    get_current_user,
    require_admin,
)


router = APIRouter(
    prefix="/products",
    tags=["Products"],
)


# ============================================================
# GET PRODUCTS
# Accessible by: ADMIN + ANALYST
# ============================================================

@router.get("/", response_model=ProductListResponse)
def get_products(
    current_user=Depends(get_current_user),
    name: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str | None = None,
    order: str = "asc",
    db: Session = Depends(get_db),
):

    query = db.query(Product)

    # -----------------------
    # Validation
    # -----------------------

    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=400,
            detail="min_price cannot be greater than max_price",
        )

    if order.lower() not in ["asc", "desc"]:
        raise HTTPException(
            status_code=400,
            detail="Order must be either 'asc' or 'desc'",
        )

    # -----------------------
    # Filters
    # -----------------------

    if name:
        query = query.filter(
            Product.name.ilike(f"%{name}%")
        )

    if category:
        query = query.filter(
            Product.category.ilike(f"%{category}%")
        )

    if min_price is not None:
        query = query.filter(
            Product.current_price >= min_price
        )

    if max_price is not None:
        query = query.filter(
            Product.current_price <= max_price
        )

    # -----------------------
    # Sorting
    # -----------------------

    sortable_columns = {
        "name": Product.name,
        "category": Product.category,
        "current_price": Product.current_price,
        "stock": Product.stock,
        "created_at": Product.created_at,
    }

    if sort_by:

        if sort_by not in sortable_columns:
            raise HTTPException(
                status_code=400,
                detail="Invalid sort field",
            )

        column = sortable_columns[sort_by]

        if order.lower() == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    # -----------------------
    # Total Count
    # -----------------------

    total = query.count()

    # -----------------------
    # Pagination
    # -----------------------

    products = (
        query
        .offset(skip)
        .limit(limit)
        .all()
    )

    return {
        "items": products,
        "total": total,
        "page": (skip // limit) + 1,
        "limit": limit,
    }


# ============================================================
# DATASET PRODUCT CATALOG
# Accessible by: ADMIN + ANALYST
# ============================================================

@router.get("/catalog")
def get_product_catalog(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    products = (
        db.query(
            PricingDemand.product_id,
            PricingDemand.category,
            PricingDemand.brand,
            func.avg(
                PricingDemand.current_price
            ).label("average_price"),
            func.avg(
                PricingDemand.inventory_level
            ).label("average_inventory"),
            func.sum(
                PricingDemand.units_sold
            ).label("total_units_sold"),
            func.avg(
                PricingDemand.demand_index
            ).label("average_demand_index"),
        )
        .group_by(
            PricingDemand.product_id,
            PricingDemand.category,
            PricingDemand.brand,
        )
        .order_by(PricingDemand.product_id)
        .all()
    )

    return [
        {
            "product_id": row.product_id,
            "category": row.category,
            "brand": row.brand,
            "average_price": round(
                float(row.average_price or 0),
                2,
            ),
            "average_inventory": round(
                float(row.average_inventory or 0),
                2,
            ),
            "total_units_sold": int(
                row.total_units_sold or 0
            ),
            "average_demand_index": round(
                float(row.average_demand_index or 0),
                2,
            ),
        }
        for row in products
    ]


# ============================================================
# CREATE PRODUCT
# Accessible by: ADMIN ONLY
# ============================================================

@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):

    new_product = Product(
        name=product.name,
        category=product.category,
        current_price=product.current_price,
        stock=product.stock,
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product


# ============================================================
# UPDATE PRODUCT
# Accessible by: ADMIN ONLY
# ============================================================

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    updated_product: ProductCreate,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    product.name = updated_product.name
    product.category = updated_product.category
    product.current_price = updated_product.current_price
    product.stock = updated_product.stock

    db.commit()
    db.refresh(product)

    return product


# ============================================================
# DELETE PRODUCT
# Accessible by: ADMIN ONLY
# ============================================================

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    current_user=Depends(require_admin),
    db: Session = Depends(get_db),
):

    product = (
        db.query(Product)
        .filter(Product.id == product_id)
        .first()
    )

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found",
        )

    db.delete(product)
    db.commit()

    return {
        "message": "Product deleted successfully"
    }