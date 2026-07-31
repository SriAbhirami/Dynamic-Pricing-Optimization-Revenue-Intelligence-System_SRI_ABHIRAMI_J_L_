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
# MODEL PATHS
# ============================================================

CURRENT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODEL_PATH = os.path.join(
    CURRENT_DIR,
    "..",
    "ml",
    "price_prediction",
    "xgb_price_model.joblib",
)

PREPROCESSOR_PATH = os.path.join(
    CURRENT_DIR,
    "..",
    "ml",
    "price_prediction",
    "price_preprocessor.joblib",
)


# ============================================================
# LOAD MODEL AND PREPROCESSOR
# ============================================================

try:

    model = joblib.load(MODEL_PATH)

    preprocessor = joblib.load(
        PREPROCESSOR_PATH
    )

    print(
        "Price adjustment model loaded successfully."
    )

except Exception as error:

    model = None
    preprocessor = None

    print(
        "Warning: Could not load price adjustment model:",
        error,
    )


# ============================================================
# RESPONSE SCHEMA
# ============================================================

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
# PRODUCT-SPECIFIC PRICING ANALYSIS
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

    # --------------------------------------------------------
    # CHECK MODEL
    # --------------------------------------------------------

    if model is None or preprocessor is None:

        raise HTTPException(
            status_code=500,
            detail="Price prediction model is not available.",
        )

    try:

        # ====================================================
        # 1. GET PRODUCT FROM ACTUAL PRODUCTS TABLE
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
        # 2. GET HISTORICAL DATA FOR PRODUCT CATEGORY
        # ====================================================

        category_data = (
            db.query(
                func.avg(
                    PricingDemand.base_price
                ).label("average_base_price"),

                func.avg(
                    PricingDemand.units_sold
                ).label("average_units_sold"),

                func.avg(
                    PricingDemand.inventory_level
                ).label("average_inventory"),

                func.avg(
                    PricingDemand.demand_index
                ).label("average_demand_index"),

                func.avg(
                    PricingDemand.discount_pct
                ).label("average_discount_pct"),
            )
            .filter(
                PricingDemand.category.ilike(
                    product.category
                )
            )
            .first()
        )


        # ====================================================
        # 3. GET LATEST CATEGORY RECORD
        # ====================================================

        latest_category_data = (
            db.query(PricingDemand)
            .filter(
                PricingDemand.category.ilike(
                    product.category
                )
            )
            .order_by(
                PricingDemand.date.desc()
            )
            .first()
        )


        # ====================================================
        # 4. CHECK HISTORICAL CATEGORY DATA
        # ====================================================

        if latest_category_data is None:

            raise HTTPException(
                status_code=404,
                detail=(
                    "No historical pricing and demand "
                    "information was found for the "
                    f"'{product.category}' category."
                ),
            )


        # ====================================================
        # 5. GET CATEGORY-BASED BUSINESS SIGNALS
        # ====================================================

        average_base_price = float(
            category_data.average_base_price
            or product.current_price
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


        # ====================================================
        # 6. USE ACTUAL PRODUCT PRICE + STOCK
        # ====================================================

        current_price = float(
            product.current_price
        )

        stock = int(
            product.stock
        )


        # ====================================================
        # 7. STOCKOUT FLAG
        # ====================================================

        stockout_flag = (
            1
            if stock <= 0
            else 0
        )


        # ====================================================
        # 8. DATE FEATURES
        # ====================================================

        today = pd.Timestamp.today()

        year = today.year
        month = today.month
        day = today.day
        day_of_week = today.weekday()


        # ====================================================
        # 9. MODEL INPUT
        # ====================================================
        #
        # IMPORTANT:
        #
        # The model now predicts price_change_pct.
        #
        # It does NOT directly predict a rupee price.
        #
        # ====================================================

        input_data = pd.DataFrame(
            [
                {
                    "base_price": average_base_price,

                    "units_sold": average_units_sold,

                    "inventory_level": stock,

                    "stockout_flag": stockout_flag,

                    "demand_index": average_demand_index,

                    "year": year,

                    "month": month,

                    "day": day,

                    "day_of_week": day_of_week,

                    "product_id": str(
                        product.id
                    ),

                    "category": product.category,

                    "brand": latest_category_data.brand,

                    "region": latest_category_data.region,

                    "channel": latest_category_data.channel,

                    "season": latest_category_data.season,

                    "promotion_type": (
                        latest_category_data.promotion_type
                    ),
                }
            ]
        )


        # ====================================================
        # 10. PREPROCESS
        # ====================================================

        processed_data = (
            preprocessor.transform(
                input_data
            )
        )


        # ====================================================
        # 11. PREDICT PRICE CHANGE %
        # ====================================================

        prediction = model.predict(
            processed_data
        )

        predicted_change_percentage = float(
            prediction[0]
        )


        # ====================================================
        # 12. SAFETY LIMIT
        # ====================================================
        #
        # The model was trained using price changes
        # between -50% and 0%.
        #
        # Keep the production prediction inside the
        # same safe range.
        #
        # ====================================================

        predicted_change_percentage = max(
            -50.0,
            min(
                0.0,
                predicted_change_percentage,
            ),
        )


        # ====================================================
        # 13. CALCULATE RECOMMENDED PRICE
        # ====================================================
        #
        # Example:
        #
        # Current Price = ₹150,000
        # Change = -10%
        #
        # Recommended Price =
        #
        # 150000 * (1 - 10 / 100)
        #
        # = ₹135,000
        #
        # ====================================================

        predicted_price = (
            current_price
            * (
                1
                + predicted_change_percentage / 100
            )
        )


        # ====================================================
        # 14. PRICE DIFFERENCE
        # ====================================================

        price_difference = (
            predicted_price
            - current_price
        )


        # ====================================================
        # 15. RECOMMENDATION
        # ====================================================
        #
        # Use percentage rather than a fixed ₹5 threshold.
        #
        # This makes sense for both:
        #
        # ₹300 product
        # ₹4,600 product
        # ₹150,000 product
        #
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
        # 16. DEMAND LEVEL
        # ====================================================

        if average_demand_index >= 200:

            demand_level = "HIGH"

        elif average_demand_index >= 100:

            demand_level = "MODERATE"

        else:

            demand_level = "LOW"


        # ====================================================
        # 17. SALES VELOCITY
        # ====================================================

        if average_units_sold >= 500:

            sales_velocity = "STRONG"

        elif average_units_sold >= 200:

            sales_velocity = "MODERATE"

        else:

            sales_velocity = "LOW"


        # ====================================================
        # 18. INVENTORY STATUS
        # ====================================================

        if stock <= 0:

            inventory_status = "OUT OF STOCK"

        elif stock <= 50:

            inventory_status = "LIMITED"

        elif stock <= 150:

            inventory_status = "MODERATE"

        else:

            inventory_status = "HEALTHY"


        # ====================================================
        # 19. GENERATE BUSINESS REASONS
        # ====================================================

        reasons = []


        # ----------------------------------------------------
        # Demand reason
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # Sales reason
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # Inventory reason
        # ----------------------------------------------------

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


        # ----------------------------------------------------
        # Discount reason
        # ----------------------------------------------------

        if average_discount_pct > 10:

            reasons.append(
                "Historical discounting is affecting the pricing signal."
            )

        else:

            reasons.append(
                "Historical pricing patterns show limited discount pressure."
            )


        # ----------------------------------------------------
        # Model recommendation reason
        # ----------------------------------------------------

        if predicted_change_percentage <= -2:

            reasons.append(
                f"The pricing model recommends a "
                f"{abs(predicted_change_percentage):.2f}% "
                "price reduction based on the available demand signals."
            )

        elif predicted_change_percentage >= 2:

            reasons.append(
                f"The pricing model recommends a "
                f"{predicted_change_percentage:.2f}% "
                "price increase based on the available demand signals."
            )

        else:

            reasons.append(
                "The pricing model indicates that the current price is close to the recommended level."
            )


        # ====================================================
        # 20. RETURN PRODUCT-SPECIFIC ANALYSIS
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


    # ========================================================
    # ERROR HANDLING
    # ========================================================

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