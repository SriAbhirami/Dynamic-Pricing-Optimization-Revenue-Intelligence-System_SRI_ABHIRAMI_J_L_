
import os
import joblib


# Get the directory containing this file
MODEL_DIR = os.path.dirname(os.path.abspath(__file__))

# Paths to saved ML artifacts
MODEL_PATH = os.path.join(
    MODEL_DIR,
    "xgb_demand_model.joblib"
)

PREPROCESSOR_PATH = os.path.join(
    MODEL_DIR,
    "demand_preprocessor.joblib"
)


# Load the trained Improved XGBoost model
model = joblib.load(MODEL_PATH)

# Load the preprocessing pipeline
preprocessor = joblib.load(PREPROCESSOR_PATH)


print("Demand forecasting model loaded successfully!")
print("Preprocessing pipeline loaded successfully!")


# Numerical features used during training
NUMERICAL_FEATURES = [
    "base_price",
    "current_price",
    "price_change_pct",
    "discount_pct",
    "inventory_level",
    "year",
    "month",
    "day",
    "day_of_week",
    "sales_rolling_3",
    "sales_rolling_7",
    "sales_rolling_14"
]


# Categorical features used during training
CATEGORICAL_FEATURES = [
    "product_id",
    "category",
    "brand",
    "region",
    "channel",
    "season",
    "promotion_type",
    "stockout_flag"
]


# All features expected by the model
FEATURE_COLUMNS = (
    NUMERICAL_FEATURES +
    CATEGORICAL_FEATURES
)
