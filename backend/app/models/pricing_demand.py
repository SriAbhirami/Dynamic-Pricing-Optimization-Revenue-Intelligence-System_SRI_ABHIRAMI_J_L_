from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from app.database.database import Base


class PricingDemand(Base):

    __tablename__ = "pricing_demand"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date)

    product_id = Column(String)

    category = Column(String)

    brand = Column(String)

    region = Column(String)

    channel = Column(String)

    season = Column(String)

    base_price = Column(Float)

    current_price = Column(Float)

    price_change_pct = Column(Float)

    discount_pct = Column(Float)

    promotion_type = Column(String)

    units_sold = Column(Integer)

    revenue = Column(Float)

    inventory_level = Column(Integer)

    stockout_flag = Column(Boolean)

    demand_index = Column(Float)