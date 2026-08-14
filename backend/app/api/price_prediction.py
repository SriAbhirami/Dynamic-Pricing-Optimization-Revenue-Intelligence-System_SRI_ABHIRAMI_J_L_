import os
import joblib
import pandas as pd

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.models.products import Product
from app.models.pricing_demand import PricingDemand
from app.auth.oauth2 import get_current_user


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/price-prediction",
    tags=["Price Prediction"],
)


# ============================================================
# PROJECT PATHS
# ============================================================

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        CURRENT_DIR,
        "..",
        "..",
        "..",
    )
)

MODEL_DIR = os.path.join(
    CURRENT_DIR,
    "..",
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
    PROJECT_ROOT,
    "datasets",
    "raw",
    "ecommerce_customer_behavior_dataset_v2.csv",
)


# ============================================================
# CURRENCY NORMALIZATION
# ============================================================

USD_TO_INR = 85.0


# ============================================================
# CANDIDATE PRICE RANGE
# ============================================================

CANDIDATE_MIN_PCT = -20
CANDIDATE_MAX_PCT = 15
CANDIDATE_STEP_PCT = 1


# ============================================================
# REVENUE IMPROVEMENT THRESHOLD
# ============================================================

MIN_REVENUE_IMPROVEMENT_PCT = 1.0


# ============================================================
# HIGH DEMAND / LOW STOCK GUARD
# ============================================================

HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT = -8


# ============================================================
# PRICE POSITION INTELLIGENCE
# ============================================================

PRICE_POSITION_HEAVY_DISCOUNT_PCT = -15
PRICE_POSITION_MODERATE_DISCOUNT_PCT = -5

PRICE_POSITION_PREMIUM_PCT = 15


# ============================================================
# PRICE POSITION BUSINESS GUARDS
# ============================================================

HEAVILY_DISCOUNTED_MAX_ADDITIONAL_DISCOUNT_PCT = -5

PREMIUM_PRICE_MIN_REVENUE_IMPROVEMENT_PCT = 3.0


# ============================================================
# BOUNDARY DETECTION
# ============================================================

BOUNDARY_TOLERANCE_PCT = 0.01

BOUNDARY_REVENUE_MARGIN_PCT = 0.5

BOUNDARY_MAX_CONFIDENT_INCREASE_PCT = 10


# ============================================================
# LOAD PRICE RESPONSE MODEL
# ============================================================

try:

    model = joblib.load(
        MODEL_PATH
    )

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    print(
        "Price response model loaded successfully."
    )

    print(
        f"Model monetary scale: INR "
        f"(USD_TO_INR={USD_TO_INR})"
    )

except Exception as error:

    model = None
    preprocessor = None

    print(
        "Warning: Could not load price response model:",
        error,
    )


# ============================================================
# CUSTOMER BEHAVIOUR FEATURES
# ============================================================

customer_behavior = None
customer_global_defaults = {}


