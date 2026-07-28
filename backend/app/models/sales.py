from sqlalchemy import Column, Integer, String, Float, Date, Boolean
from app.database.database import Base


class Sale(Base):

    __tablename__ = "sales"


    id = Column(Integer, primary_key=True, index=True)

    order_id = Column(String, unique=True)

    customer_id = Column(String)

    date = Column(Date)

    age = Column(Integer)

    gender = Column(String)

    city = Column(String)

    product_category = Column(String)

    unit_price = Column(Float)

    quantity = Column(Integer)

    discount_amount = Column(Float)

    total_amount = Column(Float)

    payment_method = Column(String)

    device_type = Column(String)

    session_duration_minutes = Column(Integer)

    pages_viewed = Column(Integer)

    is_returning_customer = Column(Boolean)

    delivery_time_days = Column(Integer)

    customer_rating = Column(Float)