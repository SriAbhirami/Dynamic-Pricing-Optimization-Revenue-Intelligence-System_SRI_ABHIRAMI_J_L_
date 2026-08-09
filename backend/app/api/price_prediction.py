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
# CANDIDATE PRICE RANGE - DATA-GROUNDED
# ============================================================
#
# The training dataset (retail_pricing_demand_100k.csv) only
# ever contains price_change_pct values between -50% and 0%.
# In other words: current_price is NEVER above base_price
# anywhere in 172,800 historical rows. The model has literally
# never seen a price increase during training.
#
# XGBoost (and tree models generally) cannot extrapolate
# reliably outside the range of values they were trained on -
# predictions for out-of-range inputs collapse toward the
# value of whichever leaf the input falls into, which is why
# earlier versions of this system swung between recommending
# ~+20% (unconstrained extrapolation bias) and, after a fixed
# elasticity formula was hard-coded on top of the model,
# almost always -40% (see predict_candidate() below - that
# hard-coded formula has been removed).
#
# To keep recommendations inside a region the model can speak
# to with reasonable confidence, and to avoid the optimizer
# being forced toward an arbitrary boundary, the candidate
# range is:
#
#   -20%  ->  solidly inside the observed data (25th
#              percentile of historical price_change_pct is
#              exactly -20%), so the model has plenty of
#              real examples here.
#
#   +15%  ->  a modest excursion above the never-discounted
#              (0%) ceiling seen in training. The trained
#              model has a monotonic constraint forcing
#              demand to fall (not rise) as price rises, so
#              this direction is safe even beyond the training
#              range; +15% keeps the *magnitude* of that
#              extrapolation small instead of the previous
#              +/-40%, which pushed the model far outside
#              anything it had ever seen.
#
# This still lets the optimizer choose "increase", "maintain"
# or "decrease" - it is no longer forced to hit either edge.
# ============================================================

CANDIDATE_MIN_PCT = -20
CANDIDATE_MAX_PCT = 15
CANDIDATE_STEP_PCT = 1

# Minimum predicted-revenue improvement (relative to the
# current price) required before the optimizer will recommend
# moving away from the current price at all. This stops the
# optimizer from chasing noise-level model differences and
# lets "MAINTAIN PRICE" be a genuine, reachable outcome.
MIN_REVENUE_IMPROVEMENT_PCT = 1.0