try:

    customer_df = pd.read_csv(
        CUSTOMER_DATA_PATH
    )

    # ========================================================
    # CATEGORY NORMALIZATION
    # ========================================================

    customer_df["Product_Category"] = (
        customer_df["Product_Category"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    # ========================================================
    # NUMERIC CONVERSION
    # ========================================================

    numeric_columns = [
        "Age",
        "Unit_Price",
        "Quantity",
        "Discount_Amount",
        "Total_Amount",
        "Session_Duration_Minutes",
        "Pages_Viewed",
        "Delivery_Time_Days",
        "Customer_Rating",
    ]

    for column in numeric_columns:

        if column in customer_df.columns:

            customer_df[column] = pd.to_numeric(
                customer_df[column],
                errors="coerce",
            )

    # ========================================================
    # RETURNING CUSTOMER
    # ========================================================

    customer_df["Is_Returning_Customer"] = (
        pd.to_numeric(
            customer_df["Is_Returning_Customer"],
            errors="coerce",
        )
        .fillna(0)
        .astype(int)
    )

    # ========================================================
    # INR NORMALIZATION
    # ========================================================

    customer_monetary_columns = [
        "Unit_Price",
        "Discount_Amount",
        "Total_Amount",
    ]

    for column in customer_monetary_columns:

        if column in customer_df.columns:

            customer_df[column] = (
                customer_df[column]
                * USD_TO_INR
            )

    print(
        "Customer monetary features converted to INR."
    )

    print(
        f"Customer monetary conversion factor: "
        f"{USD_TO_INR}"
    )

    # ========================================================
    # CATEGORY CUSTOMER AGGREGATION
    # ========================================================

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

    # ========================================================
    # GLOBAL CUSTOMER DEFAULTS
    # ========================================================

    customer_global_defaults = {

        "customer_avg_age":
            float(
                customer_df["Age"].mean()
            ),

        "customer_avg_unit_price":
            float(
                customer_df["Unit_Price"].mean()
            ),

        "customer_avg_quantity":
            float(
                customer_df["Quantity"].mean()
            ),

        "customer_avg_discount_amount":
            float(
                customer_df["Discount_Amount"].mean()
            ),

        "customer_avg_order_value":
            float(
                customer_df["Total_Amount"].mean()
            ),

        "customer_returning_rate":
            float(
                customer_df[
                    "Is_Returning_Customer"
                ].mean()
            ),

        "customer_avg_session_duration":
            float(
                customer_df[
                    "Session_Duration_Minutes"
                ].mean()
            ),

        "customer_avg_pages_viewed":
            float(
                customer_df[
                    "Pages_Viewed"
                ].mean()
            ),

        "customer_avg_delivery_time":
            float(
                customer_df[
                    "Delivery_Time_Days"
                ].mean()
            ),

        "customer_avg_rating":
            float(
                customer_df[
                    "Customer_Rating"
                ].mean()
            ),

        "customer_order_count":
            float(
                customer_df["Order_ID"].count()
            ),
    }

    print(
        "Customer behaviour features loaded successfully."
    )

    print(
        "Global customer fallback features prepared successfully."
    )

except Exception as error:

    print(
        "Warning: Could not load customer behaviour data:",
        error,
    )


# ============================================================
# RESPONSE SCHEMAS
# ============================================================

class PriceCandidate(BaseModel):

    candidate_price: float

    predicted_units_sold: float

    predicted_revenue: float


class PricingFactor(BaseModel):

    factor: str

    value: str

    impact: str


class PriceOptimizationResponse(BaseModel):

    product_id: int

    product_name: str

    category: str

    current_price: float

    recommended_price: float

    expected_units_sold: float

    expected_revenue: float

    price_change_percentage: float

    revenue_change_percentage: float

    candidates: list[PriceCandidate]

    recommendation: str

    explanation: str

    pricing_factors: list[PricingFactor]


class ProductPricingAnalysisResponse(BaseModel):

    product_id: int

    product_name: str

    category: str

    current_price: float

    stock: int
    base_price: float
    demand_index: float
    units_sold: int
    inventory_level: int

    discount_pct: float

    predicted_price: float

    price_difference: float

    price_change_percentage: float

    recommendation: str

    demand_level: str

    sales_velocity: str

    inventory_status: str

    reasons: list[str]


# ============================================================
# CATEGORY NORMALIZATION
# ============================================================

def normalize_category(
    category
):

    normalized = (
        str(category)
        .strip()
        .lower()
    )

    if not normalized or normalized == "none":

        normalized = "unknown"

    return normalized


# ============================================================
# HISTORICAL MARKET FEATURES
# ============================================================

def get_historical_market_features(
    product,
    db,
    current_price,
):

    category = normalize_category(
        product.category
    )

    features = {

        "price_vs_category_avg": 0.0,

        "rolling_price_7": current_price,

        "price_vs_recent_avg": 0.0,

        "rolling_units_7": 0.0,

        "rolling_units_14": 0.0,

        "demand_momentum": 0.0,

        "inventory_pressure": 0.0,

        "historical_price_elasticity": 0.0,

        "price_demand_pressure": 0.0,
    }

    try:

        category_rows = (
            db.query(PricingDemand)
            .filter(
                func.lower(
                    PricingDemand.category
                ) == category
            )
            .order_by(
                PricingDemand.date.desc()
            )
            .limit(30)
            .all()
        )

    except Exception as error:

        print(
            "Historical market feature query failed:",
            error,
        )

        return features

    if not category_rows:

        return features

    rows = []

    for row in category_rows:

        base_price = float(
            row.base_price or 0
        )

        units_sold = float(
            row.units_sold or 0
        )

        inventory_level = float(
            row.inventory_level or 0
        )

        demand_index = float(
            row.demand_index or 0
        )

        discount_pct = float(
            row.discount_pct or 0
        )

        historical_price = (
            base_price
            * (
                1
                - discount_pct / 100
            )
        )

        rows.append(
            {
                "price": historical_price,
                "base_price": base_price,
                "units_sold": units_sold,
                "inventory": inventory_level,
                "demand_index": demand_index,
                "discount_pct": discount_pct,
            }
        )

    if not rows:

        return features

    history = pd.DataFrame(
        rows
    )

    category_avg_price = float(
        history["price"].mean()
    )

    recent_history = history.head(
        min(
            7,
            len(history)
        )
    )

    recent_price_avg = float(
        recent_history["price"].mean()
    )

    if category_avg_price > 0:

        price_vs_category_avg = (
            (
                current_price
                - category_avg_price
            )
            / category_avg_price
        ) * 100

    else:

        price_vs_category_avg = 0.0

    if recent_price_avg > 0:

        price_vs_recent_avg = (
            (
                current_price
                - recent_price_avg
            )
            / recent_price_avg
        ) * 100

    else:

        price_vs_recent_avg = 0.0

    rolling_price_7 = float(
        recent_history["price"].mean()
    )

    rolling_price_14 = float(
        history.head(
            min(
                14,
                len(history)
            )
        )["price"].mean()
    )

    rolling_units_7 = float(
        recent_history["units_sold"].mean()
    )

    rolling_units_14 = float(
        history.head(
            min(
                14,
                len(history)
            )
        )["units_sold"].mean()
    )

    if len(history) >= 14:

        recent_demand = float(
            history.head(
                7
            )["demand_index"].mean()
        )

        previous_demand = float(
            history.iloc[
                7:14
            ]["demand_index"].mean()
        )

        if previous_demand != 0:

            demand_momentum = (
                (
                    recent_demand
                    - previous_demand
                )
                / abs(previous_demand)
            ) * 100

        else:

            demand_momentum = 0.0

    else:

        demand_momentum = 0.0

    average_inventory = float(
        history["inventory"].mean()
    )

    current_inventory = float(
        product.stock
    )

    if average_inventory > 0:

        inventory_pressure = (
            (
                average_inventory
                - current_inventory
            )
            / average_inventory
        ) * 100

    else:

        inventory_pressure = 0.0

    # ========================================================
    # HISTORICAL PRICE ELASTICITY
    # ========================================================

    elasticity_values = []

    if len(history) >= 2:

        for index in range(
            len(history) - 1
        ):

            current_row = history.iloc[
                index
            ]

            previous_row = history.iloc[
                index + 1
            ]

            previous_price = float(
                previous_row["price"]
            )

            previous_units = float(
                previous_row["units_sold"]
            )

            current_price_hist = float(
                current_row["price"]
            )

            current_units = float(
                current_row["units_sold"]
            )

            if (
                previous_price > 0
                and previous_units > 0
            ):

                price_change = (
                    (
                        current_price_hist
                        - previous_price
                    )
                    / previous_price
                )

                units_change = (
                    (
                        current_units
                        - previous_units
                    )
                    / previous_units
                )

                if abs(price_change) > 0.001:

                    elasticity = (
                        units_change
                        / price_change
                    )

                    if (
                        pd.notna(elasticity)
                        and abs(elasticity) < 10
                    ):

                        elasticity_values.append(
                            elasticity
                        )

    if elasticity_values:

        historical_price_elasticity = float(
            sum(elasticity_values)
            / len(elasticity_values)
        )

    else:

        historical_price_elasticity = 0.0

    average_demand = float(
        history["demand_index"].mean()
    )

    if category_avg_price > 0:

        relative_price = (
            current_price
            / category_avg_price
        )

    else:

        relative_price = 1.0

    if average_demand > 0:

        demand_strength = (
            average_demand
            / 100
        )

    else:

        demand_strength = 0.0

    price_demand_pressure = (
        relative_price
        * demand_strength
        * 100
    )

    features.update(
        {

            "price_vs_category_avg":
                float(
                    price_vs_category_avg
                ),

            "rolling_price_7":
                float(
                    rolling_price_7
                ),

            "price_vs_recent_avg":
                float(
                    price_vs_recent_avg
                ),

            "rolling_units_7":
                float(
                    rolling_units_7
                ),

            "rolling_units_14":
                float(
                    rolling_units_14
                ),

            "demand_momentum":
                float(
                    demand_momentum
                ),

            "inventory_pressure":
                float(
                    inventory_pressure
                ),

            "historical_price_elasticity":
                float(
                    historical_price_elasticity
                ),

            "price_demand_pressure":
                float(
                    price_demand_pressure
                ),
        }
    )

    print(
        "[MARKET FEATURES]"
    )

    print(
        f"Category={category}"
    )

    print(
        f"Category Avg Price=₹{category_avg_price:.2f}"
    )

    print(
        f"Current Price=₹{current_price:.2f}"
    )

    print(
        f"Price Position={price_vs_category_avg:.2f}%"
    )

    print(
        f"Recent Price Avg=₹{recent_price_avg:.2f}"
    )

    print(
        f"Demand Momentum={demand_momentum:.2f}%"
    )

    print(
        f"Inventory Pressure={inventory_pressure:.2f}%"
    )

    print(
        f"Historical Elasticity={historical_price_elasticity:.4f}"
    )

    print(
        f"Price-Demand Pressure={price_demand_pressure:.2f}"
    )

    return features


# ============================================================
# BUILD MODEL INPUT
# ============================================================

def build_model_input(
    product,
    latest_category_data,
    average_base_price,
    average_units_sold,
    average_inventory,
    average_demand_index,
    current_price,
    candidate_price,
    db,
):

    today = pd.Timestamp.today()

    category = normalize_category(
        product.category
    )

    # ========================================================
    # PRICE RESPONSE FEATURES
    # ========================================================

    reference_price = current_price

    if reference_price <= 0:

        reference_price = candidate_price

    price_ratio = (
        candidate_price
        / reference_price
    )

    effective_discount_pct = (
        (
            reference_price
            - candidate_price
        )
        / reference_price
    ) * 100

    price_change_pct = (
        (
            candidate_price
            - current_price
        )
        / current_price
    ) * 100

    # ========================================================
    # HISTORICAL MARKET FEATURES
    # ========================================================

    market_features = (
        get_historical_market_features(
            product=product,
            db=db,
            current_price=current_price,
        )
    )

    # ========================================================
    # CUSTOMER BEHAVIOUR
    # ========================================================

    customer_features = {}

    if customer_behavior is not None:

        category_customer = (
            customer_behavior[
                customer_behavior[
                    "Product_Category"
                ] == category
            ]
        )

        if not category_customer.empty:

            customer_row = (
                category_customer.iloc[0]
            )

            customer_features = {

                "customer_avg_age":
                    float(
                        customer_row[
                            "customer_avg_age"
                        ]
                    ),

                "customer_avg_unit_price":
                    float(
                        customer_row[
                            "customer_avg_unit_price"
                        ]
                    ),

                "customer_avg_quantity":
                    float(
                        customer_row[
                            "customer_avg_quantity"
                        ]
                    ),

                "customer_avg_discount_amount":
                    float(
                        customer_row[
                            "customer_avg_discount_amount"
                        ]
                    ),

                "customer_avg_order_value":
                    float(
                        customer_row[
                            "customer_avg_order_value"
                        ]
                    ),

                "customer_returning_rate":
                    float(
                        customer_row[
                            "customer_returning_rate"
                        ]
                    ),

                "customer_avg_session_duration":
                    float(
                        customer_row[
                            "customer_avg_session_duration"
                        ]
                    ),

                "customer_avg_pages_viewed":
                    float(
                        customer_row[
                            "customer_avg_pages_viewed"
                        ]
                    ),

                "customer_avg_delivery_time":
                    float(
                        customer_row[
                            "customer_avg_delivery_time"
                        ]
                    ),

                "customer_avg_rating":
                    float(
                        customer_row[
                            "customer_avg_rating"
                        ]
                    ),

                "customer_order_count":
                    float(
                        customer_row[
                            "customer_order_count"
                        ]
                    ),
            }

    # ========================================================
    # CUSTOMER FALLBACK
    # ========================================================

    if not customer_features:

        if customer_global_defaults:

            customer_features = (
                customer_global_defaults.copy()
            )

        else:

            customer_features = {

                "customer_avg_age":
                    35.0,

                "customer_avg_unit_price":
                    average_base_price,

                "customer_avg_quantity":
                    3.0,

                "customer_avg_discount_amount":
                    0.0,

                "customer_avg_order_value":
                    average_base_price * 3,

                "customer_returning_rate":
                    0.88,

                "customer_avg_session_duration":
                    14.5,

                "customer_avg_pages_viewed":
                    9.0,

                "customer_avg_delivery_time":
                    6.5,

                "customer_avg_rating":
                    3.9,

                "customer_order_count":
                    2000,
            }

    # ========================================================
    # CATEGORICAL FEATURES
    # ========================================================

    if latest_category_data is not None:

        brand = (
            str(
                latest_category_data.brand
            ).strip()
            if latest_category_data.brand
            else "unknown"
        )

        region = (
            str(
                latest_category_data.region
            ).strip()
            if latest_category_data.region
            else "unknown"
        )

        channel = (
            str(
                latest_category_data.channel
            ).strip()
            if latest_category_data.channel
            else "unknown"
        )

        season = (
            str(
                latest_category_data.season
            ).strip()
            if latest_category_data.season
            else "unknown"
        )

        promotion_type = (
            str(
                latest_category_data.promotion_type
            ).strip()
            if latest_category_data.promotion_type
            else "unknown"
        )

    else:

        brand = "unknown"
        region = "unknown"
        channel = "unknown"
        season = "unknown"
        promotion_type = "unknown"

    # ========================================================
    # PREVIOUS INVENTORY
    # ========================================================
    #
    # IMPORTANT:
    #
    # The trained price-response preprocessor expects
    # "previous_inventory".
    #
    # During live inference we use the latest available
    # historical inventory as the best approximation.
    #
    # Priority:
    #
    # 1. Latest historical inventory
    # 2. Average historical inventory
    # 3. Current product stock
    #
    # ========================================================

    if (
        latest_category_data is not None
        and latest_category_data.inventory_level is not None
    ):

        previous_inventory = float(
            latest_category_data.inventory_level
        )

    elif average_inventory is not None:

        previous_inventory = float(
            average_inventory
        )

    else:

        previous_inventory = float(
            product.stock
        )

    if (
        pd.isna(previous_inventory)
        or previous_inventory < 0
    ):

        previous_inventory = float(
            max(
                product.stock,
                0,
            )
        )

    # ========================================================
    # BUILD MODEL INPUT
    # ========================================================

    input_row = {

        # ----------------------------------------------------
        # PRICE FEATURES
        # ----------------------------------------------------

        "current_price":
            float(current_price),

        "base_price":
            float(average_base_price),

        "price_ratio":
            float(price_ratio),

        "effective_discount_pct":
            float(effective_discount_pct),

        "price_change_pct":
            float(price_change_pct),

        # ----------------------------------------------------
        # HISTORICAL MARKET FEATURES
        # ----------------------------------------------------

        "price_vs_category_avg":
            float(
                market_features[
                    "price_vs_category_avg"
                ]
            ),

        "rolling_price_7":
            float(
                market_features[
                    "rolling_price_7"
                ]
            ),

        "price_vs_recent_avg":
            float(
                market_features[
                    "price_vs_recent_avg"
                ]
            ),

        "rolling_units_7":
            float(
                market_features[
                    "rolling_units_7"
                ]
            ),

        "rolling_units_14":
            float(
                market_features[
                    "rolling_units_14"
                ]
            ),

        "demand_momentum":
            float(
                market_features[
                    "demand_momentum"
                ]
            ),

        "inventory_pressure":
            float(
                market_features[
                    "inventory_pressure"
                ]
            ),

        "historical_price_elasticity":
            float(
                market_features[
                    "historical_price_elasticity"
                ]
            ),

        "price_demand_pressure":
            float(
                market_features[
                    "price_demand_pressure"
                ]
            ),

        # ----------------------------------------------------
        # INVENTORY
        # ----------------------------------------------------

        "inventory_level":
            int(
                max(
                    product.stock,
                    0,
                )
            ),

        "previous_inventory":
            float(
                previous_inventory
            ),

        "stockout_flag":
            1
            if product.stock <= 0
            else 0,

        # ----------------------------------------------------
        # DATE
        # ----------------------------------------------------

        "year":
            int(today.year),

        "month":
            int(today.month),

        "day":
            int(today.day),

        "day_of_week":
            int(today.weekday()),

        # ----------------------------------------------------
        # CATEGORICAL
        # ----------------------------------------------------

        "product_id":
            str(product.id),

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

    # ========================================================
    # CUSTOMER FEATURES
    # ========================================================

    input_row.update(
        customer_features
    )

    # ========================================================
    # DATAFRAME
    # ========================================================

    input_df = pd.DataFrame(
        [input_row]
    )

    # ========================================================
    # DEBUG
    # ========================================================

    print()
    print(
        "[MODEL INPUT]"
    )

    print(
        "Input columns:"
    )

    print(
        list(
            input_df.columns
        )
    )

    print(
        f"Current inventory: "
        f"{input_df['inventory_level'].iloc[0]}"
    )

    print(
        f"Previous inventory: "
        f"{input_df['previous_inventory'].iloc[0]}"
    )

    print(
        f"Candidate price: "
        f"₹{candidate_price:.2f}"
    )

    print()

    return input_df


# ============================================================
# GET CATEGORY BUSINESS SIGNALS
# ============================================================

def get_category_signals(
    product,
    db,
):

    category = normalize_category(
        product.category
    )

    category_data = (
        db.query(
            func.avg(
                PricingDemand.base_price
            ).label(
                "average_base_price"
            ),

            func.avg(
                PricingDemand.units_sold
            ).label(
                "average_units_sold"
            ),

            func.avg(
                PricingDemand.inventory_level
            ).label(
                "average_inventory"
            ),

            func.avg(
                PricingDemand.demand_index
            ).label(
                "average_demand_index"
            ),

            func.avg(
                PricingDemand.discount_pct
            ).label(
                "average_discount_pct"
            ),
        )
        .filter(
            func.lower(
                PricingDemand.category
            ) == category
        )
        .first()
    )

    latest_category_data = (
        db.query(PricingDemand)
        .filter(
            func.lower(
                PricingDemand.category
            ) == category
        )
        .order_by(
            PricingDemand.date.desc()
        )
        .first()
    )

    category_exists = (
        latest_category_data is not None
        and category_data is not None
        and category_data.average_base_price is not None
    )

    if category_exists:

        average_base_price = float(
            category_data.average_base_price
        )

        average_units_sold = int(
            round(
                float(
                    category_data.average_units_sold
                    or 0
                )
            )
        )

        average_inventory = int(
            round(
                float(
                    category_data.average_inventory
                    or product.stock
                )
            )
        )

        average_demand_index = float(
            category_data.average_demand_index
            or 0
        )

        average_discount_pct = float(
            category_data.average_discount_pct
            or 0
        )

        print(
            f"Historical category found: '{category}'"
        )

        return (
            latest_category_data,
            average_base_price,
            average_units_sold,
            average_inventory,
            average_demand_index,
            average_discount_pct,
            False,
        )

    # ========================================================
    # GLOBAL FALLBACK
    # ========================================================

    print(
        f"Category '{category}' not found in historical data."
    )

    print(
        "Using GLOBAL historical business signals instead."
    )

    global_data = (
        db.query(
            func.avg(
                PricingDemand.base_price
            ).label(
                "average_base_price"
            ),

            func.avg(
                PricingDemand.units_sold
            ).label(
                "average_units_sold"
            ),

            func.avg(
                PricingDemand.inventory_level
            ).label(
                "average_inventory"
            ),

            func.avg(
                PricingDemand.demand_index
            ).label(
                "average_demand_index"
            ),

            func.avg(
                PricingDemand.discount_pct
            ).label(
                "average_discount_pct"
            ),
        )
        .first()
    )

    latest_global_data = (
        db.query(PricingDemand)
        .order_by(
            PricingDemand.date.desc()
        )
        .first()
    )

    if global_data is not None:

        average_base_price = float(
            global_data.average_base_price
            or product.current_price
        )

        average_units_sold = int(
            round(
                float(
                    global_data.average_units_sold
                    or 0
                )
            )
        )

        average_inventory = int(
            round(
                float(
                    global_data.average_inventory
                    or product.stock
                )
            )
        )

        average_demand_index = float(
            global_data.average_demand_index
            or 0
        )

        average_discount_pct = float(
            global_data.average_discount_pct
            or 0
        )

    else:

        average_base_price = float(
            product.current_price
        )

        average_units_sold = 0

        average_inventory = int(
            product.stock
        )

        average_demand_index = 0.0

        average_discount_pct = 0.0

    return (
        latest_global_data,
        average_base_price,
        average_units_sold,
        average_inventory,
        average_demand_index,
        average_discount_pct,
        True,
    )


# ============================================================
# PREDICT ONE PRICE CANDIDATE
# ============================================================

def predict_candidate(
    product,
    latest_category_data,
    average_base_price,
    average_units_sold,
    average_inventory,
    average_demand_index,
    current_price,
    candidate_price,
    db,
):

    input_data = build_model_input(
        product=product,
        latest_category_data=latest_category_data,
        average_base_price=average_base_price,
        average_units_sold=average_units_sold,
        average_inventory=average_inventory,
        average_demand_index=average_demand_index,
        current_price=current_price,
        candidate_price=candidate_price,
        db=db,
    )

    processed_data = preprocessor.transform(
        input_data
    )

    predicted_units = float(
        model.predict(
            processed_data
        )[0]
    )

    # ========================================================
    # SANITY CAP
    # ========================================================

    if (
        average_units_sold
        and average_units_sold > 0
    ):

        sanity_cap = max(
            average_units_sold * 5,
            50,
        )

    else:

        sanity_cap = 10000

    predicted_units = max(
        0.0,
        min(
            predicted_units,
            sanity_cap,
        ),
    )

    # ========================================================
    # REVENUE IS INR
    # ========================================================

    predicted_revenue = (
        candidate_price
        * predicted_units
    )

    print(
        f"[PRICE DEBUG] "
        f"Current=₹{current_price:.2f} | "
        f"Candidate=₹{candidate_price:.2f} | "
        f"Change="
        f"{((candidate_price-current_price)/current_price)*100:+.1f}% | "
        f"Units={predicted_units:.2f} | "
        f"Revenue=₹{predicted_revenue:.2f}"
    )

    return (
        predicted_units,
        predicted_revenue,
    )


# ============================================================
# PRICE POSITION INTELLIGENCE
# ============================================================

def get_price_position(
    current_price,
    market_features,
):

    position = float(
        market_features.get(
            "price_vs_category_avg",
            0.0,
        )
    )

    if position <= PRICE_POSITION_HEAVY_DISCOUNT_PCT:

        label = "HEAVILY DISCOUNTED"

    elif position <= PRICE_POSITION_MODERATE_DISCOUNT_PCT:

        label = "BELOW CATEGORY AVERAGE"

    elif position >= PRICE_POSITION_PREMIUM_PCT:

        label = "PREMIUM PRICED"

    else:

        label = "AROUND CATEGORY AVERAGE"

    return (
        position,
        label,
    )


# ============================================================
# BOUNDARY DETECTION
# ============================================================

def detect_boundary_pressure(
    candidates,
    current_price,
):

    if not candidates:

        return {
            "at_lower_boundary": False,
            "at_upper_boundary": False,
            "boundary_pressure": False,
            "upper_boundary_change": 0.0,
            "lower_boundary_change": 0.0,
            "best_change": 0.0,
        }

    best_candidate = max(
        candidates,
        key=lambda item:
            item.predicted_revenue,
    )

    lower_candidate = min(
        candidates,
        key=lambda item:
            item.candidate_price,
    )

    upper_candidate = max(
        candidates,
        key=lambda item:
            item.candidate_price,
    )

    best_change = (
        (
            best_candidate.candidate_price
            - current_price
        )
        / current_price
    ) * 100

    lower_change = (
        (
            lower_candidate.candidate_price
            - current_price
        )
        / current_price
    ) * 100

    upper_change = (
        (
            upper_candidate.candidate_price
            - current_price
        )
        / current_price
    ) * 100

    at_lower_boundary = (
        abs(
            best_candidate.candidate_price
            - lower_candidate.candidate_price
        )
        <= current_price
        * BOUNDARY_TOLERANCE_PCT
    )

    at_upper_boundary = (
        abs(
            best_candidate.candidate_price
            - upper_candidate.candidate_price
        )
        <= current_price
        * BOUNDARY_TOLERANCE_PCT
    )

    return {

        "at_lower_boundary":
            at_lower_boundary,

        "at_upper_boundary":
            at_upper_boundary,

        "boundary_pressure":
            (
                at_lower_boundary
                or at_upper_boundary
            ),

        "upper_boundary_change":
            upper_change,

        "lower_boundary_change":
            lower_change,

        "best_change":
            best_change,
    }


# ============================================================
# APPLY PRICE POSITION GUARD
# ============================================================

def apply_price_position_guard(
    candidates,
    current_price,
    average_demand_index,
    stock,
    market_features,
):

    if not candidates:

        return candidates

    price_position, price_position_label = (
        get_price_position(
            current_price,
            market_features,
        )
    )

    current_candidate = min(
        candidates,
        key=lambda item:
            abs(
                item.candidate_price
                - current_price
            ),
    )

    baseline_revenue = (
        current_candidate.predicted_revenue
    )

    is_high_demand = (
        average_demand_index >= 200
    )

    is_low_inventory = (
        stock <= 50
    )

    eligible_candidates = []

    for candidate in candidates:

        change_pct = (
            (
                candidate.candidate_price
                - current_price
            )
            / current_price
        ) * 100

        # ====================================================
        # HIGH DEMAND + LOW STOCK
        # ====================================================

        if (
            is_high_demand
            and is_low_inventory
            and change_pct
            < HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT
        ):

            continue

        # ====================================================
        # HEAVILY DISCOUNTED
        # ====================================================

        if (
            price_position
            <= PRICE_POSITION_HEAVY_DISCOUNT_PCT
            and change_pct
            < HEAVILY_DISCOUNTED_MAX_ADDITIONAL_DISCOUNT_PCT
        ):

            if baseline_revenue > 0:

                improvement = (
                    (
                        candidate.predicted_revenue
                        - baseline_revenue
                    )
                    / baseline_revenue
                ) * 100

            else:

                improvement = 0.0

            if (
                improvement
                < MIN_REVENUE_IMPROVEMENT_PCT * 2
            ):

                continue

        # ====================================================
        # PREMIUM PRICED
        # ====================================================

        if (
            price_position
            >= PRICE_POSITION_PREMIUM_PCT
            and change_pct > 0
        ):

            if baseline_revenue > 0:

                improvement = (
                    (
                        candidate.predicted_revenue
                        - baseline_revenue
                    )
                    / baseline_revenue
                ) * 100

            else:

                improvement = 0.0

            if (
                improvement
                < PREMIUM_PRICE_MIN_REVENUE_IMPROVEMENT_PCT
            ):

                continue

        eligible_candidates.append(
            candidate
        )

    if not eligible_candidates:

        eligible_candidates = [
            current_candidate
        ]

    return eligible_candidates


# ============================================================
# SELECT BEST CANDIDATE
# ============================================================

def select_best_candidate(
    candidates,
    current_price,
    average_demand_index,
    stock,
    market_features,
):

    if not candidates:

        return None

    current_candidate = min(
        candidates,
        key=lambda item:
            abs(
                item.candidate_price
                - current_price
            ),
    )

    baseline_revenue = (
        current_candidate.predicted_revenue
    )

    eligible_candidates = (
        apply_price_position_guard(
            candidates=candidates,
            current_price=current_price,
            average_demand_index=average_demand_index,
            stock=stock,
            market_features=market_features,
        )
    )

    best_candidate = max(
        eligible_candidates,
        key=lambda item:
            item.predicted_revenue,
    )

    if baseline_revenue > 0:

        improvement_pct = (
            (
                best_candidate.predicted_revenue
                - baseline_revenue
            )
            / baseline_revenue
        ) * 100

    else:

        improvement_pct = 0.0

    if (
        improvement_pct
        < MIN_REVENUE_IMPROVEMENT_PCT
    ):

        return current_candidate

    boundary_info = (
        detect_boundary_pressure(
            candidates=candidates,
            current_price=current_price,
        )
    )

    # ========================================================
    # UPPER BOUNDARY
    # ========================================================

    if boundary_info[
        "at_upper_boundary"
    ]:

        best_change = boundary_info[
            "best_change"
        ]

        if (
            best_change
            > BOUNDARY_MAX_CONFIDENT_INCREASE_PCT
        ):

            interior_candidates = [
                candidate
                for candidate in eligible_candidates
                if (
                    (
                        candidate.candidate_price
                        - current_price
                    )
                    / current_price
                ) * 100
                <= BOUNDARY_MAX_CONFIDENT_INCREASE_PCT
            ]

            if interior_candidates:

                interior_best = max(
                    interior_candidates,
                    key=lambda item:
                        item.predicted_revenue,
                )

                if baseline_revenue > 0:

                    interior_improvement = (
                        (
                            interior_best.predicted_revenue
                            - baseline_revenue
                        )
                        / baseline_revenue
                    ) * 100

                else:

                    interior_improvement = 0.0

                if (
                    interior_improvement
                    >= MIN_REVENUE_IMPROVEMENT_PCT
                ):

                    return interior_best

    # ========================================================
    # LOWER BOUNDARY
    # ========================================================

    if boundary_info[
        "at_lower_boundary"
    ]:

        price_position = float(
            market_features.get(
                "price_vs_category_avg",
                0.0,
            )
        )

        if (
            price_position
            <= PRICE_POSITION_HEAVY_DISCOUNT_PCT
        ):

            current_candidate = min(
                eligible_candidates,
                key=lambda item:
                    abs(
                        item.candidate_price
                        - current_price
                    ),
            )

            return current_candidate

    return best_candidate


# ============================================================
# BUILD PRICING FACTORS
# ============================================================

def build_pricing_factors(
    product,
    average_demand_index,
    average_units_sold,
    average_inventory,
    average_discount_pct,
    current_price,
    recommended_price,
    market_features=None,
):

    factors = []

    if market_features is None:

        market_features = {}

    # ========================================================
    # DEMAND
    # ========================================================

    if average_demand_index >= 200:

        factors.append(
            PricingFactor(
                factor="Demand",
                value=f"{average_demand_index:.2f}",
                impact=(
                    "High demand supports stronger pricing power."
                ),
            )
        )

    elif average_demand_index >= 100:

        factors.append(
            PricingFactor(
                factor="Demand",
                value=f"{average_demand_index:.2f}",
                impact=(
                    "Moderate demand supports current pricing."
                ),
            )
        )

    else:

        factors.append(
            PricingFactor(
                factor="Demand",
                value=f"{average_demand_index:.2f}",
                impact=(
                    "Lower demand favors competitive pricing."
                ),
            )
        )

    # ========================================================
    # INVENTORY
    # ========================================================

    factors.append(
        PricingFactor(
            factor="Inventory",
            value=str(
                int(product.stock)
            ),
            impact=(
                "Healthy inventory."
                if product.stock > 150
                else "Moderate inventory."
                if product.stock > 50
                else "Limited inventory."
            ),
        )
    )

    # ========================================================
    # SALES
    # ========================================================

    factors.append(
        PricingFactor(
            factor="Average Units Sold",
            value=str(
                average_units_sold
            ),
            impact=(
                "Strong sales."
                if average_units_sold >= 500
                else "Moderate sales."
                if average_units_sold >= 200
                else "Lower sales."
            ),
        )
    )

    # ========================================================
    # DISCOUNT
    # ========================================================

    factors.append(
        PricingFactor(
            factor="Historical Discount",
            value=f"{average_discount_pct:.2f}%",
            impact=(
                "Heavy discounting observed."
                if average_discount_pct > 10
                else "Limited discounting."
            ),
        )
    )

    # ========================================================
    # PRICE POSITION
    # ========================================================

    price_position = float(
        market_features.get(
            "price_vs_category_avg",
            0.0,
        )
    )

    if price_position <= -15:

        position_text = (
            "Product is already significantly below "
            "the historical category price."
        )

    elif price_position <= -5:

        position_text = (
            "Product is priced below the historical "
            "category average."
        )

    elif price_position >= 15:

        position_text = (
            "Product is already priced at a premium "
            "to the historical category average."
        )

    else:

        position_text = (
            "Product price is around the historical "
            "category range."
        )

    factors.append(
        PricingFactor(
            factor="Price Position",
            value=f"{price_position:+.2f}% vs category average",
            impact=position_text,
        )
    )

    # ========================================================
    # DEMAND MOMENTUM
    # ========================================================

    demand_momentum = float(
        market_features.get(
            "demand_momentum",
            0.0,
        )
    )

    if demand_momentum > 5:

        momentum_text = (
            "Recent demand is strengthening."
        )

    elif demand_momentum < -5:

        momentum_text = (
            "Recent demand is weakening."
        )

    else:

        momentum_text = (
            "Recent demand is relatively stable."
        )

    factors.append(
        PricingFactor(
            factor="Demand Momentum",
            value=f"{demand_momentum:+.2f}%",
            impact=momentum_text,
        )
    )

    # ========================================================
    # RECOMMENDED CHANGE
    # ========================================================

    change = (
        (
            recommended_price
            - current_price
        )
        / current_price
    ) * 100

    factors.append(
        PricingFactor(
            factor="Recommended Price Change",
            value=f"{change:+.2f}%",
            impact=(
                "Increase price"
                if change > 0
                else "Decrease price"
                if change < 0
                else "Maintain price"
            ),
        )
    )

    return factors


# ============================================================
# PRICE OPTIMIZATION ENDPOINT
# ============================================================

@router.get(
    "/optimize/{product_id}",
    response_model=PriceOptimizationResponse,
)
def optimize_product_price(
    product_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    if model is None or preprocessor is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Price response model is not available."
            ),
        )

    try:

        # ====================================================
        # 1. GET PRODUCT
        # ====================================================

        product = (
            db.query(Product)
            .filter(
                Product.id == product_id
            )
            .first()
        )

        if product is None:

            raise HTTPException(
                status_code=404,
                detail="Product not found.",
            )

        # ====================================================
        # 2. BUSINESS SIGNALS
        # ====================================================

        (
            latest_category_data,
            average_base_price,
            average_units_sold,
            average_inventory,
            average_demand_index,
            average_discount_pct,
            used_global_fallback,
        ) = get_category_signals(
            product,
            db,
        )

        # ====================================================
        # 3. CURRENT PRICE
        # ====================================================

        current_price = float(
            product.current_price
        )

        if current_price <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Product current price must be greater than zero."
                ),
            )

        # ====================================================
        # 4. MARKET FEATURES
        # ====================================================

        market_features = (
            get_historical_market_features(
                product=product,
                db=db,
                current_price=current_price,
            )
        )

        price_position, price_position_label = (
            get_price_position(
                current_price,
                market_features,
            )
        )

        # ====================================================
        # 5. CANDIDATES
        # ====================================================

        candidate_percentages = list(
            range(
                CANDIDATE_MIN_PCT,
                CANDIDATE_MAX_PCT + 1,
                CANDIDATE_STEP_PCT,
            )
        )

        candidate_prices = [

            round(
                current_price
                * (
                    1
                    + percentage / 100
                ),
                2,
            )

            for percentage
            in candidate_percentages
        ]

        candidate_prices = list(
            dict.fromkeys(
                candidate_prices
            )
        )

        # ====================================================
        # 6. PREDICT CANDIDATES
        # ====================================================

        candidates = []

        for candidate_price in candidate_prices:

            (
                predicted_units,
                predicted_revenue,
            ) = predict_candidate(

                product=product,

                latest_category_data=
                    latest_category_data,

                average_base_price=
                    average_base_price,

                average_units_sold=
                    average_units_sold,

                average_inventory=
                    average_inventory,

                average_demand_index=
                    average_demand_index,

                current_price=
                    current_price,

                candidate_price=
                    candidate_price,

                db=db,
            )

            candidates.append(
                PriceCandidate(

                    candidate_price=
                        round(
                            candidate_price,
                            2,
                        ),

                    predicted_units_sold=
                        round(
                            predicted_units,
                            2,
                        ),

                    predicted_revenue=
                        round(
                            predicted_revenue,
                            2,
                        ),
                )
            )

        # ====================================================
        # 7. SELECT BEST CANDIDATE
        # ====================================================

        best_candidate = (
            select_best_candidate(
                candidates=candidates,
                current_price=current_price,
                average_demand_index=
                    average_demand_index,
                stock=product.stock,
                market_features=
                    market_features,
            )
        )

        if best_candidate is None:

            raise HTTPException(
                status_code=500,
                detail=(
                    "Unable to determine a valid price candidate."
                ),
            )

        recommended_price = (
            best_candidate.candidate_price
        )

        expected_units = (
            best_candidate.predicted_units_sold
        )

        expected_revenue = (
            best_candidate.predicted_revenue
        )

        # ====================================================
        # 8. CURRENT PRICE BASELINE
        # ====================================================

        current_candidate = min(
            candidates,
            key=lambda item:
                abs(
                    item.candidate_price
                    - current_price
                ),
        )

        current_estimated_revenue = (
            current_candidate.predicted_revenue
        )

        current_estimated_units = (
            current_candidate.predicted_units_sold
        )

        # ====================================================
        # 9. PRICE CHANGE
        # ====================================================

        price_change_percentage = (
            (
                recommended_price
                - current_price
            )
            / current_price
        ) * 100

        # ====================================================
        # 10. REVENUE CHANGE
        # ====================================================

        if current_estimated_revenue > 0:

            revenue_change_percentage = (
                (
                    expected_revenue
                    - current_estimated_revenue
                )
                / current_estimated_revenue
            ) * 100

        else:

            revenue_change_percentage = 0.0

        # ====================================================
        # 11. RECOMMENDATION
        # ====================================================

        if price_change_percentage >= 2:

            recommendation = (
                "INCREASE PRICE"
            )

        elif price_change_percentage <= -2:

            recommendation = (
                "DECREASE PRICE"
            )

        else:

            recommendation = (
                "MAINTAIN PRICE"
            )

        # ====================================================
        # 12. BOUNDARY INFORMATION
        # ====================================================

        boundary_info = (
            detect_boundary_pressure(
                candidates=candidates,
                current_price=current_price,
            )
        )

        # ====================================================
        # 13. EXPLANATION
        # ====================================================

        if used_global_fallback:

            signal_text = (
                "Because this product category was not "
                "present in the historical dataset, the "
                "model used overall historical market "
                "signals as a fallback."
            )

        else:

            signal_text = (
                "The model used historical signals from "
                "this product category."
            )

        magnitude = abs(
            price_change_percentage
        )

        if magnitude < 5:

            magnitude_text = "slight"

        elif magnitude < 10:

            magnitude_text = "moderate"

        else:

            magnitude_text = "significant"

        range_text = (
            f"{CANDIDATE_MIN_PCT}% to "
            f"+{CANDIDATE_MAX_PCT}%"
        )

        boundary_text = ""

        if boundary_info[
            "at_upper_boundary"
        ]:

            boundary_text = (
                " The model initially showed upward "
                "boundary pressure, so price-position "
                "intelligence was applied before selecting "
                "the final recommendation."
            )

        elif boundary_info[
            "at_lower_boundary"
        ]:

            boundary_text = (
                " The model initially showed downward "
                "boundary pressure, so the product's "
                "existing market price position was checked "
                "before selecting the final recommendation."
            )

        if price_change_percentage > 0:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"{range_text}. "
                f"{signal_text} "
                f"The product is currently "
                f"{price_position_label.lower()}, at "
                f"{price_position:+.2f}% relative to its "
                f"historical category price. "
                f"The selected price is ₹{recommended_price:.2f}, "
                f"a {magnitude_text} "
                f"{price_change_percentage:.2f}% increase. "
                f"The model predicts {expected_units:.2f} units "
                f"sold at this price compared with approximately "
                f"{current_estimated_units:.2f} units at the "
                f"current price."
                f"{boundary_text}"
            )

        elif price_change_percentage < 0:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"{range_text}. "
                f"{signal_text} "
                f"The product is currently "
                f"{price_position_label.lower()}, at "
                f"{price_position:+.2f}% relative to its "
                f"historical category price. "
                f"The selected price is ₹{recommended_price:.2f}, "
                f"a {magnitude_text} "
                f"{abs(price_change_percentage):.2f}% decrease. "
                f"The lower price is expected to improve the "
                f"revenue-demand balance."
                f"{boundary_text}"
            )

        else:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"{range_text}. "
                f"{signal_text} "
                f"The product is currently "
                f"{price_position_label.lower()}, at "
                f"{price_position:+.2f}% relative to its "
                f"historical category price. "
                f"No candidate produced enough additional "
                f"predicted revenue to justify moving away "
                f"from the current price."
                f"{boundary_text}"
            )

        # ====================================================
        # 14. PRICING FACTORS
        # ====================================================

        pricing_factors = (
            build_pricing_factors(

                product=product,

                average_demand_index=
                    average_demand_index,

                average_units_sold=
                    average_units_sold,

                average_inventory=
                    average_inventory,

                average_discount_pct=
                    average_discount_pct,

                current_price=
                    current_price,

                recommended_price=
                    recommended_price,

                market_features=
                    market_features,
            )
        )

        # ====================================================
        # 15. DEBUG RESULT
        # ====================================================

        print()

        print(
            "============================================================"
        )

        print(
            "PRICE OPTIMIZATION RESULT"
        )

        print(
            "Currency scale: INR"
        )

        print(
            "Product:",
            product.name,
        )

        print(
            "Product ID:",
            product.id,
        )

        print(
            "Category:",
            product.category,
        )

        print(
            "Current price:",
            f"₹{current_price:,.2f}",
        )

        print(
            "Recommended price:",
            f"₹{recommended_price:,.2f}",
        )

        print(
            "Price change:",
            f"{price_change_percentage:.2f}%",
        )

        print(
            "Revenue change:",
            f"{revenue_change_percentage:.2f}%",
        )

        print(
            "Price position:",
            f"{price_position:+.2f}% "
            f"({price_position_label})",
        )

        print(
            "Demand momentum:",
            f"{market_features.get('demand_momentum', 0):+.2f}%",
        )

        print(
            "Boundary pressure:",
            boundary_info[
                "boundary_pressure"
            ],
        )

        print(
            "Recommendation:",
            recommendation,
        )

        print(
            "Global fallback used:",
            used_global_fallback,
        )

        print(
            "Customer monetary scale:",
            f"INR using {USD_TO_INR}x conversion",
        )

        print()

        print(
            "Candidate predictions:"
        )

        print(
            "------------------------------------------------------------"
        )

        for candidate in candidates:

            candidate_change = (
                (
                    candidate.candidate_price
                    - current_price
                )
                / current_price
            ) * 100

            marker = (
                "  <-- SELECTED"
                if (
                    candidate.candidate_price
                    == recommended_price
                )
                else ""
            )

            print(
                f"{candidate_change:+6.1f}%"
                f" | "
                f"₹{candidate.candidate_price:,.2f}"
                f" | "
                f"{candidate.predicted_units_sold:>7.2f} units"
                f" | "
                f"₹{candidate.predicted_revenue:,.2f}"
                f"{marker}"
            )

        print(
            "============================================================"
        )

        print()

        # ====================================================
        # 16. RETURN
        # ====================================================

        return PriceOptimizationResponse(

            product_id=product.id,

            product_name=product.name,

            category=product.category,

            current_price=round(
                current_price,
                2,
            ),

            recommended_price=round(
                recommended_price,
                2,
            ),

            expected_units_sold=round(
                expected_units,
                2,
            ),

            expected_revenue=round(
                expected_revenue,
                2,
            ),

            price_change_percentage=round(
                price_change_percentage,
                2,
            ),

            revenue_change_percentage=round(
                revenue_change_percentage,
                2,
            ),

            candidates=candidates,

            recommendation=recommendation,

            explanation=explanation,

            pricing_factors=pricing_factors,
        )

    except HTTPException:

        raise

    except Exception as error:

        print(
            "Price optimization error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate price optimization: "
                f"{str(error)}"
            ),
        )


