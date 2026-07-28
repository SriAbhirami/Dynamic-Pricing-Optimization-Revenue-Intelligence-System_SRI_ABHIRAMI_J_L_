from datetime import date
from pydantic import BaseModel, ConfigDict


class PricingDemandResponse(BaseModel):
    id: int
    date: date
    product_id: str
    category: str
    brand: str
    region: str
    channel: str
    season: str
    base_price: float
    current_price: float
    price_change_pct: float
    discount_pct: float
    promotion_type: str | None
    units_sold: int
    revenue: float
    inventory_level: int
    stockout_flag: bool
    demand_index: float

    model_config = ConfigDict(from_attributes=True)