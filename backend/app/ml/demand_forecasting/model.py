# ============================================================
# DEMAND FORECASTING MODEL LOADER
# ============================================================
#
# Purpose:
#     Load the production demand forecasting model and
#     preprocessing pipeline used by the Demand Forecasting
#     Engine.
#
# Production model:
#     Random Forest
#
# ============================================================

from pathlib import Path
import joblib


# ============================================================
# PROJECT PATH
# ============================================================

# model.py location:
#
# backend/
#   app/
#     ml/
#       demand_forecasting/
#         model.py
#
# Project root is four levels above this file.

CURRENT_FILE = Path(__file__).resolve()

PROJECT_ROOT = CURRENT_FILE.parents[4]


# ============================================================
# PRODUCTION MODEL DIRECTORY
# ============================================================

MODEL_DIR = (
    PROJECT_ROOT
    / "models"
    / "demand_forecasting"
)


# ============================================================
# MODEL FILE
# ============================================================

MODEL_PATH = (
    MODEL_DIR
    / "demand_forecasting_model.joblib"
)


# ============================================================
# PREPROCESSOR FILE
# ============================================================

PREPROCESSOR_PATH = (
    MODEL_DIR
    / "demand_preprocessor.joblib"
)


# ============================================================
# VERIFY MODEL
# ============================================================

if not MODEL_PATH.exists():

    raise FileNotFoundError(
        "Demand forecasting model not found:\n"
        f"{MODEL_PATH}"
    )


# ============================================================
# VERIFY PREPROCESSOR
# ============================================================

if not PREPROCESSOR_PATH.exists():

    raise FileNotFoundError(
        "Demand forecasting preprocessor not found:\n"
        f"{PREPROCESSOR_PATH}"
    )


# ============================================================
# LOAD PRODUCTION MODEL
# ============================================================

model = joblib.load(
    MODEL_PATH
)


# ============================================================
# LOAD PREPROCESSOR
# ============================================================

preprocessor = joblib.load(
    PREPROCESSOR_PATH
)


# ============================================================
# MODEL INFORMATION
# ============================================================

print(
    "=" * 60
)

print(
    "DEMAND FORECASTING MODEL LOADED"
)

print(
    "=" * 60
)

print(
    f"Production model: "
    f"{type(model).__name__}"
)

print(
    f"Model path: "
    f"{MODEL_PATH}"
)

print(
    f"Preprocessor path: "
    f"{PREPROCESSOR_PATH}"
)

print(
    "=" * 60
)


# ============================================================
# FEATURE DEFINITIONS
# ============================================================
#
# IMPORTANT:
#
# These MUST match the features used by the API prediction
# model, NOT the offline historical forecasting dataset.
#
# ============================================================


# ------------------------------------------------------------
# Numerical features
# ------------------------------------------------------------

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


# ------------------------------------------------------------
# Categorical features
# ------------------------------------------------------------

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


# ============================================================
# FINAL FEATURE LIST
# ============================================================

FEATURE_COLUMNS = (

    NUMERICAL_FEATURES
    +
    CATEGORICAL_FEATURES

)


print(
    f"API model features: "
    f"{len(FEATURE_COLUMNS)}"
)

print(
    "Model loader ready."
)
