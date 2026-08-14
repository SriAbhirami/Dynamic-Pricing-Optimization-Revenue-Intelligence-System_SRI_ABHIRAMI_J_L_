# ============================================================
# TRAIN PRICE RESPONSE MODEL
# INR-NORMALIZED VERSION
# ============================================================

import os
import joblib
import numpy as np
import pandas as pd

from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

from xgboost import XGBRegressor


# ============================================================
# CURRENCY CONFIGURATION
# ============================================================
#
# IMPORTANT:
#
# The supplied datasets do not contain an explicit currency
# column.
#
# PricePilot uses INR as its application currency.
#
# Therefore, the source monetary values are normalized into
# INR BEFORE model training.
#
# This value is a configurable dataset-normalization assumption.
#
# If you later confirm the original dataset's exact currency
# and historical exchange rate, change this ONE value.
#
# ============================================================

SOURCE_CURRENCY = "USD"

TARGET_CURRENCY = "INR"

USD_TO_INR = 85.0


print()
print("=" * 75)
print("CURRENCY CONFIGURATION")
print("=" * 75)

print(
    f"Source currency : {SOURCE_CURRENCY}"
)

print(
    f"Model currency  : {TARGET_CURRENCY}"
)

print(
    f"Conversion rate : 1 {SOURCE_CURRENCY} = "
    f"₹{USD_TO_INR:.2f}"
)

print(
    "All monetary model features will be normalized to INR."
)


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
    )
)


PRICING_DATA_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "raw",
    "retail_pricing_demand_100k.csv",
)


CUSTOMER_DATA_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "raw",
    "ecommerce_customer_behavior_dataset_v2.csv",
)


MODEL_DIR = os.path.join(
    BASE_DIR,
    "backend",
    "app",
    "ml",
    "price_prediction",
)


MODEL_PATH = os.path.join(
    MODEL_DIR,
    "xgb_price_response_model.joblib",
)


PREPROCESSOR_PATH = os.path.join(
    MODEL_DIR,
    "price_response_preprocessor.joblib",
)


# ============================================================
# DISPLAY HELPER
# ============================================================

def print_section(title):

    print()
    print("=" * 75)
    print(title)
    print("=" * 75)


# ============================================================
# LOAD DATA
# ============================================================

print_section(
    "LOADING DATASETS"
)


pricing_df = pd.read_csv(
    PRICING_DATA_PATH
)


customer_df = pd.read_csv(
    CUSTOMER_DATA_PATH
)


print(
    f"Pricing dataset shape  : {pricing_df.shape}"
)


print(
    f"Customer dataset shape : {customer_df.shape}"
)


# ============================================================
# NORMALIZE CATEGORY
# ============================================================

pricing_df["category"] = (
    pricing_df["category"]
    .astype(str)
    .str.strip()
    .str.lower()
)


customer_df["Product_Category"] = (
    customer_df["Product_Category"]
    .astype(str)
    .str.strip()
    .str.lower()
)


# ============================================================
# DATE
# ============================================================

pricing_df["date"] = pd.to_datetime(
    pricing_df["date"],
    errors="coerce",
)


# ============================================================
# CURRENCY NORMALIZATION
# ============================================================
#
# IMPORTANT:
#
# Monetary columns are converted BEFORE:
#
# - customer aggregation
# - category price statistics
# - historical price calculations
# - rolling price calculations
#
# This keeps the entire feature-engineering pipeline in INR.
#
# ============================================================

print_section(
    "CONVERTING MONETARY VALUES TO INR"
)


# ------------------------------------------------------------
# PRICING / DEMAND DATASET
# ------------------------------------------------------------

pricing_money_columns = [

    "base_price",

    "current_price",

    "revenue",

]


for column in pricing_money_columns:

    if column in pricing_df.columns:

        pricing_df[column] = pd.to_numeric(
            pricing_df[column],
            errors="coerce",
        )

        pricing_df[column] = (
            pricing_df[column]
            * USD_TO_INR
        )


# ------------------------------------------------------------
# CUSTOMER BEHAVIOUR DATASET
# ------------------------------------------------------------

customer_money_columns = [

    "Unit_Price",

    "Discount_Amount",

    "Total_Amount",

]


for column in customer_money_columns:

    if column in customer_df.columns:

        customer_df[column] = pd.to_numeric(
            customer_df[column],
            errors="coerce",
        )

        customer_df[column] = (
            customer_df[column]
            * USD_TO_INR
        )


