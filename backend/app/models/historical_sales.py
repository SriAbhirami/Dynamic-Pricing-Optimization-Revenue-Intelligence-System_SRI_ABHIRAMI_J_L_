from sqlalchemy import Column, Integer, String, Date, Float
from app.database.database import Base


class HistoricalSales(Base):

    __tablename__ = "historical_sales"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    product_id = Column(
        String,
        index=True
    )

    store_id = Column(
        String,
        index=True
    )

    date = Column(
        Date,
        index=True
    )

    sales = Column(
        Float,
        default=0
    )

    revenue = Column(
        Float,
        default=0
    )

    stock = Column(
        Float,
        default=0
    )

    price = Column(
        Float,
        default=0
    )