# ============================================================
# PRODUCT PRICING ANALYSIS ENDPOINT
# ============================================================

@router.get(
    "/analyze/{product_id}",
    response_model=ProductPricingAnalysisResponse,
)
def analyze_product_pricing(
    product_id: int,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):

    if model is None or preprocessor is None:

        raise HTTPException(
            status_code=500,
            detail=(
                "Price response model is not available."
            ),
        )

    try:

        # ====================================================
        # 1. GET PRODUCT
        # ====================================================

        product = (
            db.query(Product)
            .filter(
                Product.id == product_id
            )
            .first()
        )

        if product is None:

            raise HTTPException(
                status_code=404,
                detail="Product not found.",
            )

        # ====================================================
        # 2. BUSINESS SIGNALS
        # ====================================================

        (
            latest_category_data,
            average_base_price,
            average_units_sold,
            average_inventory,
            average_demand_index,
            average_discount_pct,
            used_global_fallback,
        ) = get_category_signals(
            product,
            db,
        )

        # ====================================================
        # 3. CURRENT PRICE
        # ====================================================

        current_price = float(
            product.current_price
        )

        stock = int(
            product.stock
        )

        if current_price <= 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Product current price must be greater than zero."
                ),
            )

        # ====================================================
        # 4. MARKET FEATURES
        # ====================================================

        market_features = (
            get_historical_market_features(
                product=product,
                db=db,
                current_price=current_price,
            )
        )

        price_position, price_position_label = (
            get_price_position(
                current_price,
                market_features,
            )
        )

        # ====================================================
        # 5. GENERATE CANDIDATES
        # ====================================================

        candidate_percentages = list(
            range(
                CANDIDATE_MIN_PCT,
                CANDIDATE_MAX_PCT + 1,
                CANDIDATE_STEP_PCT,
            )
        )

        candidates = []

        for percentage in candidate_percentages:

            candidate_price = round(
                current_price
                * (
                    1
                    + percentage / 100
                ),
                2,
            )

            (
                predicted_units,
                predicted_revenue,
            ) = predict_candidate(

                product=product,

                latest_category_data=
                    latest_category_data,

                average_base_price=
                    average_base_price,

                average_units_sold=
                    average_units_sold,

                average_inventory=
                    average_inventory,

                average_demand_index=
                    average_demand_index,

                current_price=
                    current_price,

                candidate_price=
                    candidate_price,

                db=db,
            )

            candidates.append(
                {
                    "price":
                        candidate_price,

                    "percentage":
                        percentage,

                    "units":
                        predicted_units,

                    "revenue":
                        predicted_revenue,
                }
            )

        # ====================================================
        # 6. CURRENT CANDIDATE
        # ====================================================

        current_candidate_dict = min(
            candidates,
            key=lambda item:
                abs(
                    item["price"]
                    - current_price
                ),
        )

        baseline_revenue = (
            current_candidate_dict[
                "revenue"
            ]
        )

        # ====================================================
        # 7. APPLY PRICE POSITION GUARDS
        # ====================================================

        is_high_demand = (
            average_demand_index >= 200
        )

        is_low_inventory = (
            stock <= 50
        )

        eligible_candidates = []

        for item in candidates:

            change_pct = (
                (
                    item["price"]
                    - current_price
                )
                / current_price
            ) * 100

            if (
                is_high_demand
                and is_low_inventory
                and change_pct
                < HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT
            ):

                continue

            if (
                price_position
                <= PRICE_POSITION_HEAVY_DISCOUNT_PCT
                and change_pct
                < HEAVILY_DISCOUNTED_MAX_ADDITIONAL_DISCOUNT_PCT
            ):

                if baseline_revenue > 0:

                    improvement = (
                        (
                            item["revenue"]
                            - baseline_revenue
                        )
                        / baseline_revenue
                    ) * 100

                else:

                    improvement = 0.0

                if (
                    improvement
                    < MIN_REVENUE_IMPROVEMENT_PCT * 2
                ):

                    continue

            if (
                price_position
                >= PRICE_POSITION_PREMIUM_PCT
                and change_pct > 0
            ):

                if baseline_revenue > 0:

                    improvement = (
                        (
                            item["revenue"]
                            - baseline_revenue
                        )
                        / baseline_revenue
                    ) * 100

                else:

                    improvement = 0.0

                if (
                    improvement
                    < PREMIUM_PRICE_MIN_REVENUE_IMPROVEMENT_PCT
                ):

                    continue

            eligible_candidates.append(
                item
            )

        if not eligible_candidates:

            eligible_candidates = [
                current_candidate_dict
            ]

        # ====================================================
        # 8. REVENUE BEST
        # ====================================================

        revenue_best_candidate = max(
            eligible_candidates,
            key=lambda item:
                item["revenue"],
        )

        if baseline_revenue > 0:

            improvement_pct = (
                (
                    revenue_best_candidate[
                        "revenue"
                    ]
                    - baseline_revenue
                )
                / baseline_revenue
            ) * 100

        else:

            improvement_pct = 0.0

        if (
            improvement_pct
            < MIN_REVENUE_IMPROVEMENT_PCT
        ):

            best_candidate = (
                current_candidate_dict
            )

        else:

            best_candidate = (
                revenue_best_candidate
            )

        # ====================================================
        # 9. BOUNDARY DETECTION
        # ====================================================

        best_change = (
            best_candidate["percentage"]
        )

        upper_boundary = (
            CANDIDATE_MAX_PCT
        )

        lower_boundary = (
            CANDIDATE_MIN_PCT
        )

        if (
            best_change
            >= upper_boundary
        ):

            interior_candidates = [
                item
                for item in eligible_candidates
                if item["percentage"]
                <= BOUNDARY_MAX_CONFIDENT_INCREASE_PCT
            ]

            if interior_candidates:

                interior_best = max(
                    interior_candidates,
                    key=lambda item:
                        item["revenue"],
                )

                if baseline_revenue > 0:

                    interior_improvement = (
                        (
                            interior_best["revenue"]
                            - baseline_revenue
                        )
                        / baseline_revenue
                    ) * 100

                else:

                    interior_improvement = 0.0

                if (
                    interior_improvement
                    >= MIN_REVENUE_IMPROVEMENT_PCT
                ):

                    best_candidate = (
                        interior_best
                    )

        if (
            best_candidate["percentage"]
            <= lower_boundary
            and price_position
            <= PRICE_POSITION_HEAVY_DISCOUNT_PCT
        ):

            best_candidate = (
                current_candidate_dict
            )

        # ====================================================
        # 10. FINAL VALUES
        # ====================================================

        predicted_price = (
            best_candidate["price"]
        )

        predicted_units = (
            best_candidate["units"]
        )

        price_difference = (
            predicted_price
            - current_price
        )

        predicted_change_percentage = (
            price_difference
            / current_price
        ) * 100

        # ====================================================
        # 11. RECOMMENDATION
        # ====================================================

        if predicted_change_percentage >= 2:

            recommendation = (
                "INCREASE PRICE"
            )

        elif predicted_change_percentage <= -2:

            recommendation = (
                "DECREASE PRICE"
            )

        else:

            recommendation = (
                "MAINTAIN PRICE"
            )

        # ====================================================
        # 12. DEMAND LEVEL
        # ====================================================

        if average_demand_index >= 200:

            demand_level = "HIGH"

        elif average_demand_index >= 100:

            demand_level = "MODERATE"

        else:

            demand_level = "LOW"

        # ====================================================
        # 13. SALES VELOCITY
        # ====================================================

        if average_units_sold >= 500:

            sales_velocity = "STRONG"

        elif average_units_sold >= 200:

            sales_velocity = "MODERATE"

        else:

            sales_velocity = "LOW"

        # ====================================================
        # 14. INVENTORY STATUS
        # ====================================================

        if stock <= 0:

            inventory_status = (
                "OUT OF STOCK"
            )

        elif stock <= 50:

            inventory_status = "LIMITED"

        elif stock <= 150:

            inventory_status = "MODERATE"

        else:

            inventory_status = "HEALTHY"

        # ====================================================
        # 15. BUSINESS REASONS
        # ====================================================

        reasons = []

        if used_global_fallback:

            reasons.append(
                "This product category was not found in historical data, so overall historical market signals were used."
            )

        else:

            reasons.append(
                "Historical data from this product category was used for the pricing analysis."
            )

        # ====================================================
        # DEMAND
        # ====================================================

        if average_demand_index >= 200:

            reasons.append(
                "Strong demand is supporting the pricing decision."
            )

        elif average_demand_index >= 100:

            reasons.append(
                "Moderate demand is supporting the current pricing level."
            )

        else:

            reasons.append(
                "Lower demand may require a more competitive price."
            )

        # ====================================================
        # SALES
        # ====================================================

        if average_units_sold >= 500:

            reasons.append(
                "Strong sales velocity indicates healthy product demand."
            )

        elif average_units_sold >= 200:

            reasons.append(
                "Sales velocity is moderate under current market conditions."
            )

        else:

            reasons.append(
                "Sales velocity is relatively low."
            )

        # ====================================================
        # INVENTORY
        # ====================================================

        if stock <= 0:

            reasons.append(
                "The product is currently out of stock."
            )

        elif stock <= 50:

            reasons.append(
                "Current inventory is relatively limited."
            )

        elif stock <= 150:

            reasons.append(
                "Current inventory is at a moderate level."
            )

        else:

            reasons.append(
                "Healthy inventory provides flexibility in pricing."
            )

        # ====================================================
        # PRICE POSITION
        # ====================================================

        if price_position <= -15:

            reasons.append(
                f"The current price is {abs(price_position):.2f}% "
                "below the historical category average, indicating "
                "that the product is already heavily discounted."
            )

        elif price_position <= -5:

            reasons.append(
                f"The current price is {abs(price_position):.2f}% "
                "below the historical category average."
            )

        elif price_position >= 15:

            reasons.append(
                f"The current price is {price_position:.2f}% "
                "above the historical category average, indicating "
                "premium positioning."
            )

        else:

            reasons.append(
                "The current price is positioned close to the historical category range."
            )

        # ====================================================
        # DEMAND MOMENTUM
        # ====================================================

        demand_momentum = float(
            market_features.get(
                "demand_momentum",
                0.0,
            )
        )

        if demand_momentum > 5:

            reasons.append(
                f"Recent category demand is strengthening "
                f"({demand_momentum:+.2f}%), which supports "
                "maintaining pricing power."
            )

        elif demand_momentum < -5:

            reasons.append(
                f"Recent category demand is weakening "
                f"({demand_momentum:+.2f}%), increasing the "
                "importance of competitive pricing."
            )

        else:

            reasons.append(
                "Recent category demand is relatively stable."
            )

        # ====================================================
        # DISCOUNT
        # ====================================================

        if average_discount_pct > 10:

            reasons.append(
                "Historical discounting is affecting the pricing signal."
            )

        else:

            reasons.append(
                "Historical pricing patterns show limited discount pressure."
            )

        # ====================================================
        # FINAL RECOMMENDATION
        # ====================================================

        if predicted_change_percentage <= -2:

            reasons.append(
                f"The optimization engine recommends reducing "
                f"the price by "
                f"{abs(predicted_change_percentage):.2f}% "
                "based on the predicted revenue-demand balance."
            )

        elif predicted_change_percentage >= 2:

            reasons.append(
                f"The optimization engine recommends increasing "
                f"the price by "
                f"{predicted_change_percentage:.2f}% "
                "based on the predicted revenue-demand balance."
            )

        else:

            reasons.append(
                "The optimization engine indicates that the current price is close to the revenue-maximizing level."
            )

        # ====================================================
        # 16. RETURN
        # ====================================================

        return ProductPricingAnalysisResponse(

            product_id=product.id,

            product_name=product.name,

            category=product.category,

            current_price=round(
                current_price,
                2,
            ),

            stock=stock,

            base_price=round(
                average_base_price,
                2,
            ),

            demand_index=round(
                average_demand_index,
                2,
            ),

            units_sold=average_units_sold,

            inventory_level=stock,

            discount_pct=round(
                average_discount_pct,
                2,
            ),

            predicted_price=round(
                predicted_price,
                2,
            ),

            price_difference=round(
                price_difference,
                2,
            ),

            price_change_percentage=round(
                predicted_change_percentage,
                2,
            ),

            recommendation=recommendation,

            demand_level=demand_level,

            sales_velocity=sales_velocity,

            inventory_status=inventory_status,

            reasons=reasons,
        )

    except HTTPException:

        raise

    except Exception as error:

        print(
            "Product pricing analysis error:",
            error,
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to generate product pricing analysis: "
                f"{str(error)}"
            ),
        )