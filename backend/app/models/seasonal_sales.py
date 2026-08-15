from sqlalchemy import Column, Integer, String, Date, Float
from app.database.database import Base


class SeasonalSales(Base):

    __tablename__ = "seasonal_sales"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    # ========================================================
    # ORDER INFORMATION
    # ========================================================

    order_id = Column(
        String,
        index=True,
        nullable=True
    )

    order_date = Column(
        Date,
        index=True,
        nullable=False
    )

    # ========================================================
    # CUSTOMER INFORMATION
    # ========================================================

    customer_id = Column(
        String,
        index=True,
        nullable=True
    )

    customer_age = Column(
        Integer,
        nullable=True
    )

    customer_gender = Column(
        String,
        nullable=True
    )

    # ========================================================
    # PRODUCT INFORMATION
    # ========================================================

    product_id = Column(
        String,
        index=True,
        nullable=True
    )

    category = Column(
        String,
        index=True,
        nullable=False
    )

    # ========================================================
    # SALES INFORMATION
    # ========================================================

    price = Column(
        Float,
        default=0
    )

    discount = Column(
        Float,
        default=0
    )

    quantity = Column(
        Float,
        default=0
    )

    total_amount = Column(
        Float,
        default=0
    )

    profit_margin = Column(
        Float,
        default=0
    )

    # ========================================================
    # PAYMENT / LOCATION
    # ========================================================

    payment_method = Column(
        String,
        nullable=True
    )

    region = Column(
        String,
        nullable=True
    )

    # ========================================================
    # DELIVERY / RETURN
    # ========================================================

    delivery_time_days = Column(
        Integer,
        nullable=True
    )

    returned = Column(
        String,
        nullable=True
    )

    shipping_cost = Column(
        Float,
        default=0
    )