# Business guard: how far the optimizer is allowed to discount
# when demand is strong and inventory is limited/out of stock.
# This is an explicit, explained business constraint (not a
# fake ML output) - see select_best_candidate().
HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT = -8


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

    # --------------------------------------------------------
    # Normalize category
    # --------------------------------------------------------

    customer_df["Product_Category"] = (
        customer_df["Product_Category"]
        .astype(str)
        .str.strip()
        .str.lower()
    )

    # --------------------------------------------------------
    # Clean returning customer flag
    # --------------------------------------------------------

    customer_df["Is_Returning_Customer"] = (
        pd.to_numeric(
            customer_df["Is_Returning_Customer"],
            errors="coerce",
        )
        .fillna(0)
        .astype(int)
    )

    # --------------------------------------------------------
    # Category-level customer behaviour
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # GLOBAL customer behaviour
    # --------------------------------------------------------

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
                customer_df["Is_Returning_Customer"].mean()
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
# BUILD MODEL INPUT - FIXED
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
):

    today = pd.Timestamp.today()

    category = (
        str(product.category)
        .strip()
        .lower()
    )

    if not category or category == "none":
        category = "unknown"

    # ========================================================
    # PRICE RESPONSE FEATURES - FIXED
    # ========================================================

    # Use the actual current price as reference
    reference_price = current_price

    if reference_price <= 0:
        reference_price = candidate_price

    price_ratio = candidate_price / reference_price

    effective_discount_pct = (
        (reference_price - candidate_price)
        / reference_price
    ) * 100

    # ========================================================
    # CUSTOMER BEHAVIOUR FEATURES
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
                    customer_row[
                        "customer_avg_age"
                    ],

                "customer_avg_unit_price":
                    customer_row[
                        "customer_avg_unit_price"
                    ],

                "customer_avg_quantity":
                    customer_row[
                        "customer_avg_quantity"
                    ],

                "customer_avg_discount_amount":
                    customer_row[
                        "customer_avg_discount_amount"
                    ],

                "customer_avg_order_value":
                    customer_row[
                        "customer_avg_order_value"
                    ],

                "customer_returning_rate":
                    customer_row[
                        "customer_returning_rate"
                    ],

                "customer_avg_session_duration":
                    customer_row[
                        "customer_avg_session_duration"
                    ],

                "customer_avg_pages_viewed":
                    customer_row[
                        "customer_avg_pages_viewed"
                    ],

                "customer_avg_delivery_time":
                    customer_row[
                        "customer_avg_delivery_time"
                    ],

                "customer_avg_rating":
                    customer_row[
                        "customer_avg_rating"
                    ],

                "customer_order_count":
                    customer_row[
                        "customer_order_count"
                    ],
            }

    # ========================================================
    # FALLBACK CUSTOMER VALUES
    # ========================================================

    if not customer_features:

        if customer_global_defaults:

            customer_features = (
                customer_global_defaults.copy()
            )

        else:

            customer_features = {

                "customer_avg_age": 35.0,

                "customer_avg_unit_price":
                    average_base_price,

                "customer_avg_quantity": 3.0,

                "customer_avg_discount_amount": 0.0,

                "customer_avg_order_value":
                    average_base_price * 3,

                "customer_returning_rate": 0.88,

                "customer_avg_session_duration": 14.5,

                "customer_avg_pages_viewed": 9.0,

                "customer_avg_delivery_time": 6.5,

                "customer_avg_rating": 3.9,

                "customer_order_count": 2000,
            }

    # ========================================================
    # CATEGORICAL FALLBACKS
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
    # BUILD MODEL INPUT ROW - FIXED current_price
    # ========================================================

    input_row = {

        # ----------------------------------------------------
        # PRICE FEATURES - FIXED
        # ----------------------------------------------------

        "current_price": current_price,  # FIXED: Use actual current price, not candidate
        "base_price": average_base_price,
        "price_ratio": price_ratio,
        "effective_discount_pct": effective_discount_pct,

        # ----------------------------------------------------
        # INVENTORY FEATURES
        # ----------------------------------------------------

        "inventory_level":
            int(product.stock),

        "stockout_flag":
            1 if product.stock <= 0 else 0,

        # ----------------------------------------------------
        # DATE FEATURES
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
        # CATEGORICAL FEATURES
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

    input_row.update(
        customer_features
    )

    return pd.DataFrame(
        [input_row]
    )


# ============================================================
# GET CATEGORY BUSINESS SIGNALS
# ============================================================

def get_category_signals(
    product,
    db,
):

    category = (
        str(product.category)
        .strip()
        .lower()
    )

    if not category or category == "none":
        category = "unknown"

    # ========================================================
    # 1. TRY CATEGORY-SPECIFIC HISTORICAL DATA
    # ========================================================

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

    # ========================================================
    # 2. DETERMINE WHETHER CATEGORY EXISTS
    # ========================================================

    category_exists = (
        latest_category_data is not None
        and category_data is not None
        and category_data.average_base_price is not None
    )

    # ========================================================
    # 3. CATEGORY EXISTS
    # ========================================================

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

        print(
            "Using category-specific business signals."
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
    # 4. CATEGORY NOT FOUND
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

    # ========================================================
    # 5. GLOBAL FALLBACK VALUES
    # ========================================================

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
# PREDICT ONE PRICE CANDIDATE - FIXED WITH ELASTICITY
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
    )

    # ========================================================
    # PREPROCESS
    # ========================================================

    processed_data = preprocessor.transform(input_data)

    # ========================================================
    # PREDICT
    # ========================================================
    #
    # IMPORTANT: We use the trained price-response model's own
    # prediction directly, for every candidate price. There is
    # no hard-coded elasticity formula overriding it.
    #
    # A previous version of this function replaced the model's
    # prediction with a fixed formula
    # (predicted_units = current_units * price_ratio**-1.5)
    # whenever the candidate price differed from the current
    # price. That formula makes predicted revenue
    # (price * predicted_units) a strictly decreasing function
    # of price for every product, with no dependence on the
    # product's actual category, demand, or inventory signals -
    # which is why the optimizer always ended up recommending
    # the lowest boundary of the candidate range (-40%). It has
    # been removed so the model's own (monotonic-constrained,
    # category- and customer-behaviour-aware) prediction drives
    # the recommendation instead.
    # ========================================================

    predicted_units = float(model.predict(processed_data)[0])

    # ========================================================
    # SANITY CAP - transparent business guard, not a fake
    # ML prediction.
    #
    # The training data's units_sold values are bounded (see
    # scripts/train_price_response.py print-outs). To protect
    # against a pathological prediction for an out-of-range
    # candidate, we cap predicted demand at a generous multiple
    # of this category's own historical average units sold.
    # This only ever clips extreme outliers; it does not shape
    # the demand curve itself.
    # ========================================================

    if average_units_sold and average_units_sold > 0:
        sanity_cap = max(average_units_sold * 5, 50)
    else:
        sanity_cap = 10000

    predicted_units = max(0.0, min(predicted_units, sanity_cap))

    predicted_revenue = candidate_price * predicted_units

    # ========================================================
    # DEBUG LOGGING
    # ========================================================

    print(
        f"[PRICE DEBUG] "
        f"Current={current_price:.2f} | "
        f"Candidate={candidate_price:.2f} | "
        f"Units={predicted_units:.2f} | "
        f"Revenue={predicted_revenue:.2f}"
    )

    return (
        predicted_units,
        predicted_revenue,
    )


# ============================================================
# SELECT BEST CANDIDATE - BUSINESS-AWARE OPTIMIZATION
# ============================================================
#
# Plain revenue-argmax over a wide candidate grid is what
# caused the system to repeatedly hit a boundary. This
# function keeps predicted revenue as the primary signal, but
# applies two transparent, explainable business constraints on
# top of it instead of trusting a single number blindly:
#
# 1. MINIMUM IMPROVEMENT THRESHOLD
#    A candidate other than the current price must beat the
#    current price's predicted revenue by more than
#    MIN_REVENUE_IMPROVEMENT_PCT before it is preferred. This
#    stops the optimizer from moving the price for a
#    fraction-of-a-percent difference that is well within the
#    model's own noise, and makes "MAINTAIN PRICE" a reachable,
#    genuine outcome rather than a coincidence.
#
# 2. HIGH-DEMAND / LOW-INVENTORY DISCOUNT GUARD
#    If a product has strong historical demand (demand_index)
#    AND limited/out-of-stock inventory, deep discounting is
#    poor business practice even if the model's revenue curve
#    (extrapolating from average, not scarcity-aware, training
#    data) suggests a large discount looks attractive. In that
#    situation, candidates below
#    HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT are excluded from
#    consideration. This mirrors the business rule requested:
#    "high demand + low inventory should generally not result
#    in a huge discount."
#
# No product ever has its price forced to a hardcoded value -
# this only narrows or reorders which of the model's own
# candidate predictions are eligible to win.
# ============================================================

def select_best_candidate(
    candidates,
    current_price,
    average_demand_index,
    stock,
):

    # --------------------------------------------------------
    # Locate the candidate closest to the current price, to use
    # as the revenue baseline.
    # --------------------------------------------------------

    current_candidate = min(
        candidates,
        key=lambda item: abs(item.candidate_price - current_price),
    )

    baseline_revenue = current_candidate.predicted_revenue

    # --------------------------------------------------------
    # Apply the high-demand / low-inventory discount guard.
    # --------------------------------------------------------

    is_high_demand = average_demand_index >= 200
    is_low_inventory = stock <= 50

    eligible_candidates = []

    for candidate in candidates:

        candidate_change_pct = (
            (candidate.candidate_price - current_price)
            / current_price
            * 100
        )

        if (
            is_high_demand
            and is_low_inventory
            and candidate_change_pct < HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT
        ):
            continue

        eligible_candidates.append(candidate)

    if not eligible_candidates:
        eligible_candidates = candidates

    # --------------------------------------------------------
    # Pick the eligible candidate with the highest predicted
    # revenue.
    # --------------------------------------------------------

    best_candidate = max(
        eligible_candidates,
        key=lambda item: item.predicted_revenue,
    )

    # --------------------------------------------------------
    # Apply the minimum-improvement threshold: only move away
    # from the current price if the improvement is decisive.
    # --------------------------------------------------------

    if baseline_revenue > 0:

        improvement_pct = (
            (best_candidate.predicted_revenue - baseline_revenue)
            / baseline_revenue
            * 100
        )

    else:

        improvement_pct = 0.0

    if improvement_pct < MIN_REVENUE_IMPROVEMENT_PCT:
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
):

    factors = []

    # Demand
    if average_demand_index >= 200:

        factors.append(
            PricingFactor(
                factor="Demand",
                value=f"{average_demand_index:.2f}",
                impact="High demand supports higher pricing."
            )
        )

    elif average_demand_index >= 100:

        factors.append(
            PricingFactor(
                factor="Demand",
                value=f"{average_demand_index:.2f}",
                impact="Moderate demand supports current pricing."
            )
        )

    else:

        factors.append(
            PricingFactor(
                factor="Demand",
                value=f"{average_demand_index:.2f}",
                impact="Lower demand favors competitive pricing."
            )
        )

    # Inventory
    factors.append(
        PricingFactor(
            factor="Inventory",
            value=str(average_inventory),
            impact=(
                "Healthy inventory."
                if average_inventory > 150
                else "Limited inventory."
            ),
        )
    )

    # Sales
    factors.append(
        PricingFactor(
            factor="Average Units Sold",
            value=str(average_units_sold),
            impact=(
                "Strong sales."
                if average_units_sold >= 500
                else "Moderate sales."
                if average_units_sold >= 200
                else "Lower sales."
            ),
        )
    )

    # Discount
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

    # Price recommendation
    change = (
        (recommended_price - current_price)
        / current_price
        * 100
    )

    factors.append(
        PricingFactor(
            factor="Recommended Price Change",
            value=f"{change:.2f}%",
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
# PRICE OPTIMIZATION ENDPOINT - FIXED WITH WIDER RANGE
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
        # 2. GET BUSINESS SIGNALS
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
        # 4. CANDIDATE PRICES - DATA-GROUNDED RANGE
        # ====================================================

        # See CANDIDATE_MIN_PCT / CANDIDATE_MAX_PCT definition
        # above for why this range was chosen instead of the
        # previous +/-40%.
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
                    1 + percentage / 100
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
        # 5. PREDICT EACH CANDIDATE
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
        # 6. SELECT BEST CANDIDATE (BUSINESS-AWARE)
        # ====================================================

        best_candidate = select_best_candidate(
            candidates=candidates,
            current_price=current_price,
            average_demand_index=average_demand_index,
            stock=product.stock,
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
        # 7. CURRENT PRICE REVENUE
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
        # 8. PRICE CHANGE
        # ====================================================

        price_change_percentage = (

            (
                recommended_price
                - current_price
            )
            / current_price
            * 100

        )

        # ====================================================
        # 9. REVENUE CHANGE
        # ====================================================

        if current_estimated_revenue > 0:

            revenue_change_percentage = (

                (
                    expected_revenue
                    - current_estimated_revenue
                )
                / current_estimated_revenue
                * 100

            )

        else:

            revenue_change_percentage = 0.0

        # ====================================================
        # 10. RECOMMENDATION
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
        # 11. EXPLANATION
        # ====================================================

        if used_global_fallback:

            signal_text = (
                "Because this product category was not "
                "present in the historical dataset, the "
                "model used overall historical pricing, "
                "demand, inventory, and customer behaviour "
                "signals as a fallback."
            )

        else:

            signal_text = (
                "The model used historical signals from "
                "this product category."
            )

        magnitude = abs(price_change_percentage)

        if magnitude < 5:
            magnitude_text = "slight"
        elif magnitude < 10:
            magnitude_text = "moderate"
        else:
            magnitude_text = "significant"

        range_text = (
            f"{CANDIDATE_MIN_PCT}% to +{CANDIDATE_MAX_PCT}%"
        )

        if price_change_percentage > 0:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"{range_text}. "
                f"{signal_text} "
                f"The highest predicted revenue among eligible "
                f"candidates occurs at ₹{recommended_price:.2f}, "
                f"a {magnitude_text} "
                f"{price_change_percentage:.2f}% price increase "
                f"that beats the current price's predicted revenue "
                f"by more than {MIN_REVENUE_IMPROVEMENT_PCT:.1f}%. "
                f"The model predicts {expected_units:.2f} units "
                f"sold at this price, compared with approximately "
                f"{current_estimated_units:.2f} units at the "
                f"current price."
            )

        elif price_change_percentage < 0:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"{range_text}. "
                f"{signal_text} "
                f"The highest predicted revenue among eligible "
                f"candidates occurs at ₹{recommended_price:.2f}, "
                f"a {magnitude_text} "
                f"{abs(price_change_percentage):.2f}% price decrease "
                f"that beats the current price's predicted revenue "
                f"by more than {MIN_REVENUE_IMPROVEMENT_PCT:.1f}%. "
                f"The lower price is expected to support stronger "
                f"demand and improve predicted revenue."
            )

        else:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"{range_text}. "
                f"{signal_text} "
                f"No candidate price improved predicted revenue "
                f"by more than {MIN_REVENUE_IMPROVEMENT_PCT:.1f}% "
                f"over the current price, so the current price is "
                f"kept."
            )

        # ====================================================
        # 12. PRICING FACTORS
        # ====================================================

        pricing_factors = build_pricing_factors(

            product=product,

            average_demand_index=average_demand_index,

            average_units_sold=average_units_sold,

            average_inventory=average_inventory,

            average_discount_pct=average_discount_pct,

            current_price=current_price,

            recommended_price=recommended_price,
        )

        # ====================================================
        # 13. PRINT RESULT
        # ====================================================

        print()
        print(
            "============================================================"
        )
        print(
            "PRICE OPTIMIZATION RESULT"
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
            current_price,
        )
        print(
            "Recommended price:",
            recommended_price,
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
            "Recommendation:",
            recommendation,
        )
        print(
            "Global fallback used:",
            used_global_fallback,
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
                * 100

            )

            marker = (
                "  <-- BEST"
                if candidate.candidate_price
                == recommended_price
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
        # 14. RETURN RESULT
        # ====================================================

        return PriceOptimizationResponse(

            product_id=product.id,

            product_name=product.name,

            category=product.category,

            current_price=round(current_price, 2),

            recommended_price=round(recommended_price, 2),

            expected_units_sold=round(expected_units, 2),

            expected_revenue=round(expected_revenue, 2),

            price_change_percentage=round(price_change_percentage, 2),

            revenue_change_percentage=round(revenue_change_percentage, 2),

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
        # 2. GET BUSINESS SIGNALS
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
        # 3. GENERATE CANDIDATES - DATA-GROUNDED RANGE
        # ====================================================

        # See CANDIDATE_MIN_PCT / CANDIDATE_MAX_PCT definition
        # near the top of this file for why this range was
        # chosen instead of the previous +/-40%.
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
                    1 + percentage / 100
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
            )

            candidates.append(
                {
                    "price": candidate_price,
                    "percentage": percentage,
                    "units": predicted_units,
                    "revenue": predicted_revenue,
                }
            )

        # ====================================================
        # 4. BEST PRICE (BUSINESS-AWARE)
        # ====================================================
        #
        # Same two guards as select_best_candidate() above,
        # applied here to the dict-based candidate list used
        # by this endpoint:
        #   1. High-demand + low-inventory discount guard
        #   2. Minimum revenue-improvement threshold
        # ====================================================

        current_candidate_dict = min(
            candidates,
            key=lambda item: abs(item["price"] - current_price),
        )

        baseline_revenue = current_candidate_dict["revenue"]

        is_high_demand = average_demand_index >= 200
        is_low_inventory = stock <= 50

        eligible_candidates = [
            item
            for item in candidates
            if not (
                is_high_demand
                and is_low_inventory
                and item["percentage"] < HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT
            )
        ]

        if not eligible_candidates:
            eligible_candidates = candidates

        revenue_best_candidate = max(
            eligible_candidates,
            key=lambda item:
                item["revenue"],
        )

        if baseline_revenue > 0:

            improvement_pct = (
                (revenue_best_candidate["revenue"] - baseline_revenue)
                / baseline_revenue
                * 100
            )

        else:

            improvement_pct = 0.0

        if improvement_pct < MIN_REVENUE_IMPROVEMENT_PCT:
            best_candidate = current_candidate_dict
        else:
            best_candidate = revenue_best_candidate

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
            * 100

        )

        # ====================================================
        # 5. RECOMMENDATION
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
        # 6. DEMAND LEVEL
        # ====================================================

        if average_demand_index >= 200:

            demand_level = "HIGH"

        elif average_demand_index >= 100:

            demand_level = "MODERATE"

        else:

            demand_level = "LOW"

        # ====================================================
        # 7. SALES VELOCITY
        # ====================================================

        if average_units_sold >= 500:

            sales_velocity = "STRONG"

        elif average_units_sold >= 200:

            sales_velocity = "MODERATE"

        else:

            sales_velocity = "LOW"

        # ====================================================
        # 8. INVENTORY STATUS
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
        # 9. BUSINESS REASONS
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

        if average_discount_pct > 10:

            reasons.append(
                "Historical discounting is affecting the pricing signal."
            )

        else:

            reasons.append(
                "Historical pricing patterns show limited discount pressure."
            )

        if predicted_change_percentage <= -2:

            reasons.append(
                f"The optimization engine recommends reducing "
                f"the price by "
                f"{abs(predicted_change_percentage):.2f}% "
                "to maximize predicted revenue."
            )

        elif predicted_change_percentage >= 2:

            reasons.append(
                f"The optimization engine recommends increasing "
                f"the price by "
                f"{predicted_change_percentage:.2f}% "
                "to maximize predicted revenue."
            )

        else:

            reasons.append(
                "The optimization engine indicates that the current price is close to the revenue-maximizing level."
            )

        # ====================================================
        # 10. RETURN
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