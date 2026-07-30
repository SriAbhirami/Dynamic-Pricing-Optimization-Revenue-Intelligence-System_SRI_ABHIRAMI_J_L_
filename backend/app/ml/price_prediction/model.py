from pathlib import Path

import joblib


# Get the directory containing this file
BASE_DIR = Path(__file__).resolve().parent


# Paths to the trained model and preprocessing pipeline
MODEL_PATH = BASE_DIR / "xgb_price_model.joblib"
PREPROCESSOR_PATH = BASE_DIR / "price_preprocessor.joblib"


# Load trained XGBoost model
model = joblib.load(MODEL_PATH)


# Load preprocessing pipeline
preprocessor = joblib.load(PREPROCESSOR_PATH)


# These MUST match the features used during model training
FEATURE_COLUMNS = [
    "base_price",
    "units_sold",
    "inventory_level",
    "stockout_flag",
    "demand_index",
    "year",
    "month",
    "day",
    "day_of_week",
    "product_id",
    "category",
    "brand",
    "region",
    "channel",
    "season",
    "promotion_type",
]