print(
    "Pricing dataset monetary columns converted:"
)


for column in pricing_money_columns:

    if column in pricing_df.columns:

        print(
            f"  {column} → INR"
        )


print()
print(
    "Customer dataset monetary columns converted:"
)


for column in customer_money_columns:

    if column in customer_df.columns:

        print(
            f"  {column} → INR"
        )


# ============================================================
# CUSTOMER BEHAVIOUR
# ============================================================

print_section(
    "BUILDING CUSTOMER BEHAVIOUR SIGNALS"
)


customer_df["Is_Returning_Customer"] = (
    pd.to_numeric(
        customer_df["Is_Returning_Customer"],
        errors="coerce",
    )
    .fillna(0)
    .astype(int)
)


customer_behavior = (

    customer_df

    .groupby("Product_Category")

    .agg(

        customer_avg_age=(
            "Age",
            "mean",
        ),

        customer_avg_unit_price=(
            "Unit_Price",
            "mean",
        ),

        customer_avg_quantity=(
            "Quantity",
            "mean",
        ),

        customer_avg_discount_amount=(
            "Discount_Amount",
            "mean",
        ),

        customer_avg_order_value=(
            "Total_Amount",
            "mean",
        ),

        customer_returning_rate=(
            "Is_Returning_Customer",
            "mean",
        ),

        customer_avg_session_duration=(
            "Session_Duration_Minutes",
            "mean",
        ),

        customer_avg_pages_viewed=(
            "Pages_Viewed",
            "mean",
        ),

        customer_avg_delivery_time=(
            "Delivery_Time_Days",
            "mean",
        ),

        customer_avg_rating=(
            "Customer_Rating",
            "mean",
        ),

        customer_order_count=(
            "Order_ID",
            "count",
        ),

    )

    .reset_index()

)


# ============================================================
# MERGE DATASETS
# ============================================================

print_section(
    "MERGING DATASETS"
)


combined_df = pricing_df.merge(

    customer_behavior,

    left_on="category",

    right_on="Product_Category",

    how="left",

)


combined_df.drop(

    columns=[
        "Product_Category",
    ],

    inplace=True,

)


# ============================================================
# NUMERIC CONVERSION
# ============================================================

numeric_columns = [

    "base_price",

    "current_price",

    "inventory_level",

    "stockout_flag",

    "units_sold",

    "demand_index",

    "discount_pct",

    "Age",

    "customer_avg_age",

    "customer_avg_unit_price",

    "customer_avg_quantity",

    "customer_avg_discount_amount",

    "customer_avg_order_value",

    "customer_returning_rate",

    "customer_avg_session_duration",

    "customer_avg_pages_viewed",

    "customer_avg_delivery_time",

    "customer_avg_rating",

    "customer_order_count",

]


for column in numeric_columns:

    if column in combined_df.columns:

        combined_df[column] = pd.to_numeric(

            combined_df[column],

            errors="coerce",

        )


# ============================================================
# SORT DATA
# ============================================================

print_section(
    "SORTING HISTORICAL DATA"
)


# ------------------------------------------------------------
# product_id is NOT used as a model feature.
#
# It is only used to calculate historical signals.
#
# This prevents historical information from different products
# inside the same category from being mixed together.
# ------------------------------------------------------------

if "product_id" in combined_df.columns:

    combined_df = (

        combined_df

        .sort_values(
            [
                "product_id",
                "date",
            ]
        )

        .reset_index(
            drop=True
        )

    )

    HISTORY_GROUP = "product_id"

    print(
        "Historical features grouped by product_id."
    )

else:

    combined_df = (

        combined_df

        .sort_values(
            [
                "category",
                "date",
            ]
        )

        .reset_index(
            drop=True
        )

    )

    HISTORY_GROUP = "category"

    print(
        "product_id not found."
    )

    print(
        "Historical features grouped by category."
    )


# ============================================================
# DATE FEATURES
# ============================================================

combined_df["year"] = (

    combined_df["date"]
    .dt.year
    .fillna(2024)
    .astype(int)

)


combined_df["month"] = (

    combined_df["date"]
    .dt.month
    .fillna(1)
    .astype(int)

)


combined_df["day"] = (

    combined_df["date"]
    .dt.day
    .fillna(1)
    .astype(int)

)


combined_df["day_of_week"] = (

    combined_df["date"]
    .dt.dayofweek
    .fillna(0)
    .astype(int)

)


# ============================================================
# BASIC PRICE FEATURES
# ============================================================

