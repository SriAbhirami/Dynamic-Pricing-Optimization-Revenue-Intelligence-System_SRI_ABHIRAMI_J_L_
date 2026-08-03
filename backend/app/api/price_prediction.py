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
    #
    # Used when a category does not exist historically.
    # --------------------------------------------------------

    customer_global_defaults = {

        "customer_avg_age":
            float(
                customer_df["Age"]
                .mean()
            ),

        "customer_avg_unit_price":
            float(
                customer_df["Unit_Price"]
                .mean()
            ),

        "customer_avg_quantity":
            float(
                customer_df["Quantity"]
                .mean()
            ),

        "customer_avg_discount_amount":
            float(
                customer_df["Discount_Amount"]
                .mean()
            ),

        "customer_avg_order_value":
            float(
                customer_df["Total_Amount"]
                .mean()
            ),

        "customer_returning_rate":
            float(
                customer_df["Is_Returning_Customer"]
                .mean()
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
                customer_df["Order_ID"]
                .count()
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
    # PRICE RESPONSE FEATURES
    # ========================================================

    if average_base_price > 0:

        price_ratio = (
            candidate_price
            / average_base_price
        )

        effective_discount_pct = (
            1 - price_ratio
        ) * 100

    else:

        price_ratio = 1.0

        effective_discount_pct = 0.0

    # ========================================================
    # CUSTOMER BEHAVIOUR FEATURES
    # ========================================================

    customer_features = {}

    # --------------------------------------------------------
    # First try category-specific customer behaviour
    # --------------------------------------------------------

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
    #
    # If the product category is completely new,
    # use overall customer behaviour.
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
    # BUILD MODEL INPUT ROW
    # ========================================================

    input_row = {

        # ----------------------------------------------------
        # PRICE FEATURES
        # ----------------------------------------------------

        "current_price":
            candidate_price,

        "base_price":
            average_base_price,

        "price_ratio":
            price_ratio,

        "effective_discount_pct":
            effective_discount_pct,

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
        #
        # IMPORTANT:
        # Use the ACTUAL product ID.
        # Do NOT use latest_category_data.product_id.
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
    #
    # IMPORTANT FALLBACK:
    # Use overall historical averages from ALL products.
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
):

    input_data = build_model_input(

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

    processed_data = (
        preprocessor.transform(
            input_data
        )
    )

    predicted_units = float(
        model.predict(
            processed_data
        )[0]
    )

    predicted_units = max(
        0.0,
        predicted_units,
    )

    predicted_revenue = (
        candidate_price
        * predicted_units
    )

    return (
        predicted_units,
        predicted_revenue,
    )


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
        # 4. CANDIDATE PRICES
        # ====================================================

        candidate_percentages = list(
            range(
                -20,
                21,
                1,
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
        # 6. FIND HIGHEST REVENUE
        # ====================================================

        best_candidate = max(
            candidates,
            key=lambda item:
                item.predicted_revenue,
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

        if price_change_percentage > 0:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"-20% to +20%. "
                f"{signal_text} "
                f"The highest predicted revenue occurs at "
                f"₹{recommended_price:.2f}, representing a "
                f"{price_change_percentage:.2f}% price increase. "
                f"The model predicts {expected_units:.2f} units "
                f"sold at this price, compared with approximately "
                f"{current_estimated_units:.2f} units at the "
                f"current price."
            )

        elif price_change_percentage < 0:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"-20% to +20%. "
                f"{signal_text} "
                f"The highest predicted revenue occurs at "
                f"₹{recommended_price:.2f}, representing a "
                f"{abs(price_change_percentage):.2f}% price decrease. "
                f"The lower price is expected to support stronger "
                f"demand and maximize predicted revenue."
            )

        else:

            explanation = (
                f"The optimization engine evaluated "
                f"{len(candidates)} candidate prices from "
                f"-20% to +20%. "
                f"{signal_text} "
                f"The current price produced the highest "
                f"predicted revenue among all tested prices."
            )

        # ====================================================
        # 12. PRINT RESULT
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
        # 13. RETURN RESULT
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
        # 3. GENERATE CANDIDATES
        # ====================================================

        candidate_percentages = list(
            range(
                -20,
                21,
                1,
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
        # 4. BEST PRICE
        # ====================================================

        best_candidate = max(
            candidates,
            key=lambda item:
                item["revenue"],
        )

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