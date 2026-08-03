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
    print("=" * 70)
    print(title)
    print("=" * 70)


# ============================================================
# LOAD PRICING DATA
# ============================================================

print_section(
    "LOADING PRICING & DEMAND DATASET"
)

pricing_df = pd.read_csv(
    PRICING_DATA_PATH
)

print(
    f"Pricing dataset shape: {pricing_df.shape}"
)


# ============================================================
# LOAD CUSTOMER DATA
# ============================================================

print_section(
    "LOADING CUSTOMER BEHAVIOUR DATASET"
)

customer_df = pd.read_csv(
    CUSTOMER_DATA_PATH
)

print(
    f"Customer behaviour dataset shape: {customer_df.shape}"
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
# CUSTOMER BEHAVIOUR FEATURES
# ============================================================

print_section(
    "BUILDING CUSTOMER BEHAVIOUR FEATURES"
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


print()
print(
    customer_behavior.to_string(
        index=False
    )
)


# ============================================================
# MERGE DATASETS
# ============================================================

print_section(
    "MERGING PRICING + CUSTOMER BEHAVIOUR SIGNALS"
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


print(
    f"Combined dataset shape: {combined_df.shape}"
)


# ============================================================
# DATE FEATURES
# ============================================================

print_section(
    "CREATING DATE FEATURES"
)

combined_df["date"] = pd.to_datetime(
    combined_df["date"],
    errors="coerce",
)

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
# NUMERIC CLEANING
# ============================================================

numeric_columns = [

    "base_price",
    "current_price",
    "inventory_level",
    "stockout_flag",
    "units_sold",

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
# PRICE RESPONSE FEATURES
# ============================================================

print_section(
    "CREATING PRICE RESPONSE FEATURES"
)


# ------------------------------------------------------------
# Protect base price
# ------------------------------------------------------------

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
# Price ratio
#
# current_price / base_price
#
# < 1  -> discount
# = 1  -> base price
# > 1  -> price above base
# ------------------------------------------------------------

combined_df["price_ratio"] = np.where(

    combined_df["base_price"] > 0,

    combined_df["current_price"]
    / combined_df["base_price"],

    1.0,
)


combined_df["price_ratio"] = (
    combined_df["price_ratio"]
    .replace(
        [np.inf, -np.inf],
        np.nan,
    )
    .clip(
        lower=0.05,
        upper=3.0,
    )
)


# ------------------------------------------------------------
# Effective discount
# ------------------------------------------------------------

combined_df["effective_discount_pct"] = (

    1.0
    - combined_df["price_ratio"]

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


print()
print(
    f"Current price mean: "
    f"{combined_df['current_price'].mean():.2f}"
)

print(
    f"Base price mean: "
    f"{combined_df['base_price'].mean():.2f}"
)

print(
    f"Price ratio mean: "
    f"{combined_df['price_ratio'].mean():.4f}"
)

print(
    f"Effective discount mean: "
    f"{combined_df['effective_discount_pct'].mean():.2f}%"
)


# ============================================================
# PRICE RELATIONSHIP CHECK
# ============================================================

print_section(
    "PRICE RESPONSE CORRELATION CHECK"
)

correlation_columns = [

    "current_price",
    "base_price",
    "price_ratio",
    "effective_discount_pct",
    "units_sold",
]


print(
    combined_df[
        correlation_columns
    ]
    .corr(numeric_only=True)["units_sold"]
    .sort_values(
        ascending=False
    )
)


# ============================================================
# FEATURE DEFINITIONS
# ============================================================
#
# IMPORTANT:
#
# product_id is intentionally NOT included.
#
# Why?
#
# The previous model learned product-specific averages too
# strongly. That caused the model to predict nearly identical
# demand values when candidate prices changed.
#
# Removing product_id makes the model learn general pricing
# behaviour across products.
#
# ============================================================


FEATURE_COLUMNS = [

    # --------------------------------------------------------
    # PRICE
    # --------------------------------------------------------

    "current_price",

    "base_price",

    "price_ratio",

    "effective_discount_pct",

    # --------------------------------------------------------
    # INVENTORY
    # --------------------------------------------------------

    "inventory_level",

    "stockout_flag",

    # --------------------------------------------------------
    # DATE
    # --------------------------------------------------------

    "year",

    "month",

    "day",

    "day_of_week",

    # --------------------------------------------------------
    # PRODUCT / MARKET
    # --------------------------------------------------------

    "category",

    "brand",

    "region",

    "channel",

    "season",

    "promotion_type",

    # --------------------------------------------------------
    # CUSTOMER BEHAVIOUR
    # --------------------------------------------------------

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
# PREPARE MODEL DATA
# ============================================================

print_section(
    "PRICE RESPONSE TRAINING DATA SUMMARY"
)


missing_columns = [

    column

    for column in FEATURE_COLUMNS

    if column not in combined_df.columns
]


if missing_columns:

    raise ValueError(
        "Missing required model columns: "
        + str(missing_columns)
    )


model_df = combined_df[
    FEATURE_COLUMNS
    + [
        TARGET_COLUMN
    ]
].copy()


# ============================================================
# REMOVE INVALID TARGET
# ============================================================

model_df = model_df[
    model_df[TARGET_COLUMN].notna()
].copy()


model_df[TARGET_COLUMN] = (
    pd.to_numeric(
        model_df[TARGET_COLUMN],
        errors="coerce",
    )
    .fillna(0)
    .clip(
        lower=0
    )
)


print(
    f"Rows used for training: {len(model_df)}"
)

print(
    f"Number of features: {len(FEATURE_COLUMNS)}"
)

print(
    f"Target: {TARGET_COLUMN}"
)

print(
    f"Target mean: "
    f"{model_df[TARGET_COLUMN].mean():.4f}"
)

print(
    f"Target median: "
    f"{model_df[TARGET_COLUMN].median():.4f}"
)

print(
    f"Target min: "
    f"{model_df[TARGET_COLUMN].min():.4f}"
)

print(
    f"Target max: "
    f"{model_df[TARGET_COLUMN].max():.4f}"
)


# ============================================================
# HANDLE CATEGORICAL FEATURES
# ============================================================

categorical_features = [

    "category",

    "brand",

    "region",

    "channel",

    "season",

    "promotion_type",
]


numeric_features = [

    "current_price",

    "base_price",

    "price_ratio",

    "effective_discount_pct",

    "inventory_level",

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


for column in categorical_features:

    model_df[column] = (
        model_df[column]
        .fillna("unknown")
        .astype(str)
        .str.strip()
        .str.lower()
    )


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
# NUMERIC MISSING VALUES
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
# TRAIN / TEST SPLIT
# ============================================================

X = model_df[
    FEATURE_COLUMNS
].copy()

y = model_df[
    TARGET_COLUMN
].copy()


X_train, X_test, y_train, y_test = train_test_split(

    X,

    y,

    test_size=0.20,

    random_state=42,
)


print()
print(
    f"Training data: {X_train.shape}"
)

print(
    f"Testing data: {X_test.shape}"
)


# ============================================================
# PREPROCESSOR
# ============================================================

print()
print(
    "Preprocessing data..."
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


print(
    f"Processed training shape: "
    f"{X_train_processed.shape}"
)

print(
    f"Processed testing shape: "
    f"{X_test_processed.shape}"
)


# ============================================================
# FEATURE NAMES
# ============================================================

transformed_feature_names = (
    preprocessor.get_feature_names_out()
)


print()
print(
    f"Total transformed features: "
    f"{len(transformed_feature_names)}"
)


# ============================================================
# MONOTONIC CONSTRAINTS
# ============================================================
#
# current_price:
#     higher price should not increase demand
#
# price_ratio:
#     higher ratio should not increase demand
#
# effective_discount_pct:
#     higher discount should not decrease demand
#
# ============================================================

monotone_constraints = []


for feature_name in transformed_feature_names:

    if feature_name == "numeric__current_price":

        monotone_constraints.append(-1)

    elif feature_name == "numeric__price_ratio":

        monotone_constraints.append(-1)

    elif (
        feature_name
        == "numeric__effective_discount_pct"
    ):

        monotone_constraints.append(1)

    else:

        monotone_constraints.append(0)


monotone_constraints = tuple(
    monotone_constraints
)


print()
print(
    "Monotonic price constraints:"
)

print(
    "current_price          : -1"
)

print(
    "price_ratio            : -1"
)

print(
    "effective_discount_pct : +1"
)


# ============================================================
# LOG TRANSFORM TARGET
# ============================================================
#
# Instead of training directly on units:
#
#     units
#
# train on:
#
#     log(1 + units)
#
# This reduces the dominance of high-volume observations and
# allows the model to learn relative demand changes better.
#
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
    "TRAINING PRICE RESPONSE XGBOOST MODEL"
)


model = XGBRegressor(

    n_estimators=900,

    max_depth=4,

    learning_rate=0.025,

    subsample=0.90,

    colsample_bytree=0.90,

    min_child_weight=2,

    gamma=0.0,

    reg_alpha=0.05,

    reg_lambda=1.0,

    objective="reg:squarederror",

    eval_metric="rmse",

    random_state=42,

    n_jobs=-1,

    monotone_constraints=
        monotone_constraints,
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


# Convert back from log scale

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
    "PRICE RESPONSE MODEL RESULTS"
)

print(
    f"MAE  : {mae:.4f} units"
)

print(
    f"RMSE : {rmse:.4f} units"
)

print(
    f"R²   : {r2:.4f}"
)


# ============================================================
# SAMPLE PREDICTIONS
# ============================================================

sample_predictions = pd.DataFrame({

    "Actual Units":
        y_test.iloc[:10].values,

    "Predicted Units":
        predictions[:10],

})


sample_predictions["Difference"] = (

    sample_predictions[
        "Predicted Units"
    ]

    -

    sample_predictions[
        "Actual Units"
    ]
)


print()
print(
    "Sample Predictions:"
)

print(
    sample_predictions.to_string(
        index=False
    )
)


# ============================================================
# FEATURE IMPORTANCE
# ============================================================

print_section(
    "TOP MODEL FEATURES"
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
        by="importance",
        ascending=False,
    )
)


print(
    feature_importance.head(
        40
    ).to_string(
        index=False
    )
)


# ============================================================
# PRICE FEATURE IMPORTANCE
# ============================================================

print_section(
    "PRICE FEATURE IMPORTANCE"
)


price_feature_names = [

    "numeric__current_price",

    "numeric__base_price",

    "numeric__price_ratio",

    "numeric__effective_discount_pct",
]


price_importance = (
    feature_importance[
        feature_importance["feature"]
        .isin(
            price_feature_names
        )
    ]
    .copy()
)


print(
    price_importance.to_string(
        index=False
    )
)


# ============================================================
# CUSTOMER FEATURE IMPORTANCE
# ============================================================

print_section(
    "CUSTOMER BEHAVIOUR FEATURE IMPORTANCE"
)


customer_feature_importance = (
    feature_importance[
        feature_importance["feature"]
        .str.startswith(
            "numeric__customer_"
        )
    ]
    .copy()
)


print(
    customer_feature_importance.to_string(
        index=False
    )
)


# ============================================================
# PRICE SENSITIVITY TEST
# ============================================================

print_section(
    "PRICE SENSITIVITY TEST (-20% TO +20%, EVERY 1%)"
)


test_row = X_test.iloc[
    [0]
].copy()


original_price = float(
    test_row[
        "current_price"
    ].iloc[0]
)


base_price_for_test = float(
    test_row[
        "base_price"
    ].iloc[0]
)


if base_price_for_test <= 0:

    base_price_for_test = (
        original_price
    )


test_percentages = list(
    range(
        -20,
        21,
        1,
    )
)


sensitivity_results = []


for percentage in test_percentages:

    candidate_price = (

        original_price

        *

        (
            1
            + percentage / 100
        )

    )


    candidate_row = (
        test_row.copy()
    )


    candidate_row[
        "current_price"
    ] = candidate_price


    candidate_row[
        "price_ratio"
    ] = (

        candidate_price
        / base_price_for_test

    )


    candidate_row[
        "effective_discount_pct"
    ] = (

        1
        - candidate_row[
            "price_ratio"
        ]

    ) * 100


    candidate_processed = (
        preprocessor.transform(
            candidate_row
        )
    )


    candidate_prediction_log = float(

        model.predict(
            candidate_processed
        )[0]

    )


    candidate_prediction = float(

        np.expm1(
            candidate_prediction_log
        )

    )


    candidate_prediction = max(
        0.0,
        candidate_prediction,
    )


    candidate_revenue = (

        candidate_price
        * candidate_prediction

    )


    sensitivity_results.append({

        "price_change":
            f"{percentage:+d}%",

        "candidate_price":
            round(
                candidate_price,
                2,
            ),

        "predicted_units":
            round(
                candidate_prediction,
                2,
            ),

        "predicted_revenue":
            round(
                candidate_revenue,
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
# SENSITIVITY ANALYSIS
# ============================================================

unique_predictions = (
    sensitivity_df[
        "predicted_units"
    ]
    .nunique()
)


min_predicted_units = (
    sensitivity_df[
        "predicted_units"
    ].min()
)


max_predicted_units = (
    sensitivity_df[
        "predicted_units"
    ].max()
)


print()


print(
    f"Different predicted demand values: "
    f"{unique_predictions}"
)


print(
    f"Minimum predicted units: "
    f"{min_predicted_units:.2f}"
)


print(
    f"Maximum predicted units: "
    f"{max_predicted_units:.2f}"
)


if unique_predictions <= 3:

    print()
    print(
        "WARNING:"
    )

    print(
        "The model still has weak price sensitivity."
    )

    print(
        "Do NOT use the optimization result yet."
    )

else:

    print()
    print(
        "SUCCESS:"
    )

    print(
        "The model produces multiple demand "
        "responses across candidate prices."
    )


# ============================================================
# PRICE DIRECTION VALIDATION
# ============================================================

print_section(
    "PRICE DIRECTION VALIDATION"
)


lowest_price_units = float(
    sensitivity_df[
        sensitivity_df[
            "price_change"
        ] == "-20%"
    ][
        "predicted_units"
    ].iloc[0]
)


highest_price_units = float(
    sensitivity_df[
        sensitivity_df[
            "price_change"
        ] == "+20%"
    ][
        "predicted_units"
    ].iloc[0]
)


print(
    f"-20% price predicted units: "
    f"{lowest_price_units:.2f}"
)


print(
    f"+20% price predicted units: "
    f"{highest_price_units:.2f}"
)


if lowest_price_units > highest_price_units:

    print()
    print(
        "SUCCESS:"
    )

    print(
        "Lower price produces higher predicted demand."
    )

else:

    print()
    print(
        "WARNING:"
    )

    print(
        "The model did not produce the expected "
        "lower-price / higher-demand relationship."
    )


# ============================================================
# BEST REVENUE PRICE
# ============================================================

print_section(
    "SENSITIVITY TEST BEST REVENUE PRICE"
)


best_revenue_row = sensitivity_df.loc[
    sensitivity_df[
        "predicted_revenue"
    ].idxmax()
]


print(
    f"Best price change: "
    f"{best_revenue_row['price_change']}"
)


print(
    f"Best candidate price: "
    f"₹{best_revenue_row['candidate_price']:.2f}"
)


print(
    f"Predicted units: "
    f"{best_revenue_row['predicted_units']:.2f}"
)


print(
    f"Predicted revenue: "
    f"₹{best_revenue_row['predicted_revenue']:.2f}"
)


# ============================================================
# LEAKAGE CHECK
# ============================================================

print_section(
    "LEAKAGE CHECK"
)


for forbidden_feature in [

    "demand_index",

    "revenue",

    "units_sold",

]:

    if forbidden_feature in FEATURE_COLUMNS:

        print(
            f"ERROR: {forbidden_feature} "
            "is incorrectly included."
        )

    else:

        print(
            f"OK: {forbidden_feature} "
            "excluded from model inputs."
        )


# ============================================================
# MODEL GENERALIZATION CHECK
# ============================================================

print_section(
    "MODEL GENERALIZATION CHECK"
)


print(
    "product_id:"
)

print(
    "REMOVED from learned model features."
)

print(
    "Reason: prevents product memorization and "
    "improves generalization to new products."
)


print()
print(
    "Unknown categories:"
)

print(
    "SUPPORTED through "
    "OneHotEncoder(handle_unknown='ignore')."
)


# ============================================================
# SAVE MODEL
# ============================================================

print_section(
    "SAVING PRICE RESPONSE MODEL"
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


print()
print(
    "Price response model saved successfully!"
)


print(
    f"Model       : {MODEL_PATH}"
)


print(
    f"Preprocessor: {PREPROCESSOR_PATH}"
)


# ============================================================
# FINAL SUMMARY
# ============================================================

print_section(
    "PRICE RESPONSE MODEL TRAINING COMPLETE"
)


print(
    f"Target          : {TARGET_COLUMN}"
)


print(
    f"Training rows   : {len(X_train)}"
)


print(
    f"Testing rows    : {len(X_test)}"
)


print(
    f"Features        : {len(FEATURE_COLUMNS)}"
)


print(
    f"Processed feats : "
    f"{X_train_processed.shape[1]}"
)


print(
    f"MAE             : {mae:.4f} units"
)


print(
    f"RMSE            : {rmse:.4f} units"
)


print(
    f"R²              : {r2:.4f}"
)


print(
    "Price features  : current_price + base_price + "
    "price_ratio + effective_discount_pct"
)


print(
    "Price constraints: ENABLED"
)


print(
    "Product ID      : REMOVED"
)


print(
    "Demand index    : EXCLUDED"
)


print(
    "Revenue         : EXCLUDED"
)


print(
    "Customer signals: INCLUDED"
)


print(
    "Unknown categories: SUPPORTED"
)


print(
    "Price sensitivity: -20% to +20% in 1% steps"
)


print(
    "=" * 70
)

