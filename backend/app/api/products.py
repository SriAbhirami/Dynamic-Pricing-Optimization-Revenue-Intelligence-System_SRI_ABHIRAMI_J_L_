from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.products import Product
from app.schemas.product import ProductCreate, ProductResponse
from fastapi import Query


router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=list[ProductResponse])
def get_products(
    name: str | None = None,
    category: str | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    sort_by: str | None = None,
    order: str = "asc",
    db: Session = Depends(get_db)
):

    query = db.query(Product)

    # Validate price range
    if (
        min_price is not None
        and max_price is not None
        and min_price > max_price
    ):
        raise HTTPException(
            status_code=400,
            detail="min_price cannot be greater than max_price"
        )

    # Validate sort order
    if order.lower() not in ["asc", "desc"]:
        raise HTTPException(
            status_code=400,
            detail="Order must be either 'asc' or 'desc'"
        )

    # Search by name
    if name:
        query = query.filter(
            Product.name.ilike(f"%{name}%")
        )

    # Filter by category
    if category:
        query = query.filter(
            Product.category.ilike(f"%{category}%")
        )

    # Filter by minimum price
    if min_price is not None:
        query = query.filter(
            Product.current_price >= min_price
        )

    # Filter by maximum price
    if max_price is not None:
        query = query.filter(
            Product.current_price <= max_price
        )

    # Allowed sort columns
    sortable_columns = {
        "name": Product.name,
        "category": Product.category,
        "current_price": Product.current_price,
        "stock": Product.stock,
        "created_at": Product.created_at,
    }

    # Apply sorting
    if sort_by:

        if sort_by not in sortable_columns:
            raise HTTPException(
                status_code=400,
                detail="Invalid sort field"
            )

        column = sortable_columns[sort_by]

        if order.lower() == "desc":
            query = query.order_by(column.desc())
        else:
            query = query.order_by(column.asc())

    # Apply pagination
    return query.offset(skip).limit(limit).all()

@router.post("/", response_model=ProductResponse)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    new_product = Product(
        name=product.name,
        category=product.category,
        current_price=product.current_price,
        stock=product.stock
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)

    return new_product

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    updated_product: ProductCreate,
    db: Session = Depends(get_db)
):
    # Find the product
    product = db.query(Product).filter(Product.id == product_id).first()

    # If product doesn't exist
    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    # Update fields
    product.name = updated_product.name
    product.category = updated_product.category
    product.current_price = updated_product.current_price
    product.stock = updated_product.stock

    # Save changes
    db.commit()

    # Refresh object from database
    db.refresh(product)

    return product

@router.delete("/{product_id}")
def delete_product(
    product_id: int,
    db: Session = Depends(get_db)
):
    product = db.query(Product).filter(Product.id == product_id).first()

    if product is None:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    db.delete(product)
    db.commit()

    return {"message": "Product deleted successfully"}