print_section(
    "CREATING PRICE RESPONSE FEATURES"
)


combined_df["base_price"] = (

    combined_df["base_price"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

)


combined_df["current_price"] = (

    combined_df["current_price"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

)


# ------------------------------------------------------------
# PRICE RATIO
#
# current_price / base_price
#
# < 1 = discount
# = 1 = base price
# > 1 = above base price
#
# Currency-independent.
# ------------------------------------------------------------

combined_df["price_ratio"] = np.where(

    combined_df["base_price"] > 0,

    combined_df["current_price"]
    /
    combined_df["base_price"],

    1.0,

)


combined_df["price_ratio"] = (

    combined_df["price_ratio"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=0.10,
        upper=3.0,
    )

)


# ------------------------------------------------------------
# EFFECTIVE DISCOUNT
# ------------------------------------------------------------

combined_df["effective_discount_pct"] = (

    1.0
    -
    combined_df["price_ratio"]

) * 100


combined_df["effective_discount_pct"] = (

    combined_df["effective_discount_pct"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=-200,
        upper=95,
    )

)


# ============================================================
# MARKET PRICE POSITION
# ============================================================

print_section(
    "CREATING MARKET PRICE POSITION SIGNALS"
)


category_price_stats = (

    combined_df

    .groupby("category")["current_price"]

    .agg(

        category_avg_price="mean",

        category_median_price="median",

    )

    .reset_index()

)


combined_df = combined_df.merge(

    category_price_stats,

    on="category",

    how="left",

)


combined_df["price_vs_category_avg"] = np.where(

    combined_df["category_avg_price"] > 0,

    combined_df["current_price"]
    /
    combined_df["category_avg_price"],

    1.0,

)


combined_df["price_vs_category_avg"] = (

    combined_df["price_vs_category_avg"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=0.10,
        upper=5.0,
    )

)


# ============================================================
# HISTORICAL PRICE / DEMAND SIGNALS
# ============================================================

print_section(
    "CREATING LEAKAGE-FREE HISTORICAL SIGNALS"
)


# ------------------------------------------------------------
# PREVIOUS PRICE
# ------------------------------------------------------------

combined_df["previous_price"] = (

    combined_df

    .groupby(HISTORY_GROUP)["current_price"]

    .shift(1)

)


# ------------------------------------------------------------
# PREVIOUS UNITS
# ------------------------------------------------------------

combined_df["previous_units"] = (

    combined_df

    .groupby(HISTORY_GROUP)["units_sold"]

    .shift(1)

)


# ------------------------------------------------------------
# PREVIOUS INVENTORY
# ------------------------------------------------------------

combined_df["previous_inventory"] = (

    combined_df

    .groupby(HISTORY_GROUP)["inventory_level"]

    .shift(1)

)


# ------------------------------------------------------------
# PREVIOUS PRICE RATIO
# ------------------------------------------------------------

combined_df["previous_price_ratio"] = (

    combined_df

    .groupby(HISTORY_GROUP)["price_ratio"]

    .shift(1)

)


# ------------------------------------------------------------
# PRICE CHANGE
# ------------------------------------------------------------

combined_df["price_change_pct"] = np.where(

    combined_df["previous_price"] > 0,

    (

        (

            combined_df["current_price"]

            -

            combined_df["previous_price"]

        )

        /

        combined_df["previous_price"]

    ) * 100,

    0.0,

)


combined_df["price_change_pct"] = (

    combined_df["price_change_pct"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=-80,
        upper=80,
    )

)


# ============================================================
# HISTORICAL DEMAND MOMENTUM
# ============================================================

combined_df["previous_previous_units"] = (

    combined_df

    .groupby(HISTORY_GROUP)["units_sold"]

    .shift(2)

)


combined_df["demand_momentum"] = np.where(

    combined_df["previous_previous_units"] > 0,

    combined_df["previous_units"]
    /
    combined_df["previous_previous_units"],

    1.0,

)


combined_df["demand_momentum"] = (

    combined_df["demand_momentum"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=0.1,
        upper=10.0,
    )

)


# ============================================================
# INVENTORY PRESSURE
# ============================================================

combined_df["inventory_pressure"] = np.where(

    combined_df["previous_units"] > 0,

    combined_df["previous_inventory"]
    /
    combined_df["previous_units"],

    combined_df["previous_inventory"],

)


combined_df["inventory_pressure"] = (

    combined_df["inventory_pressure"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=0,
        upper=10000,
    )

)


# ============================================================
# HISTORICAL PRICE ELASTICITY
# ============================================================

combined_df["previous_price_change_pct"] = (

    combined_df

    .groupby(HISTORY_GROUP)["price_change_pct"]

    .shift(1)

)


combined_df["previous_demand_change_pct"] = np.where(

    combined_df["previous_previous_units"] > 0,

    (

        (

            combined_df["previous_units"]

            -

            combined_df["previous_previous_units"]

        )

        /

        combined_df["previous_previous_units"]

    ) * 100,

    0.0,

)


combined_df["historical_price_elasticity"] = np.where(

    np.abs(
        combined_df["previous_price_change_pct"]
    ) >= 0.5,

    combined_df["previous_demand_change_pct"]
    /
    combined_df["previous_price_change_pct"],

    0.0,

)


combined_df["historical_price_elasticity"] = (

    combined_df["historical_price_elasticity"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=-10,
        upper=10,
    )

)


# ============================================================
# HISTORICAL ROLLING DEMAND
# ============================================================

print_section(
    "CREATING HISTORICAL DEMAND TRENDS"
)


combined_df["rolling_units_7"] = (

    combined_df

    .groupby(HISTORY_GROUP)["units_sold"]

    .transform(

        lambda x:

        x.shift(1)

        .rolling(
            7,
            min_periods=1,
        )

        .mean()

    )

)


combined_df["rolling_units_14"] = (

    combined_df

    .groupby(HISTORY_GROUP)["units_sold"]

    .transform(

        lambda x:

        x.shift(1)

        .rolling(
            14,
            min_periods=1,
        )

        .mean()

    )

)


# ============================================================
# HISTORICAL ROLLING PRICE
# ============================================================

combined_df["rolling_price_7"] = (

    combined_df

    .groupby(HISTORY_GROUP)["current_price"]

    .transform(

        lambda x:

        x.shift(1)

        .rolling(
            7,
            min_periods=1,
        )

        .mean()

    )

)


# ============================================================
# PRICE RELATIVE TO HISTORICAL PRICE
# ============================================================

combined_df["price_vs_recent_avg"] = np.where(

    combined_df["rolling_price_7"] > 0,

    combined_df["current_price"]
    /
    combined_df["rolling_price_7"],

    1.0,

)


combined_df["price_vs_recent_avg"] = (

    combined_df["price_vs_recent_avg"]

    .replace(
        [np.inf, -np.inf],
        np.nan,
    )

    .clip(
        lower=0.10,
        upper=5.0,
    )

)


# ============================================================
# PRICE-DEMAND INTERACTION
# ============================================================

combined_df["price_demand_pressure"] = (

    combined_df["price_vs_recent_avg"]

    *

    combined_df["rolling_units_7"]

)


# ============================================================
# REMOVE INVALID VALUES
# ============================================================

combined_df.replace(

    [np.inf, -np.inf],

    np.nan,

    inplace=True,

)


# ============================================================
# FEATURES
# ============================================================

FEATURE_COLUMNS = [

    # CURRENT PRICE

    "current_price",

    "base_price",

    "price_ratio",

    "effective_discount_pct",

    "price_vs_category_avg",

    "price_vs_recent_avg",

    "price_change_pct",

    "historical_price_elasticity",

    # PRICE / DEMAND INTERACTION

    "price_demand_pressure",

    # HISTORICAL DEMAND

    "demand_momentum",

    "rolling_units_7",

    "rolling_units_14",

    "rolling_price_7",

    # INVENTORY

    "inventory_level",

    "previous_inventory",

    "inventory_pressure",

    "stockout_flag",

    # TIME

    "year",

    "month",

    "day",

    "day_of_week",

    # MARKET

    "category",

    "brand",

    "region",

    "channel",

    "season",

    "promotion_type",

    # CUSTOMER BEHAVIOUR

    "customer_avg_age",

    "customer_avg_unit_price",

    "customer_avg_quantity",

    "customer_avg_discount_amount",

    "customer_avg_order_value",

    "customer_returning_rate",

    "customer_avg_session_duration",

    "customer_avg_pages_viewed",

    "customer_avg_delivery_time",

    "customer_avg_rating",

    "customer_order_count",

]


TARGET_COLUMN = "units_sold"


# ============================================================
# IMPORTANT LEAKAGE CHECK
# ============================================================

print_section(
    "TARGET LEAKAGE CHECK"
)


for forbidden_feature in [

    "units_sold",

    "demand_index",

    "revenue",

    "demand_change_pct",

    "previous_units",

    "previous_previous_units",

]:

    if forbidden_feature in FEATURE_COLUMNS:

        print(
            f"ERROR: {forbidden_feature} "
            f"is directly included as a model feature."
        )

    else:

        print(
            f"PASS: {forbidden_feature} "
            f"is NOT directly used as a model feature."
        )


print()
print(
    "Historical features may internally use previous_units "
    "because they are shifted historical observations."
)


# ============================================================
# PREPARE TRAINING DATA
# ============================================================

print_section(
    "PREPARING TRAINING DATA"
)


required_columns = (

    FEATURE_COLUMNS

    +

    [
        TARGET_COLUMN
    ]

)


missing_columns = [

    column

    for column in required_columns

    if column not in combined_df.columns

]


if missing_columns:

    raise ValueError(

        "Missing required columns:\n"

        +

        str(missing_columns)

    )


model_df = combined_df[
    required_columns
].copy()


model_df = model_df[
    model_df[TARGET_COLUMN].notna()
].copy()


model_df[TARGET_COLUMN] = (

    pd.to_numeric(

        model_df[TARGET_COLUMN],

        errors="coerce",

    )

    .clip(
        lower=0,
    )

)


# ============================================================
# CATEGORICAL FEATURES
# ============================================================

categorical_features = [

    "category",

    "brand",

    "region",

    "channel",

    "season",

    "promotion_type",

]


# ============================================================
# NUMERIC FEATURES
# ============================================================

numeric_features = [

    "current_price",

    "base_price",

    "price_ratio",

    "effective_discount_pct",

    "price_vs_category_avg",

    "price_vs_recent_avg",

    "price_change_pct",

    "historical_price_elasticity",

    "price_demand_pressure",

    "demand_momentum",

    "rolling_units_7",

    "rolling_units_14",

    "rolling_price_7",

    "inventory_level",

    "previous_inventory",

    "inventory_pressure",

    "stockout_flag",

    "year",

    "month",

    "day",

    "day_of_week",

    "customer_avg_age",

    "customer_avg_unit_price",

    "customer_avg_quantity",

    "customer_avg_discount_amount",

    "customer_avg_order_value",

    "customer_returning_rate",

    "customer_avg_session_duration",

    "customer_avg_pages_viewed",

    "customer_avg_delivery_time",

    "customer_avg_rating",

    "customer_order_count",

]


# ============================================================
# CLEAN CATEGORICAL FEATURES
# ============================================================

for column in categorical_features:

    model_df[column] = (

        model_df[column]

        .fillna("unknown")

        .astype(str)

        .str.strip()

        .str.lower()

    )


# ============================================================
# CLEAN NUMERIC FEATURES
# ============================================================

for column in numeric_features:

    model_df[column] = (

        pd.to_numeric(

            model_df[column],

            errors="coerce",

        )

        .replace(
            [np.inf, -np.inf],
            np.nan,
        )

    )


# ============================================================
# FILL NUMERIC MISSING VALUES
# ============================================================

for column in numeric_features:

    median_value = (

        model_df[column]

        .median()

    )


    if pd.isna(median_value):

        median_value = 0.0


    model_df[column] = (

        model_df[column]

        .fillna(
            median_value
        )

    )


# ============================================================
# FINAL TRAINING DATA
# ============================================================

X = model_df[
    FEATURE_COLUMNS
].copy()


y = model_df[
    TARGET_COLUMN
].copy()


# ============================================================
# TRAIN / TEST SPLIT
# ============================================================

X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42,

)


print(
    f"Training rows : {len(X_train)}"
)


print(
    f"Testing rows  : {len(X_test)}"
)


print(
    f"Total features: {len(FEATURE_COLUMNS)}"
)


# ============================================================
# PREPROCESSOR
# ============================================================

print_section(
    "BUILDING PREPROCESSOR"
)


preprocessor = ColumnTransformer(

    transformers=[

        (

            "numeric",

            "passthrough",

            numeric_features,

        ),

        (

            "categorical",

            OneHotEncoder(

                handle_unknown="ignore",

                sparse_output=False,

            ),

            categorical_features,

        ),

    ],

    remainder="drop",

)


X_train_processed = (

    preprocessor.fit_transform(

        X_train

    )

)


X_test_processed = (

    preprocessor.transform(

        X_test

    )

)


transformed_feature_names = (

    preprocessor

    .get_feature_names_out()

)


print(
    f"Processed features: "
    f"{X_train_processed.shape[1]}"
)


# ============================================================
# MONOTONIC CONSTRAINTS
# ============================================================

monotone_constraints = []


for feature_name in transformed_feature_names:

    if feature_name in [

        "numeric__current_price",

        "numeric__price_ratio",

        "numeric__price_vs_category_avg",

        "numeric__price_vs_recent_avg",

    ]:

        monotone_constraints.append(-1)

    elif (

        feature_name

        ==

        "numeric__effective_discount_pct"

    ):

        monotone_constraints.append(1)

    else:

        monotone_constraints.append(0)


monotone_constraints = tuple(
    monotone_constraints
)


print()
print(
    "Monotonic pricing constraints:"
)


print(
    "current_price         : -1"
)


print(
    "price_ratio           : -1"
)


print(
    "price_vs_category_avg : -1"
)


print(
    "price_vs_recent_avg   : -1"
)


print(
    "effective_discount_pct: +1"
)


# ============================================================
# TARGET TRANSFORMATION
# ============================================================

y_train_log = np.log1p(
    y_train
)


y_test_log = np.log1p(
    y_test
)


# ============================================================
# TRAIN XGBOOST
# ============================================================

print_section(
    "TRAINING PRICE RESPONSE MODEL"
)


model = XGBRegressor(

    n_estimators=1400,

    max_depth=5,

    learning_rate=0.018,

    subsample=0.85,

    colsample_bytree=0.85,

    min_child_weight=10,

    gamma=0.10,

    reg_alpha=0.25,

    reg_lambda=2.5,

    objective="reg:squarederror",

    eval_metric="rmse",

    random_state=42,

    n_jobs=-1,

    monotone_constraints=monotone_constraints,

)


model.fit(

    X_train_processed,

    y_train_log,

    eval_set=[

        (

            X_test_processed,

            y_test_log,

        )

    ],

    verbose=False,

)


# ============================================================
# PREDICTIONS
# ============================================================

print()
print(
    "Generating predictions..."
)


predictions_log = model.predict(
    X_test_processed
)


predictions = np.expm1(
    predictions_log
)


predictions = np.maximum(
    predictions,
    0,
)


# ============================================================
# MODEL METRICS
# ============================================================

mae = mean_absolute_error(

    y_test,

    predictions,

)


rmse = np.sqrt(

    mean_squared_error(

        y_test,

        predictions,

    )

)


r2 = r2_score(

    y_test,

    predictions,

)


print_section(
    "MODEL RESULTS"
)


print(
    f"MAE : {mae:.4f}"
)


print(
    f"RMSE: {rmse:.4f}"
)


print(
    f"R²  : {r2:.4f}"
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print_section(
    "TOP FEATURES"
)


feature_importance = pd.DataFrame({

    "feature":
        transformed_feature_names,

    "importance":
        model.feature_importances_,

})


feature_importance = (

    feature_importance

    .sort_values(

        "importance",

        ascending=False,

    )

)


print(

    feature_importance

    .head(40)

    .to_string(
        index=False
    )

)


# ============================================================
# PRICE FEATURE IMPORTANCE
# ============================================================

print_section(
    "PRICE FEATURE IMPORTANCE"
)


price_features = feature_importance[

    feature_importance["feature"].str.contains(

        "price|discount|elasticity",

        case=False,

        regex=True,

    )

]


print(

    price_features

    .head(25)

    .to_string(
        index=False
    )

)


# ============================================================
# PRICE SENSITIVITY TEST
# ============================================================

print_section(
    "PRICE SENSITIVITY TEST"
)


test_row = X_test.iloc[
    [0]
].copy()


original_price = float(

    test_row[
        "current_price"
    ].iloc[0]

)


if original_price <= 0:

    original_price = 100.0


candidate_percentages = list(

    range(

        -20,

        21,

        1,

    )

)


sensitivity_results = []


# ------------------------------------------------------------
# IMPORTANT
#
# All candidate prices are now INR because the model was
# trained on INR-normalized monetary features.
#
# ------------------------------------------------------------

for percentage in candidate_percentages:

    candidate_price = (

        original_price

        *

        (

            1

            +

            percentage / 100

        )

    )


    candidate_row = (

        test_row.copy()

    )


    candidate_row[
        "current_price"
    ] = candidate_price


    # --------------------------------------------------------
    # BASE PRICE
    # --------------------------------------------------------

    base_price = float(

        candidate_row[
            "base_price"
        ].iloc[0]

    )


    if base_price <= 0:

        base_price = candidate_price


    # --------------------------------------------------------
    # PRICE RATIO
    # --------------------------------------------------------

    candidate_price_ratio = (

        candidate_price

        /

        base_price

    )


    candidate_row[
        "price_ratio"
    ] = candidate_price_ratio


    # --------------------------------------------------------
    # EFFECTIVE DISCOUNT
    # --------------------------------------------------------

    candidate_row[
        "effective_discount_pct"
    ] = (

        1

        -

        candidate_price_ratio

    ) * 100


    # --------------------------------------------------------
    # CATEGORY PRICE POSITION
    # --------------------------------------------------------

    category_ratio = float(

        candidate_row[
            "price_vs_category_avg"
        ].iloc[0]

    )


    if category_ratio > 0:

        estimated_category_avg = (

            original_price

            /

            category_ratio

        )


        if estimated_category_avg > 0:

            candidate_row[
                "price_vs_category_avg"
            ] = (

                candidate_price

                /

                estimated_category_avg

            )


    # --------------------------------------------------------
    # RECENT PRICE POSITION
    # --------------------------------------------------------

    recent_price = float(

        candidate_row[
            "rolling_price_7"
        ].iloc[0]

    )


    if recent_price > 0:

        candidate_row[
            "price_vs_recent_avg"
        ] = (

            candidate_price

            /

            recent_price

        )


    # --------------------------------------------------------
    # PRICE-DEMAND INTERACTION
    # --------------------------------------------------------

    rolling_demand = float(

        candidate_row[
            "rolling_units_7"
        ].iloc[0]

    )


    candidate_row[
        "price_demand_pressure"
    ] = (

        candidate_row[
            "price_vs_recent_avg"
        ].iloc[0]

        *

        rolling_demand

    )


    # --------------------------------------------------------
    # MODEL PREDICTION
    # --------------------------------------------------------

    processed = (

        preprocessor.transform(

            candidate_row

        )

    )


    predicted_log = float(

        model.predict(

            processed

        )[0]

    )


    predicted_units = float(

        np.expm1(

            predicted_log

        )

    )


    predicted_units = max(

        0.0,

        predicted_units,

    )


    predicted_revenue = (

        candidate_price

        *

        predicted_units

    )


    sensitivity_results.append({

        "change_pct":
            percentage,

        "price":
            round(
                candidate_price,
                2,
            ),

        "predicted_units":
            round(
                predicted_units,
                2,
            ),

        "predicted_revenue":
            round(
                predicted_revenue,
                2,
            ),

    })


sensitivity_df = pd.DataFrame(

    sensitivity_results

)


print(

    sensitivity_df.to_string(

        index=False

    )

)


# ============================================================
# SENSITIVITY QUALITY CHECK
# ============================================================

print_section(
    "PRICE SENSITIVITY QUALITY CHECK"
)


unit_values = sensitivity_df[
    "predicted_units"
].values


prediction_range = (

    unit_values.max()

    -

    unit_values.min()

)


prediction_mean = (

    unit_values.mean()

)


if prediction_mean > 0:

    variation_pct = (

        prediction_range

        /

        prediction_mean

    ) * 100

else:

    variation_pct = 0.0


print(

    f"Prediction range  : "
    f"{prediction_range:.4f} units"

)


print(

    f"Relative variation: "
    f"{variation_pct:.2f}%"

)


if variation_pct < 5:

    print()
    print(
        "WARNING:"
    )

    print(
        "Price sensitivity is still very weak."
    )

    print(
        "The optimizer should NOT be trusted yet."
    )


elif variation_pct < 15:

    print()
    print(
        "MODERATE:"
    )

    print(
        "The model reacts to price, "
        "but sensitivity is still limited."
    )


else:

    print()
    print(
        "GOOD:"
    )

    print(
        "The model produces meaningful demand "
        "variation across prices."
    )


# ============================================================
# PRICE DIRECTION CHECK
# ============================================================

print_section(
    "PRICE DIRECTION CHECK"
)


lowest_units = float(

    sensitivity_df.iloc[0][
        "predicted_units"
    ]

)


highest_units = float(

    sensitivity_df.iloc[-1][
        "predicted_units"
    ]

)


print(

    f"-20% price demand: "
    f"{lowest_units:.2f}"

)


print(

    f"+20% price demand: "
    f"{highest_units:.2f}"

)


if lowest_units >= highest_units:

    print(
        "PASS: demand is non-increasing with price."
    )

else:

    print(
        "WARNING: demand increased at the higher price."
    )


# ============================================================
# BEST REVENUE PRICE
# ============================================================

best_row = sensitivity_df.loc[

    sensitivity_df[
        "predicted_revenue"
    ].idxmax()

]


print_section(
    "BEST REVENUE PRICE"
)


best_change = float(

    best_row[
        "change_pct"
    ]

)


print(

    f"Price change     : "
    f"{best_change:+.0f}%"

)


print(

    f"Price            : "
    f"₹{best_row['price']:.2f}"

)


print(

    f"Predicted units  : "
    f"{best_row['predicted_units']:.2f}"

)


print(

    f"Predicted revenue: "
    f"₹{best_row['predicted_revenue']:.2f}"

)


# ============================================================
# MODEL DECISION
# ============================================================

if best_change >= 2:

    decision = "INCREASE PRICE"


elif best_change <= -2:

    decision = "DECREASE PRICE"


else:

    decision = "MAINTAIN PRICE"


print()
print(

    f"MODEL DECISION: {decision}"

)


# ============================================================
# LEAKAGE CHECK
# ============================================================

print_section(
    "FINAL DATA LEAKAGE CHECK"
)


for forbidden in [

    "units_sold",

    "demand_index",

    "revenue",

]:

    if forbidden in FEATURE_COLUMNS:

        print(

            f"ERROR: {forbidden} "
            f"is included directly."

        )

    else:

        print(

            f"PASS: {forbidden} "
            f"is excluded from model inputs."

        )


# ============================================================
# EXPLICIT LEAKAGE WARNINGS
# ============================================================

print()
print(
    "Leakage-sensitive features:"
)


print(
    "inventory_pressure = previous_inventory / previous_units"
)


print(
    "demand_momentum = previous_units / "
    "previous_previous_units"
)


print(
    "historical_price_elasticity uses ONLY historical "
    "price/demand changes."
)


print(
    "rolling_units_7 and rolling_units_14 use shifted "
    "historical demand."
)


print(
    "Current units_sold is NEVER used to construct "
    "a current-row feature."
)


# ============================================================
# SAVE MODEL
# ============================================================

print_section(
    "SAVING MODEL"
)


os.makedirs(

    MODEL_DIR,

    exist_ok=True,

)


joblib.dump(

    model,

    MODEL_PATH,

)


joblib.dump(

    preprocessor,

    PREPROCESSOR_PATH,

)


print(

    f"Model saved       : "
    f"{MODEL_PATH}"

)


print(

    f"Preprocessor saved: "
    f"{PREPROCESSOR_PATH}"

)


# ============================================================
# FINAL SUMMARY
# ============================================================

print_section(
    "TRAINING COMPLETE"
)


print(

    f"Training rows        : "
    f"{len(X_train)}"

)


print(

    f"Testing rows         : "
    f"{len(X_test)}"

)


print(

    f"Original features    : "
    f"{len(FEATURE_COLUMNS)}"

)


print(

    f"Processed features   : "
    f"{X_train_processed.shape[1]}"

)


print(

    f"MAE                  : "
    f"{mae:.4f}"

)


print(

    f"RMSE                 : "
    f"{rmse:.4f}"

)


print(

    f"R²                   : "
    f"{r2:.4f}"

)


print(

    f"Price sensitivity    : "
    f"{variation_pct:.2f}%"

)


print(

    f"Best price change    : "
    f"{best_change:+.0f}%"

)


print(

    f"Model decision       : "
    f"{decision}"

)


print(
    "Target leakage       : REMOVED"
)


print(
    "Historical signals   : ENABLED"
)


print(
    "Price response       : ENABLED"
)


print(
    "Inventory pressure   : LEAKAGE-FREE"
)


print(
    "Demand momentum      : LEAKAGE-FREE"
)


print(
    "Historical elasticity: LEAKAGE-FREE"
)


print(
    "Monotonic pricing    : ENABLED"
)


print(
    "Product ID           : NOT A MODEL FEATURE"
)


print(
    "Demand index         : NOT USED"
)


print(
    "Revenue              : NOT USED"
)


print(
    f"Currency normalization: "
    f"{SOURCE_CURRENCY} → {TARGET_CURRENCY}"
)


print(
    f"Conversion rate      : "
    f"1 {SOURCE_CURRENCY} = ₹{USD_TO_INR:.2f}"
)


print(
    "=" * 75
)