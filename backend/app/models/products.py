from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime
from app.database.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    category = Column(String, nullable=False)

    # ========================================================
    # PRICING
    # ========================================================

    cost_price = Column(
        Float,
        nullable=False,
        default=0.0
    )

    current_price = Column(
        Float,
        nullable=False
    )

    # ========================================================
    # INVENTORY
    # ========================================================

    stock = Column(
        Integer,
        nullable=False
    )

    # ========================================================
    # TIMESTAMP
    # ========================================================

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )