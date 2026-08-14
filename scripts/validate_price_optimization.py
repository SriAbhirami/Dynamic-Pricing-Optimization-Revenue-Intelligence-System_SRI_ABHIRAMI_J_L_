"""
validate_price_optimization.py

============================================================
PURPOSE
============================================================

This script validates whether the trained price-response model
actually behaves like a pricing intelligence model.

It checks:

1. Does demand decrease when price increases?
2. Does predicted demand meaningfully change with price?
3. Does revenue have a sensible optimum?
4. Are recommendations different across categories?
5. Does inventory influence recommendations?
6. Are recommendations concentrated at one percentage?
7. Does the model produce meaningful pricing variation?
8. Does the model remain compatible with the trained feature set?
9. Does the model maintain monotonic price behaviour?
10. Are historical elasticity and demand momentum being used?
11. Are historical price signals constructed correctly?

IMPORTANT:

This validation script uses the SAME feature structure expected
by train_price_response.py.

The trained model expects:

    previous_inventory
    price_vs_recent_avg
    price_demand_pressure

These are constructed using historical information only.

Run:

    python scripts/validate_price_optimization.py
============================================================
"""

import os
import sys
import joblib
import numpy as np
import pandas as pd


# ============================================================
# PATHS
# ============================================================

BASE_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
    )
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


CUSTOMER_DATA_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "raw",
    "ecommerce_customer_behavior_dataset_v2.csv",
)


PRICING_DATA_PATH = os.path.join(
    BASE_DIR,
    "datasets",
    "raw",
    "retail_pricing_demand_100k.csv",
)


# ============================================================
# CANDIDATE RANGE
# ============================================================

CANDIDATE_MIN_PCT = -20
CANDIDATE_MAX_PCT = 20
CANDIDATE_STEP_PCT = 1


# Minimum revenue improvement required before changing price.
MIN_REVENUE_IMPROVEMENT_PCT = 1.0


# ============================================================
# VALIDATION THRESHOLDS
# ============================================================

MIN_DEMAND_VARIATION_PCT = 5.0

MAX_RECOMMENDATION_CONCENTRATION_PCT = 70.0

MIN_UNIQUE_RECOMMENDATIONS = 3

INVENTORY_EFFECT_THRESHOLD = 2.0

MONOTONIC_TOLERANCE = 0.0001


# ============================================================
# EXPECTED FEATURES
# ============================================================

EXPECTED_NUMERIC_FEATURES = [

    "current_price",

    "base_price",

    "price_ratio",

    "effective_discount_pct",

    "price_vs_category_avg",

    "price_vs_recent_avg",

    "price_demand_pressure",

    "price_change_pct",

    "historical_price_elasticity",

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


EXPECTED_CATEGORICAL_FEATURES = [

    "category",

    "brand",

    "region",

    "channel",

    "season",

    "promotion_type",

]


EXPECTED_FEATURES = (
    EXPECTED_NUMERIC_FEATURES
    +
    EXPECTED_CATEGORICAL_FEATURES
)


# ============================================================
# LOAD MODEL
# ============================================================

def load_model():

    if not os.path.exists(MODEL_PATH):

        print(
            f"Model not found:\n{MODEL_PATH}"
        )

        sys.exit(1)


    if not os.path.exists(PREPROCESSOR_PATH):

        print(
            f"Preprocessor not found:\n"
            f"{PREPROCESSOR_PATH}"
        )

        sys.exit(1)


    model = joblib.load(
        MODEL_PATH
    )


    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )


    return model, preprocessor


# ============================================================
# CUSTOMER BEHAVIOUR
# ============================================================

def load_customer_behavior():

    df = pd.read_csv(
        CUSTOMER_DATA_PATH
    )


    df["Product_Category"] = (
        df["Product_Category"]
        .astype(str)
        .str.strip()
        .str.lower()
    )


    df["Is_Returning_Customer"] = (
        pd.to_numeric(
            df["Is_Returning_Customer"],
            errors="coerce",
        )
        .fillna(0)
        .astype(int)
    )


    behavior = (
        df
        .groupby(
            "Product_Category"
        )
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


    return behavior


# ============================================================
# LOAD RAW PRICING DATA
# ============================================================

def load_pricing_data():

    df = pd.read_csv(
        PRICING_DATA_PATH
    )


    df["category"] = (
        df["category"]
        .astype(str)
        .str.strip()
        .str.lower()
    )


    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce",
    )


    numeric_columns = [

        "base_price",

        "current_price",

        "inventory_level",

        "units_sold",

        "demand_index",

        "discount_pct",

    ]


    for column in numeric_columns:

        if column in df.columns:

            df[column] = pd.to_numeric(
                df[column],
                errors="coerce",
            )


    df = df.dropna(
        subset=[
            "category",
            "date",
            "current_price",
            "units_sold",
        ]
    )


    df = df.sort_values(
        [
            "category",
            "date",
        ]
    ).reset_index(
        drop=True
    )


    return df


# ============================================================
# CATEGORY SIGNALS
# ============================================================

def load_category_signals(df):

    signals = (
        df
        .groupby(
            "category"
        )
        .agg(

            average_base_price=(
                "base_price",
                "mean",
            ),

            average_current_price=(
                "current_price",
                "mean",
            ),

            average_units_sold=(
                "units_sold",
                "mean",
            ),

            average_inventory=(
                "inventory_level",
                "mean",
            ),

            average_demand_index=(
                "demand_index",
                "mean",
            ),

            average_discount_pct=(
                "discount_pct",
                "mean",
            ),

        )
        .reset_index()
    )


    latest_rows = (
        df
        .sort_values(
            "date"
        )
        .groupby(
            "category"
        )
        .tail(1)
    )


    return signals, latest_rows


# ============================================================
# HISTORICAL CATEGORY SIGNALS
# ============================================================

def build_historical_signals(df):

    historical = df.copy()


    # ========================================================
    # PREVIOUS INVENTORY
    # ========================================================

    historical["previous_inventory"] = (
        historical
        .groupby("category")[
            "inventory_level"
        ]
        .shift(1)
    )


    # ========================================================
    # PREVIOUS UNITS
    # ========================================================

    historical["previous_units"] = (
        historical
        .groupby("category")[
            "units_sold"
        ]
        .shift(1)
    )


    historical["previous_previous_units"] = (
        historical
        .groupby("category")[
            "units_sold"
        ]
        .shift(2)
    )


    # ========================================================
    # PREVIOUS PRICE
    # ========================================================

    historical["previous_price"] = (
        historical
        .groupby("category")[
            "current_price"
        ]
        .shift(1)
    )


    # ========================================================
    # ACTUAL RECENT AVERAGE PRICE
    #
    # IMPORTANT:
    #
    # This is the actual historical price.
    #
    # The old validation script accidentally used a price ratio
    # as if it were a price.
    # ========================================================

    historical["recent_average_price"] = (

        historical
        .groupby("category")[
            "current_price"
        ]
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


    # ========================================================
    # RECENT AVERAGE UNITS
    # ========================================================

    historical["recent_units_avg"] = (

        historical
        .groupby("category")[
            "units_sold"
        ]
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


    # ========================================================
    # 14-DAY UNITS
    # ========================================================

    historical["recent_units_avg_14"] = (

        historical
        .groupby("category")[
            "units_sold"
        ]
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


    # ========================================================
    # RECENT PRICE
    # ========================================================

    historical["rolling_price_7"] = (

        historical
        .groupby("category")[
            "current_price"
        ]
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


    # ========================================================
    # DEMAND MOMENTUM
    #
    # Recent demand / longer historical demand.
    #
    # > 1 = demand strengthening
    # < 1 = demand weakening
    # ========================================================

    historical["demand_momentum"] = (

        historical["recent_units_avg"]
        /
        historical["recent_units_avg_14"]
        .replace(
            0,
            np.nan,
        )

    )


    historical["demand_momentum"] = (
        historical["demand_momentum"]
        .replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )
        .fillna(1.0)
    )


    historical["demand_momentum"] = (
        historical["demand_momentum"]
        .clip(
            0.25,
            4.0,
        )
    )


    # ========================================================
    # HISTORICAL PRICE ELASTICITY
    #
    # Approximation using historical price and demand changes.
    #
    # elasticity =
    #
    # % change in units
    # -----------------
    # % change in price
    #
    # Calculated only from PREVIOUS observations.
    # ========================================================

    price_change_pct = (

        historical["current_price"]
        /
        historical["previous_price"]
        .replace(
            0,
            np.nan,
        )
        - 1.0

    )


    demand_change_pct = (

        historical["units_sold"]
        /
        historical["previous_units"]
        .replace(
            0,
            np.nan,
        )
        - 1.0

    )


    elasticity = (

        demand_change_pct
        /
        price_change_pct.replace(
            0,
            np.nan,
        )

    )


    historical["historical_price_elasticity"] = (
        elasticity
        .replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )
        .groupby(
            historical["category"]
        )
        .transform(
            lambda x:
            x.rolling(
                30,
                min_periods=3,
            )
            .mean()
        )
    )


    # --------------------------------------------------------
    # Fallback for categories without enough price movement.
    #
    # A negative elasticity is economically sensible.
    # If unavailable, use a conservative neutral value.
    # --------------------------------------------------------

    historical["historical_price_elasticity"] = (
        historical[
            "historical_price_elasticity"
        ]
        .replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )
        .clip(
            -10.0,
            2.0,
        )
        .fillna(
            0.0
        )
    )


    # ========================================================
    # PRICE VS RECENT AVERAGE
    # ========================================================

    historical["price_vs_recent_avg"] = (

        historical["current_price"]
        /
        historical["recent_average_price"]
        .replace(
            0,
            np.nan,
        )

    )


    historical["price_vs_recent_avg"] = (

        historical["price_vs_recent_avg"]
        .replace(
            [
                np.inf,
                -np.inf,
            ],
            np.nan,
        )
        .clip(
            0.10,
            5.0,
        )

    )


    return historical


# ============================================================
# BUILD CATEGORY HISTORICAL CONTEXT
# ============================================================

def get_category_historical_context(
    historical_df,
    category,
):

    category_df = (
        historical_df[
            historical_df["category"]
            ==
            category
        ]
        .copy()
    )


    if category_df.empty:

        return {

            "recent_average_price":
                np.nan,

            "previous_inventory":
                np.nan,

            "recent_average_units":
                np.nan,

            "demand_momentum":
                1.0,

            "historical_price_elasticity":
                0.0,

        }


    # --------------------------------------------------------
    # Most recent valid recent price
    # --------------------------------------------------------

    recent_price_values = (
        category_df[
            "recent_average_price"
        ]
        .dropna()
    )


    if not recent_price_values.empty:

        recent_average_price = float(
            recent_price_values.iloc[-1]
        )

    else:

        recent_average_price = np.nan


    # --------------------------------------------------------
    # Previous inventory
    # --------------------------------------------------------

    previous_inventory_values = (
        category_df[
            "previous_inventory"
        ]
        .dropna()
    )


    if not previous_inventory_values.empty:

        previous_inventory = float(
            previous_inventory_values.iloc[-1]
        )

    else:

        previous_inventory = np.nan


    # --------------------------------------------------------
    # Recent units
    # --------------------------------------------------------

    recent_units_values = (
        category_df[
            "recent_units_avg"
        ]
        .dropna()
    )


    if not recent_units_values.empty:

        recent_average_units = float(
            recent_units_values.iloc[-1]
        )

    else:

        recent_average_units = np.nan


    # --------------------------------------------------------
    # Demand momentum
    # --------------------------------------------------------

    momentum_values = (
        category_df[
            "demand_momentum"
        ]
        .dropna()
    )


    if not momentum_values.empty:

        demand_momentum = float(
            momentum_values.iloc[-1]
        )

    else:

        demand_momentum = 1.0


    # --------------------------------------------------------
    # Historical elasticity
    # --------------------------------------------------------

    elasticity_values = (
        category_df[
            "historical_price_elasticity"
        ]
        .dropna()
    )


    if not elasticity_values.empty:

        historical_price_elasticity = float(
            elasticity_values.iloc[-1]
        )

    else:

        historical_price_elasticity = 0.0


    return {

        "recent_average_price":
            recent_average_price,

        "previous_inventory":
            previous_inventory,

        "recent_average_units":
            recent_average_units,

        "demand_momentum":
            demand_momentum,

        "historical_price_elasticity":
            historical_price_elasticity,

    }


# ============================================================
# BUILD MODEL INPUT
# ============================================================

def build_row(

    category,

    brand,

    region,

    channel,

    season,

    promotion_type,

    current_price,

    base_price,

    stock,

    customer_behavior,

    category_avg_price,

    recent_average_price,

    previous_inventory,

    recent_average_units,

    demand_momentum,

    historical_price_elasticity,

):

    today = pd.Timestamp.today()


    # ========================================================
    # PRICE SAFETY
    # ========================================================

    if base_price <= 0:

        base_price = current_price


    if current_price <= 0:

        current_price = base_price


    # ========================================================
    # PRICE RATIO
    # ========================================================

    price_ratio = (

        current_price
        /
        max(
            base_price,
            0.01,
        )

    )


    price_ratio = float(
        np.clip(
            price_ratio,
            0.10,
            3.0,
        )
    )


    # ========================================================
    # EFFECTIVE DISCOUNT
    # ========================================================

    effective_discount_pct = (

        1
        -
        price_ratio

    ) * 100


    effective_discount_pct = float(
        np.clip(
            effective_discount_pct,
            -200,
            95,
        )
    )


    # ========================================================
    # CATEGORY AVERAGE PRICE
    # ========================================================

    if category_avg_price <= 0:

        category_avg_price = current_price


    price_vs_category_avg = (

        current_price
        /
        max(
            category_avg_price,
            0.01,
        )

    )


    price_vs_category_avg = float(
        np.clip(
            price_vs_category_avg,
            0.10,
            5.0,
        )
    )


    # ========================================================
    # RECENT AVERAGE PRICE
    # ========================================================

    if (
        recent_average_price is None
        or
        not np.isfinite(
            recent_average_price
        )
        or
        recent_average_price <= 0
    ):

        recent_average_price = (
            category_avg_price
        )


    if recent_average_price <= 0:

        recent_average_price = (
            current_price
        )


    price_vs_recent_avg = (

        current_price
        /
        max(
            recent_average_price,
            0.01,
        )

    )


    price_vs_recent_avg = float(
        np.clip(
            price_vs_recent_avg,
            0.10,
            5.0,
        )
    )


    # ========================================================
    # INVENTORY
    # ========================================================

    previous_inventory = max(
        float(previous_inventory),
        0.0,
    )


    inventory_reference = max(
        previous_inventory,
        1.0,
    )


    inventory_ratio = (

        float(stock)
        /
        inventory_reference

    )


    inventory_ratio = float(
        np.clip(
            inventory_ratio,
            0.0,
            10.0,
        )
    )


    # ========================================================
    # PRICE-DEMAND PRESSURE
    # ========================================================

    price_demand_pressure = (

        price_vs_recent_avg
        *
        (
            1.0
            +
            0.10
            *
            inventory_ratio
        )

    )


    price_demand_pressure = float(
        np.clip(
            price_demand_pressure,
            0.0,
            10.0,
        )
    )


    # ========================================================
    # CUSTOMER BEHAVIOUR
    # ========================================================

    cb = customer_behavior[

        customer_behavior[
            "Product_Category"
        ]
        ==
        category

    ]


    if not cb.empty:

        cb_row = cb.iloc[0]


        customer_values = {

            "customer_avg_age":
                cb_row[
                    "customer_avg_age"
                ],

            "customer_avg_unit_price":
                cb_row[
                    "customer_avg_unit_price"
                ],

            "customer_avg_quantity":
                cb_row[
                    "customer_avg_quantity"
                ],

            "customer_avg_discount_amount":
                cb_row[
                    "customer_avg_discount_amount"
                ],

            "customer_avg_order_value":
                cb_row[
                    "customer_avg_order_value"
                ],

            "customer_returning_rate":
                cb_row[
                    "customer_returning_rate"
                ],

            "customer_avg_session_duration":
                cb_row[
                    "customer_avg_session_duration"
                ],

            "customer_avg_pages_viewed":
                cb_row[
                    "customer_avg_pages_viewed"
                ],

            "customer_avg_delivery_time":
                cb_row[
                    "customer_avg_delivery_time"
                ],

            "customer_avg_rating":
                cb_row[
                    "customer_avg_rating"
                ],

            "customer_order_count":
                cb_row[
                    "customer_order_count"
                ],

        }


    else:

        customer_values = {

            "customer_avg_age":
                35.0,

            "customer_avg_unit_price":
                base_price,

            "customer_avg_quantity":
                3.0,

            "customer_avg_discount_amount":
                0.0,

            "customer_avg_order_value":
                base_price * 3,

            "customer_returning_rate":
                0.75,

            "customer_avg_session_duration":
                15.0,

            "customer_avg_pages_viewed":
                8.0,

            "customer_avg_delivery_time":
                5.0,

            "customer_avg_rating":
                4.0,

            "customer_order_count":
                1000,

        }


    # ========================================================
    # HISTORICAL VALUES
    # ========================================================

    recent_average_units = max(
        float(recent_average_units),
        1.0,
    )


    demand_momentum = float(
        np.clip(
            demand_momentum,
            0.25,
            4.0,
        )
    )


    historical_price_elasticity = float(
        np.clip(
            historical_price_elasticity,
            -10.0,
            2.0,
        )
    )


    # ========================================================
    # INVENTORY PRESSURE
    # ========================================================

    inventory_pressure = (

        previous_inventory
        /
        max(
            recent_average_units,
            1.0,
        )

    )


    inventory_pressure = float(
        np.clip(
            inventory_pressure,
            0.0,
            10000.0,
        )
    )


    # ========================================================
    # MODEL ROW
    # ========================================================

    row = {

        # ----------------------------------------------------
        # PRICE
        # ----------------------------------------------------

        "current_price":
            current_price,

        "base_price":
            base_price,

        "price_ratio":
            price_ratio,

        "effective_discount_pct":
            effective_discount_pct,

        "price_vs_category_avg":
            price_vs_category_avg,

        "price_vs_recent_avg":
            price_vs_recent_avg,

        "price_demand_pressure":
            price_demand_pressure,

        "price_change_pct":
            0.0,

        "historical_price_elasticity":
            historical_price_elasticity,

        # ----------------------------------------------------
        # DEMAND TREND
        # ----------------------------------------------------

        "demand_momentum":
            demand_momentum,

        "rolling_units_7":
            recent_average_units,

        "rolling_units_14":
            recent_average_units,

        "rolling_price_7":
            recent_average_price,

        # ----------------------------------------------------
        # INVENTORY
        # ----------------------------------------------------

        "inventory_level":
            stock,

        "previous_inventory":
            previous_inventory,

        "inventory_pressure":
            inventory_pressure,

        "stockout_flag":
            1 if stock <= 0 else 0,

        # ----------------------------------------------------
        # TIME
        # ----------------------------------------------------

        "year":
            today.year,

        "month":
            today.month,

        "day":
            today.day,

        "day_of_week":
            today.weekday(),

        # ----------------------------------------------------
        # CATEGORICAL
        # ----------------------------------------------------

        "category":
            category,

        "brand":
            brand,

        "region":
            region,

        "channel":
            channel,

        "season":
            season,

        "promotion_type":
            promotion_type,

    }


    row.update(
        customer_values
    )


    input_df = pd.DataFrame(
        [row]
    )


    # ========================================================
    # FINAL FEATURE ORDER
    # ========================================================

    input_df = input_df[
        EXPECTED_FEATURES
    ]


    return input_df


# ============================================================
# PREDICTION
# ============================================================

def predict_units(

    model,

    preprocessor,

    input_df,

):

    missing_features = [

        feature

        for feature in EXPECTED_FEATURES

        if feature not in input_df.columns

    ]


    if missing_features:

        raise ValueError(
            "Missing model features:\n"
            +
            str(missing_features)
        )


    processed = (
        preprocessor.transform(
            input_df
        )
    )


    prediction_log = float(
        model.predict(
            processed
        )[0]
    )


    prediction = float(
        np.expm1(
            prediction_log
        )
    )


    return max(
        0.0,
        prediction,
    )


# ============================================================
# MONOTONICITY CHECK
# ============================================================

def check_monotonicity(
    results_df,
):

    units = (
        results_df[
            "units"
        ]
        .values
    )


    differences = np.diff(
        units
    )


    violations = int(
        np.sum(
            differences
            >
            MONOTONIC_TOLERANCE
        )
    )


    return violations


# ============================================================
# RECOMMENDATION CONCENTRATION
# ============================================================

def calculate_recommendation_concentration(
    summary_df,
):

    if summary_df.empty:

        return 0.0, None


    counts = (
        summary_df[
            "recommended_change"
        ]
        .value_counts()
    )


    if counts.empty:

        return 0.0, None


    most_common_pct = counts.index[0]

    most_common_count = counts.iloc[0]

    concentration = (

        most_common_count
        /
        len(summary_df)

    ) * 100


    return (
        concentration,
        float(most_common_pct),
    )


# ============================================================
# EVALUATE PRODUCT
# ============================================================

def evaluate_product(

    model,

    preprocessor,

    category,

    brand,

    region,

    channel,

    season,

    promotion_type,

    current_price,

    base_price,

    stock,

    category_avg_price,

    recent_average_price,

    previous_inventory,

    recent_average_units,

    demand_momentum,

    historical_price_elasticity,

    customer_behavior,

):

    print()
    print("=" * 85)

    print(
        f"CATEGORY : {category.upper()}"
    )

    print(
        f"PRICE    : Rs.{current_price:.2f}"
    )

    print(
        f"STOCK    : {stock}"
    )

    print(
        f"DEMAND MOMENTUM      : "
        f"{demand_momentum:.3f}"
    )

    print(
        f"HISTORICAL ELASTICITY: "
        f"{historical_price_elasticity:.3f}"
    )

    print(
        "=" * 85
    )


    results = []


    # ========================================================
    # GENERATE PRICE CANDIDATES
    # ========================================================

    for pct in range(

        CANDIDATE_MIN_PCT,

        CANDIDATE_MAX_PCT + 1,

        CANDIDATE_STEP_PCT,

    ):

        candidate_price = round(

            current_price
            *
            (
                1
                +
                pct / 100
            ),

            2,

        )


        input_df = build_row(

            category=category,

            brand=brand,

            region=region,

            channel=channel,

            season=season,

            promotion_type=promotion_type,

            current_price=candidate_price,

            base_price=base_price,

            stock=stock,

            customer_behavior=customer_behavior,

            category_avg_price=category_avg_price,

            recent_average_price=recent_average_price,

            previous_inventory=previous_inventory,

            recent_average_units=recent_average_units,

            demand_momentum=demand_momentum,

            historical_price_elasticity=historical_price_elasticity,

        )


        predicted_units = predict_units(

            model,

            preprocessor,

            input_df,

        )


        predicted_revenue = (

            candidate_price
            *
            predicted_units

        )


        results.append({

            "pct":
                pct,

            "price":
                candidate_price,

            "units":
                predicted_units,

            "revenue":
                predicted_revenue,

        })


    results_df = pd.DataFrame(
        results
    )


    # ========================================================
    # BASELINE
    # ========================================================

    baseline_row = results_df[
        results_df["pct"] == 0
    ].iloc[0]


    baseline_revenue = float(
        baseline_row["revenue"]
    )


    baseline_units = float(
        baseline_row["units"]
    )


    # ========================================================
    # BEST REVENUE
    # ========================================================

    best_row = results_df.loc[
        results_df[
            "revenue"
        ].idxmax()
    ]


    best_revenue = float(
        best_row["revenue"]
    )


    # ========================================================
    # REVENUE IMPROVEMENT
    # ========================================================

    if baseline_revenue > 0:

        improvement_pct = (

            (
                best_revenue
                -
                baseline_revenue
            )
            /
            baseline_revenue

        ) * 100

    else:

        improvement_pct = 0.0


    # ========================================================
    # RECOMMENDATION
    #
    # Only change price when the revenue improvement is
    # meaningful.
    # ========================================================

    if improvement_pct < MIN_REVENUE_IMPROVEMENT_PCT:

        final_row = baseline_row

    else:

        final_row = best_row


    change_pct = float(
        final_row["pct"]
    )


    # ========================================================
    # RECOMMENDATION LABEL
    # ========================================================

    if change_pct >= 2:

        recommendation = (
            "INCREASE PRICE"
        )

    elif change_pct <= -2:

        recommendation = (
            "DECREASE PRICE"
        )

    else:

        recommendation = (
            "MAINTAIN PRICE"
        )


    # ========================================================
    # DEMAND SENSITIVITY
    # ========================================================

    min_units = float(
        results_df[
            "units"
        ].min()
    )


    max_units = float(
        results_df[
            "units"
        ].max()
    )


    mean_units = float(
        results_df[
            "units"
        ].mean()
    )


    if mean_units > 0:

        variation_pct = (

            (
                max_units
                -
                min_units
            )
            /
            mean_units

        ) * 100

    else:

        variation_pct = 0.0


    # ========================================================
    # DEMAND CHANGE FROM -20% TO +20%
    # ========================================================

    low_price_units = float(
        results_df.loc[
            results_df["pct"] == -20,
            "units",
        ].iloc[0]
    )


    high_price_units = float(
        results_df.loc[
            results_df["pct"] == 20,
            "units",
        ].iloc[0]
    )


    if low_price_units > 0:

        demand_change_pct = (

            (
                high_price_units
                -
                low_price_units
            )
            /
            low_price_units

        ) * 100

    else:

        demand_change_pct = 0.0


    # ========================================================
    # MONOTONICITY
    # ========================================================

    monotonicity_violations = (
        check_monotonicity(
            results_df
        )
    )


    # ========================================================
    # PRICE CURVE SHAPE
    # ========================================================

    revenue_max_pct = int(
        best_row["pct"]
    )


    # ========================================================
    # PRINT
    # ========================================================

    print()

    print(
        f"Recommended change : "
        f"{change_pct:+.0f}%"
    )

    print(
        f"Recommended price  : "
        f"Rs.{final_row['price']:.2f}"
    )

    print(
        f"Recommendation      : "
        f"{recommendation}"
    )

    print(
        f"Revenue improvement : "
        f"{improvement_pct:.2f}%"
    )

    print(
        f"Demand variation    : "
        f"{variation_pct:.2f}%"
    )

    print(
        f"Demand -20% to +20% : "
        f"{demand_change_pct:.2f}%"
    )

    print(
        f"Revenue optimum     : "
        f"{revenue_max_pct:+d}%"
    )

    print(
        f"Monotonic violations: "
        f"{monotonicity_violations}"
    )


    if monotonicity_violations == 0:

        print(
            "Price behaviour     : PASS"
        )

    else:

        print(
            "Price behaviour     : WARNING"
        )


    # ========================================================
    # BASELINE VS RECOMMENDED
    # ========================================================

    recommended_units = float(
        final_row["units"]
    )


    if baseline_units > 0:

        unit_change_pct = (

            (
                recommended_units
                -
                baseline_units
            )
            /
            baseline_units

        ) * 100

    else:

        unit_change_pct = 0.0


    print(
        f"Demand at baseline  : "
        f"{baseline_units:.2f}"
    )

    print(
        f"Demand recommended  : "
        f"{recommended_units:.2f}"
    )

    print(
        f"Demand change       : "
        f"{unit_change_pct:.2f}%"
    )


    # ========================================================
    # SELECTED PRICE CURVE
    # ========================================================

    print()

    print(
        "Selected price curve:"
    )


    for pct in [

        -20,
        -15,
        -10,
        -5,
        0,
        5,
        10,
        15,
        20,

    ]:

        row = results_df[
            results_df["pct"] == pct
        ].iloc[0]


        print(

            f"{pct:+4d}% | "
            f"Rs.{row['price']:>9.2f} | "
            f"units={row['units']:>10.2f} | "
            f"revenue=Rs.{row['revenue']:>12.2f}"

        )


    return {

        "category":
            category,

        "stock":
            stock,

        "recommended_change":
            change_pct,

        "recommendation":
            recommendation,

        "revenue_improvement":
            improvement_pct,

        "demand_variation":
            variation_pct,

        "demand_change_minus20_to_plus20":
            demand_change_pct,

        "recommended_price":
            float(
                final_row["price"]
            ),

        "monotonicity_violations":
            monotonicity_violations,

        "revenue_optimum_pct":
            revenue_max_pct,

        "demand_momentum":
            demand_momentum,

        "historical_price_elasticity":
            historical_price_elasticity,

    }


# ============================================================
# MAIN
# ============================================================

def main():

    print()
    print("=" * 85)

    print(
        "PRICE INTELLIGENCE VALIDATION"
    )

    print("=" * 85)


    # ========================================================
    # LOAD
    # ========================================================

    model, preprocessor = (
        load_model()
    )


    customer_behavior = (
        load_customer_behavior()
    )


    pricing_df = (
        load_pricing_data()
    )


    category_signals, latest_rows = (
        load_category_signals(
            pricing_df
        )
    )


    historical_df = (
        build_historical_signals(
            pricing_df
        )
    )


    print()
    print(
        "Model loaded successfully."
    )


    print(
        f"Categories found: "
        f"{len(category_signals)}"
    )


    # ========================================================
    # PREPROCESSOR COMPATIBILITY CHECK
    # ========================================================

    print()
    print("=" * 85)

    print(
        "MODEL FEATURE COMPATIBILITY CHECK"
    )

    print("=" * 85)


    preprocessor_features = list(
        preprocessor.feature_names_in_
    )


    missing_from_validation = [

        feature

        for feature in preprocessor_features

        if feature not in EXPECTED_FEATURES

    ]


    missing_from_model = [

        feature

        for feature in EXPECTED_FEATURES

        if feature not in preprocessor_features

    ]


    if missing_from_validation:

        print()

        print(
            "WARNING: The trained preprocessor contains "
            "features not listed in validation."
        )

        print(
            missing_from_validation
        )


    if missing_from_model:

        print()

        print(
            "WARNING: Validation expects features that "
            "the trained preprocessor does not use."
        )

        print(
            missing_from_model
        )


    if (
        not missing_from_validation
        and
        not missing_from_model
    ):

        print(
            "PASS: Validation feature set matches "
            "the trained preprocessor."
        )


    # ========================================================
    # HISTORICAL SIGNAL CHECK
    # ========================================================

    print()
    print("=" * 85)

    print(
        "HISTORICAL SIGNAL CHECK"
    )

    print("=" * 85)


    print()

    print(
        "Historical signals are now calculated from "
        "previous observations only."
    )


    elasticity_summary = (
        historical_df
        .groupby("category")[
            "historical_price_elasticity"
        ]
        .last()
    )


    momentum_summary = (
        historical_df
        .groupby("category")[
            "demand_momentum"
        ]
        .last()
    )


    print()

    print(
        "Category historical signals:"
    )


    for category in category_signals[
        "category"
    ].tolist():

        elasticity = float(
            elasticity_summary.get(
                category,
                0.0,
            )
        )


        momentum = float(
            momentum_summary.get(
                category,
                1.0,
            )
        )


        print(

            f" - {category:<15} | "
            f"elasticity={elasticity:>8.3f} | "
            f"momentum={momentum:>8.3f}"

        )


    # ========================================================
    # VALIDATION
    # ========================================================

    summary = []


    for _, signal in (
        category_signals.iterrows()
    ):

        category = signal[
            "category"
        ]


        latest_candidates = (
            latest_rows[
                latest_rows[
                    "category"
                ]
                ==
                category
            ]
        )


        if latest_candidates.empty:

            continue


        latest = (
            latest_candidates
            .iloc[0]
        )


        # ====================================================
        # BASE PRICE
        # ====================================================

        base_price = float(
            signal[
                "average_base_price"
            ]
        )


        # ====================================================
        # CURRENT PRICE
        # ====================================================

        average_current_price = float(
            signal[
                "average_current_price"
            ]
        )


        # ====================================================
        # CATEGORY AVERAGE PRICE
        # ====================================================

        category_avg_price = (
            average_current_price
        )


        if category_avg_price <= 0:

            category_avg_price = (
                base_price
            )


        # ====================================================
        # HISTORICAL CONTEXT
        # ====================================================

        historical_context = (
            get_category_historical_context(
                historical_df,
                category,
            )
        )


        recent_average_price = (
            historical_context[
                "recent_average_price"
            ]
        )


        previous_inventory = (
            historical_context[
                "previous_inventory"
            ]
        )


        recent_average_units = (
            historical_context[
                "recent_average_units"
            ]
        )


        demand_momentum = (
            historical_context[
                "demand_momentum"
            ]
        )


        historical_price_elasticity = (
            historical_context[
                "historical_price_elasticity"
            ]
        )


        # ====================================================
        # FALLBACKS
        # ====================================================

        if (
            not np.isfinite(
                recent_average_price
            )
            or
            recent_average_price <= 0
        ):

            recent_average_price = (
                category_avg_price
            )


        if (
            not np.isfinite(
                previous_inventory
            )
            or
            previous_inventory < 0
        ):

            previous_inventory = float(
                signal[
                    "average_inventory"
                ]
            )


        if (
            not np.isfinite(
                recent_average_units
            )
            or
            recent_average_units <= 0
        ):

            recent_average_units = float(
                signal[
                    "average_units_sold"
                ]
            )


        if (
            not np.isfinite(
                demand_momentum
            )
            or
            demand_momentum <= 0
        ):

            demand_momentum = 1.0


        if not np.isfinite(
            historical_price_elasticity
        ):

            historical_price_elasticity = 0.0


        # ====================================================
        # TEST LOW AND HIGH INVENTORY
        # ====================================================

        for stock in [

            30,

            300,

        ]:

            result = evaluate_product(

                model=model,

                preprocessor=preprocessor,

                category=category,

                brand=str(
                    latest[
                        "brand"
                    ]
                )
                .strip()
                .lower(),

                region=str(
                    latest[
                        "region"
                    ]
                )
                .strip()
                .lower(),

                channel=str(
                    latest[
                        "channel"
                    ]
                )
                .strip()
                .lower(),

                season=str(
                    latest[
                        "season"
                    ]
                )
                .strip()
                .lower(),

                promotion_type=str(
                    latest[
                        "promotion_type"
                    ]
                )
                .strip()
                .lower(),

                current_price=(
                    average_current_price
                ),

                base_price=(
                    base_price
                ),

                stock=stock,

                category_avg_price=(
                    category_avg_price
                ),

                recent_average_price=(
                    recent_average_price
                ),

                previous_inventory=(
                    previous_inventory
                ),

                recent_average_units=(
                    recent_average_units
                ),

                demand_momentum=(
                    demand_momentum
                ),

                historical_price_elasticity=(
                    historical_price_elasticity
                ),

                customer_behavior=(
                    customer_behavior
                ),

            )


            summary.append(
                result
            )


    # ========================================================
    # SUMMARY
    # ========================================================

    print()
    print("=" * 85)

    print(
        "FINAL SUMMARY"
    )

    print("=" * 85)


    summary_df = pd.DataFrame(
        summary
    )


    if summary_df.empty:

        print(
            "No validation results."
        )

        return


    print(
        summary_df.to_string(
            index=False
        )
    )


    # ========================================================
    # RECOMMENDATION DISTRIBUTION
    # ========================================================

    print()
    print("=" * 85)

    print(
        "RECOMMENDATION DISTRIBUTION"
    )

    print("=" * 85)


    distribution = (
        summary_df[
            "recommendation"
        ]
        .value_counts()
    )


    print(
        distribution.to_string()
    )


    # ========================================================
    # RECOMMENDATION PERCENTAGE DISTRIBUTION
    # ========================================================

    print()
    print(
        "Recommendation percentages:"
    )


    percentage_distribution = (
        summary_df[
            "recommended_change"
        ]
        .value_counts()
        .sort_index()
    )


    print(
        percentage_distribution.to_string()
    )


    # ========================================================
    # CONCENTRATION CHECK
    # ========================================================

    concentration, dominant_percentage = (
        calculate_recommendation_concentration(
            summary_df
        )
    )


    print()

    print(
        f"Most common recommendation : "
        f"{dominant_percentage:+.0f}%"
    )


    print(
        f"Recommendation concentration: "
        f"{concentration:.2f}%"
    )


    if (
        concentration
        >
        MAX_RECOMMENDATION_CONCENTRATION_PCT
    ):

        print()

        print(
            "WARNING: recommendations are too concentrated."
        )

    else:

        print()

        print(
            "PASS: recommendation distribution is reasonably varied."
        )


    # ========================================================
    # MAINTAIN CHECK
    # ========================================================

    maintain_count = (
        (
            summary_df[
                "recommendation"
            ]
            ==
            "MAINTAIN PRICE"
        )
        .sum()
    )


    print()

    print(
        f"Maintain recommendations: "
        f"{maintain_count}/{len(summary_df)}"
    )


    # ========================================================
    # UNIQUE RECOMMENDATION CHECK
    # ========================================================

    unique_changes = (
        summary_df[
            "recommended_change"
        ]
        .nunique()
    )


    print()

    print(
        f"Unique recommendation percentages: "
        f"{unique_changes}"
    )


    if (
        unique_changes
        <
        MIN_UNIQUE_RECOMMENDATIONS
    ):

        print(
            "WARNING: recommendations are still too uniform."
        )

    else:

        print(
            "PASS: recommendations show meaningful variation."
        )


    # ========================================================
    # DEMAND VARIATION
    # ========================================================

    average_demand_variation = (
        summary_df[
            "demand_variation"
        ]
        .mean()
    )


    print()

    print(
        f"Average demand variation across tests: "
        f"{average_demand_variation:.2f}%"
    )


    if (
        average_demand_variation
        <
        MIN_DEMAND_VARIATION_PCT
    ):

        print(
            "WARNING: price response is weak."
        )

    elif average_demand_variation < 15:

        print(
            "MODERATE: price response exists but could improve."
        )

    else:

        print(
            "GOOD: model shows meaningful price response."
        )


    # ========================================================
    # DEMAND DIRECTION CHECK
    # ========================================================

    average_demand_direction = (
        summary_df[
            "demand_change_minus20_to_plus20"
        ]
        .mean()
    )


    print()

    print(
        f"Average demand change "
        f"(-20% price -> +20% price): "
        f"{average_demand_direction:.2f}%"
    )


    if average_demand_direction < 0:

        print(
            "PASS: average demand decreases as price increases."
        )

    else:

        print(
            "WARNING: average demand does not consistently "
            "decrease as price increases."
        )


    # ========================================================
    # MONOTONICITY SUMMARY
    # ========================================================

    total_monotonicity_violations = int(
        summary_df[
            "monotonicity_violations"
        ].sum()
    )


    print()

    print(
        f"Total monotonicity violations: "
        f"{total_monotonicity_violations}"
    )


    if total_monotonicity_violations == 0:

        print(
            "PASS: demand never increases when price increases."
        )

    else:

        print(
            "WARNING: raw model predictions contain "
            "monotonic price violations."
        )

        print(
            "This should be investigated in the trained "
            "price-response model rather than hidden by "
            "post-processing."
        )


    # ========================================================
    # REVENUE OPTIMUM DISTRIBUTION
    # ========================================================

    print()

    print(
        "Revenue optimum distribution:"
    )


    optimum_distribution = (
        summary_df[
            "revenue_optimum_pct"
        ]
        .value_counts()
        .sort_index()
    )


    print(
        optimum_distribution.to_string()
    )


    # ========================================================
    # INVENTORY COMPARISON
    # ========================================================

    low_stock = summary_df[
        summary_df[
            "stock"
        ]
        ==
        30
    ]


    high_stock = summary_df[
        summary_df[
            "stock"
        ]
        ==
        300
    ]


    inventory_effect = False


    if (
        not low_stock.empty
        and
        not high_stock.empty
    ):

        low_average = (
            low_stock[
                "recommended_change"
            ]
            .mean()
        )


        high_average = (
            high_stock[
                "recommended_change"
            ]
            .mean()
        )


        print()

        print(
            "Inventory comparison:"
        )


        print(
            f"Low stock average recommendation : "
            f"{low_average:+.2f}%"
        )


        print(
            f"High stock average recommendation: "
            f"{high_average:+.2f}%"
        )


        inventory_difference = abs(
            low_average
            -
            high_average
        )


        print(
            f"Inventory recommendation difference: "
            f"{inventory_difference:.2f}%"
        )


        if (
            inventory_difference
            >=
            INVENTORY_EFFECT_THRESHOLD
        ):

            print(
                "PASS: inventory conditions influence "
                "recommendations."
            )

            inventory_effect = True

        else:

            print(
                "WARNING: inventory impact is limited."
            )


    # ========================================================
    # ELASTICITY CHECK
    # ========================================================

    average_elasticity = (
        summary_df[
            "historical_price_elasticity"
        ]
        .mean()
    )


    print()

    print(
        f"Average historical price elasticity: "
        f"{average_elasticity:.3f}"
    )


    if average_elasticity < 0:

        print(
            "PASS: historical demand generally shows "
            "negative price elasticity."
        )

    elif average_elasticity == 0:

        print(
            "WARNING: historical elasticity is effectively neutral."
        )

    else:

        print(
            "WARNING: historical elasticity is positive."
        )


    # ========================================================
    # DEMAND MOMENTUM CHECK
    # ========================================================

    average_momentum = (
        summary_df[
            "demand_momentum"
        ]
        .mean()
    )


    print()

    print(
        f"Average demand momentum: "
        f"{average_momentum:.3f}"
    )


    if average_momentum != 1.0:

        print(
            "PASS: validation is using real historical "
            "demand momentum."
        )

    else:

        print(
            "WARNING: demand momentum is still effectively neutral."
        )


    # ========================================================
    # FINAL VERDICT
    # ========================================================

    print()
    print("=" * 85)

    print(
        "FINAL VERDICT"
    )

    print("=" * 85)


    healthy = (

        concentration
        <=
        MAX_RECOMMENDATION_CONCENTRATION_PCT

        and

        unique_changes
        >=
        MIN_UNIQUE_RECOMMENDATIONS

        and

        average_demand_variation
        >=
        MIN_DEMAND_VARIATION_PCT

        and

        average_demand_direction
        < 0

        and

        total_monotonicity_violations
        == 0

        and

        inventory_effect

    )


    if healthy:

        print()

        print(
            "MODEL STATUS: HEALTHY"
        )

        print()

        print(
            "The model is showing meaningful pricing variation."
        )

        print(
            "Demand responds appropriately to price changes."
        )

        print(
            "Recommendations are not overwhelmingly "
            "concentrated."
        )

        print(
            "Inventory conditions influence pricing decisions."
        )

        print(
            "Historical demand signals are being used."
        )

        print(
            "The optimizer is suitable for further "
            "API integration testing."
        )


    else:

        print()

        print(
            "MODEL STATUS: NEEDS IMPROVEMENT"
        )

        print()

        print(
            "The optimizer should NOT be deployed yet."
        )

        print()

        print(
            "Review the following areas:"
        )


        if (
            concentration
            >
            MAX_RECOMMENDATION_CONCENTRATION_PCT
        ):

            print(
                " - Recommendation concentration is too high."
            )


        if (
            unique_changes
            <
            MIN_UNIQUE_RECOMMENDATIONS
        ):

            print(
                " - Too few unique recommendation percentages."
            )


        if (
            average_demand_variation
            <
            MIN_DEMAND_VARIATION_PCT
        ):

            print(
                " - Price sensitivity is too weak."
            )


        if average_demand_direction >= 0:

            print(
                " - Demand is not decreasing sufficiently "
                "as price increases."
            )


        if total_monotonicity_violations > 0:

            print(
                " - Raw model has monotonicity violations."
            )


        if not inventory_effect:

            print(
                " - Inventory is not sufficiently influencing "
                "recommendations."
            )


        if average_elasticity >= 0:

            print(
                " - Historical elasticity does not show "
                "the expected negative relationship."
            )


    print()

    print("=" * 85)


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":

    main()