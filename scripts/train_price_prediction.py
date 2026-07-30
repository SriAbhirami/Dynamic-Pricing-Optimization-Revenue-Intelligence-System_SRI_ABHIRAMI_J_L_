import os
import sys
import joblib
import pandas as pd

from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from xgboost import XGBRegressor


# ============================================================
# Project Paths
# ============================================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

DATA_PATH = os.path.join(
    PROJECT_ROOT,
    "datasets",
    "raw",
    "retail_pricing_demand_100k.csv",
)

MODEL_DIR = os.path.join(
    PROJECT_ROOT,
    "backend",
    "app",
    "ml",
    "price_prediction",
)

MODEL_PATH = os.path.join(
    MODEL_DIR,
    "xgb_price_model.joblib",
)

PREPROCESSOR_PATH = os.path.join(
    MODEL_DIR,
    "price_preprocessor.joblib",
)


# ============================================================
# Create Output Directory
# ============================================================

os.makedirs(MODEL_DIR, exist_ok=True)


# ============================================================
# Load Dataset
# ============================================================

print("\nLoading dataset...")

df = pd.read_csv(DATA_PATH)

print(f"Dataset shape: {df.shape}")


# ============================================================
# Date Processing
# ============================================================

df["date"] = pd.to_datetime(df["date"], errors="coerce")

df["year"] = df["date"].dt.year
df["month"] = df["date"].dt.month
df["day"] = df["date"].dt.day
df["day_of_week"] = df["date"].dt.dayofweek


# ============================================================
# Target
# ============================================================

TARGET = "current_price"


# ============================================================
# Features
#
# We intentionally DO NOT use:
#
# - current_price  -> target
# - price_change_pct
# - discount_pct
# - revenue
#
# These can introduce direct pricing leakage.
# ============================================================

FEATURES = [
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


X = df[FEATURES].copy()
y = df[TARGET].copy()


# ============================================================
# Remove Invalid Target Rows
# ============================================================

valid_rows = y.notna()

X = X.loc[valid_rows].copy()
y = y.loc[valid_rows].copy()


print(f"Rows used for training: {len(X)}")
print(f"Target: {TARGET}")


# ============================================================
# Feature Groups
# ============================================================

categorical_features = [
    "product_id",
    "category",
    "brand",
    "region",
    "channel",
    "season",
    "promotion_type",
]

numerical_features = [
    "base_price",
    "units_sold",
    "inventory_level",
    "stockout_flag",
    "demand_index",
    "year",
    "month",
    "day",
    "day_of_week",
]


# ============================================================
# Preprocessing
# ============================================================

numeric_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="median"),
        )
    ]
)


categorical_transformer = Pipeline(
    steps=[
        (
            "imputer",
            SimpleImputer(strategy="most_frequent"),
        ),
        (
            "onehot",
            OneHotEncoder(
                handle_unknown="ignore",
                sparse_output=True,
            ),
        ),
    ]
)


preprocessor = ColumnTransformer(
    transformers=[
        (
            "numeric",
            numeric_transformer,
            numerical_features,
        ),
        (
            "categorical",
            categorical_transformer,
            categorical_features,
        ),
    ]
)


# ============================================================
# Train / Test Split
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
)


print("\nTraining data:", X_train.shape)
print("Testing data :", X_test.shape)


# ============================================================
# XGBoost Model
# ============================================================

model = XGBRegressor(
    n_estimators=500,
    max_depth=8,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="reg:squarederror",
    random_state=42,
    n_jobs=-1,
)


# ============================================================
# Transform Data
# ============================================================

print("\nPreprocessing data...")

X_train_processed = preprocessor.fit_transform(X_train)
X_test_processed = preprocessor.transform(X_test)


print(
    "Processed training shape:",
    X_train_processed.shape,
)

print(
    "Processed testing shape:",
    X_test_processed.shape,
)


# ============================================================
# Train Model
# ============================================================

print("\nTraining XGBoost Price Prediction Model...")

model.fit(
    X_train_processed,
    y_train,
)


# ============================================================
# Predictions
# ============================================================

print("\nGenerating predictions...")

predictions = model.predict(X_test_processed)


# ============================================================
# Evaluation
# ============================================================

mae = mean_absolute_error(
    y_test,
    predictions,
)

mse = mean_squared_error(
    y_test,
    predictions,
)

rmse = mse ** 0.5

r2 = r2_score(
    y_test,
    predictions,
)


# ============================================================
# Results
# ============================================================

print("\n" + "=" * 60)
print("PRICE PREDICTION MODEL RESULTS")
print("=" * 60)

print(f"MAE  : {mae:.4f}")
print(f"RMSE : {rmse:.4f}")
print(f"R²   : {r2:.4f}")

print("=" * 60)


# ============================================================
# Sample Predictions
# ============================================================

results = pd.DataFrame(
    {
        "Actual Price": y_test.values,
        "Predicted Price": predictions,
    }
)

results["Difference"] = (
    results["Predicted Price"]
    - results["Actual Price"]
)

print("\nSample Predictions:")
print(
    results.head(10).to_string(
        index=False
    )
)


# ============================================================
# Save Model
# ============================================================

print("\nSaving model...")

joblib.dump(
    model,
    MODEL_PATH,
)

joblib.dump(
    preprocessor,
    PREPROCESSOR_PATH,
)


print("\nModel saved successfully!")

print(
    f"Model      : {MODEL_PATH}"
)

print(
    f"Preprocessor: {PREPROCESSOR_PATH}"
)


# ============================================================
# Final Summary
# ============================================================

print("\n" + "=" * 60)
print("PRICE PREDICTION TRAINING COMPLETE")
print("=" * 60)

print("Target              :", TARGET)
print("Training rows       :", len(X_train))
print("Testing rows        :", len(X_test))
print(f"MAE                 : {mae:.4f}")
print(f"RMSE                : {rmse:.4f}")
print(f"R²                  : {r2:.4f}")
print("=" * 60)