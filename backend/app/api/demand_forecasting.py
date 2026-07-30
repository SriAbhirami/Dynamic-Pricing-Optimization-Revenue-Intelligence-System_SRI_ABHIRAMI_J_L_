from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.ml.demand_forecasting.predict import predict_demand


router = APIRouter(
    prefix="/demand-forecast",
    tags=["Demand Forecasting"]
)


class DemandForecastRequest(BaseModel):
    base_price: float
    current_price: float
    price_change_pct: float
    discount_pct: float
    inventory_level: float

    year: int
    month: int
    day: int
    day_of_week: int

    sales_rolling_3: float
    sales_rolling_7: float
    sales_rolling_14: float

    product_id: str
    category: str
    brand: str
    region: str
    channel: str
    season: str
    promotion_type: str
    stockout_flag: int


class DemandForecastResponse(BaseModel):
    predicted_demand_index: float


@router.post(
    "/predict",
    response_model=DemandForecastResponse
)
def predict_demand_index(data: DemandForecastRequest):

    try:
        prediction = predict_demand(
            data.model_dump()
        )

        return {
            "predicted_demand_index": round(
                float(prediction),
                2
            )
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Demand prediction failed: {str(e)}"
        )