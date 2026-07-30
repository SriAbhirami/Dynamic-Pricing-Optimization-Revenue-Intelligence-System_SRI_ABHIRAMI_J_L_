import os
import joblib
import pandas as pd

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel


# ============================================================
# Router
# ============================================================

router = APIRouter(
    prefix="/price-prediction",
    tags=["Price Prediction"],
)


# ============================================================
# Model Paths
# ============================================================

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(
    CURRENT_DIR,
    "..",
    "ml",
    "price_prediction",
    "xgb_price_model.joblib",
)

PREPROCESSOR_PATH = os.path.join(
    CURRENT_DIR,
    "..",
    "ml",
    "price_prediction",
    "price_preprocessor.joblib",
)


# ============================================================
# Load Model and Preprocessor
# ============================================================

try:

    model = joblib.load(
        MODEL_PATH
    )

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    print("Price prediction model loaded successfully.")

except Exception as error:

    model = None
    preprocessor = None

    print(
        "Warning: Could not load price prediction model:",
        error,
    )


# ============================================================
# Request Schema
# ============================================================

class PricePredictionRequest(BaseModel):

    base_price: float

    units_sold: float

    inventory_level: float

    stockout_flag: int

    demand_index: float

    year: int

    month: int

    day: int

    day_of_week: int

    product_id: str

    category: str

    brand: str

    region: str

    channel: str

    season: str

    promotion_type: str


# ============================================================
# Response Schema
# ============================================================

class PricePredictionResponse(BaseModel):

    predicted_price: float


# ============================================================
# Predict Price
# ============================================================

@router.post(
    "/predict",
    response_model=PricePredictionResponse,
)
def predict_price(
    request: PricePredictionRequest,
):

    # --------------------------------------------------------
    # Check model availability
    # --------------------------------------------------------

    if model is None or preprocessor is None:

        raise HTTPException(
            status_code=500,
            detail="Price prediction model is not available.",
        )


    try:

        # ----------------------------------------------------
        # Convert request into DataFrame
        # ----------------------------------------------------

        input_data = pd.DataFrame(
            [
                {
                    "base_price": request.base_price,
                    "units_sold": request.units_sold,
                    "inventory_level": request.inventory_level,
                    "stockout_flag": request.stockout_flag,
                    "demand_index": request.demand_index,
                    "year": request.year,
                    "month": request.month,
                    "day": request.day,
                    "day_of_week": request.day_of_week,
                    "product_id": request.product_id,
                    "category": request.category,
                    "brand": request.brand,
                    "region": request.region,
                    "channel": request.channel,
                    "season": request.season,
                    "promotion_type": request.promotion_type,
                }
            ]
        )


        # ----------------------------------------------------
        # Preprocess input
        # ----------------------------------------------------

        processed_data = preprocessor.transform(
            input_data
        )


        # ----------------------------------------------------
        # Generate prediction
        # ----------------------------------------------------

        prediction = model.predict(
            processed_data
        )


        predicted_price = float(
            prediction[0]
        )


        # ----------------------------------------------------
        # Return result
        # ----------------------------------------------------

        return PricePredictionResponse(
            predicted_price=round(
                predicted_price,
                2,
            )
        )


    except Exception as error:

        print(
            "Price prediction error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate price prediction: "
                f"{str(error)}"
            ),
        )