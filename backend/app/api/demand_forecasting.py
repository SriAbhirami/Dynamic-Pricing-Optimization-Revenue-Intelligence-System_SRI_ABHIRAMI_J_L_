from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from sqlalchemy.orm import Session
from sqlalchemy import func, extract

from pathlib import Path
import json

from app.ml.demand_forecasting.predict import predict_demand

from app.database.database import get_db

from app.models.products import Product
from app.models.pricing_demand import PricingDemand
from app.models.historical_sales import HistoricalSales
from app.models.seasonal_sales import SeasonalSales


router = APIRouter(
    prefix="/demand-forecast",
    tags=["Demand Forecasting"]
)


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

FORECAST_SUMMARY_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "forecasts"
    / "forecast_summary.json"
)


# ============================================================
# MONTH NAMES
# ============================================================

MONTH_NAMES = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "August",
    9: "September",
    10: "October",
    11: "November",
    12: "December"
}


# ============================================================
# CATEGORY MAPPING
# ============================================================

# The application product categories do not have to exactly
# match the categories used by the historical dataset.
#
# Example:
#
# Application:
#     Shoes
#
# Historical dataset:
#     Fashion
#
# Therefore:
#     Shoes -> Fashion
#
# This mapping is intentionally kept in the backend so that
# the frontend only deals with the application's products.

CATEGORY_MAPPING = {

    # --------------------------------------------------------
    # FASHION
    # --------------------------------------------------------

    "fashion": "Fashion",

    "clothing": "Fashion",

    "apparel": "Fashion",

    "shoes": "Fashion",

    "footwear": "Fashion",

    "sneakers": "Fashion",

    "bags": "Fashion",

    "accessories": "Fashion",

    # --------------------------------------------------------
    # ELECTRONICS
    # --------------------------------------------------------

    "electronics": "Electronics",

    "mobile": "Electronics",

    "mobiles": "Electronics",

    "smartphone": "Electronics",

    "smartphones": "Electronics",

    "phone": "Electronics",

    "phones": "Electronics",

    "laptop": "Electronics",

    "laptops": "Electronics",

    "computer": "Electronics",

    "computers": "Electronics",

    "tablet": "Electronics",

    "tablets": "Electronics",

    "gadgets": "Electronics",

    # --------------------------------------------------------
    # BEAUTY
    # --------------------------------------------------------

    "beauty": "Beauty",

    "cosmetics": "Beauty",

    "makeup": "Beauty",

    "skincare": "Beauty",

    "personal care": "Beauty",

    # --------------------------------------------------------
    # GROCERY
    # --------------------------------------------------------

    "grocery": "Grocery",

    "groceries": "Grocery",

    "food": "Grocery",

    "foods": "Grocery",

    "beverages": "Grocery",

    # --------------------------------------------------------
    # HOME
    # --------------------------------------------------------

    "home": "Home",

    "home appliances": "Home",

    "appliances": "Home",

    "furniture": "Home",

    "kitchen": "Home",

    "household": "Home",

    # --------------------------------------------------------
    # SPORTS
    # --------------------------------------------------------

    "sports": "Sports",

    "sport": "Sports",

    "fitness": "Sports",

    "gym": "Sports",

    "outdoor": "Sports",

    # --------------------------------------------------------
    # TOYS
    # --------------------------------------------------------

    "toys": "Toys",

    "toy": "Toys",

    "games": "Toys",

    "gaming": "Toys",
}


# ============================================================
# CATEGORY RESOLVER
# ============================================================

def resolve_historical_category(
    application_category: str
) -> str:

    if not application_category:
        return ""

    normalized = (
        str(application_category)
        .strip()
        .lower()
    )

    # Exact mapping
    if normalized in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[normalized]

    # Partial keyword matching
    for key, mapped_category in CATEGORY_MAPPING.items():

        if key in normalized:
            return mapped_category

    # If no mapping exists, preserve original category.
    return str(application_category).strip()


# ============================================================
# REQUEST MODEL
# ============================================================

class DemandForecastRequest(BaseModel):

    base_price: float
    current_price: float
    price_change_pct: float
    discount_pct: float
    inventory_level: float

    year: int
    month: int
    day: int
    day_of_week: int

    sales_rolling_3: float
    sales_rolling_7: float
    sales_rolling_14: float

    product_id: str
    category: str
    brand: str
    region: str
    channel: str
    season: str
    promotion_type: str
    stockout_flag: int


# ============================================================
# SINGLE PREDICTION RESPONSE
# ============================================================

class DemandForecastResponse(BaseModel):

    predicted_demand_index: float


# ============================================================
# FORECAST HORIZON RESPONSE
# ============================================================

class ForecastHorizon(BaseModel):

    forecast_horizon: str
    forecast_start: str
    forecast_end: str
    forecast_days: int

    production_model: str

    total_predicted_demand: float
    average_daily_demand: float

    maximum_daily_demand: float
    minimum_daily_demand: float

    total_predicted_revenue: float

    demand_trend: str
    trend_change_percent: float

    confidence_score: float


# ============================================================
# COMPLETE FORECAST RESPONSE
# ============================================================

class DemandForecastSummaryResponse(BaseModel):

    seven_days: ForecastHorizon
    fourteen_days: ForecastHorizon
    thirty_days: ForecastHorizon

    three_months: ForecastHorizon
    six_months: ForecastHorizon

    twelve_months: ForecastHorizon


# ============================================================
# SEASONAL DATA POINT
# ============================================================

class SeasonalDataPoint(BaseModel):

    month: str
    month_number: int
    demand: float


# ============================================================
# SEASONAL RESPONSE
# ============================================================

class SeasonalTrendResponse(BaseModel):

    product_id: str
    product_name: str

    application_category: str
    category: str

    seasonal_data: list[SeasonalDataPoint]

    peak_month: str
    peak_demand: float

    lowest_month: str
    lowest_demand: float

    seasonality_strength: str
    seasonality_change_pct: float

    historical_months_available: int
    estimated_months: int

    historical_years: list[int]

    data_source: str


# ============================================================
# SINGLE DEMAND PREDICTION
# ============================================================

@router.post(
    "/predict",
    response_model=DemandForecastResponse
)
def predict_demand_index(
    data: DemandForecastRequest
):

    try:

        prediction = predict_demand(
            data.model_dump()
        )

        return {
            "predicted_demand_index": round(
                float(prediction),
                2
            )
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                f"Demand prediction failed: {str(e)}"
            )
        )


# ============================================================
# PRODUCTION FORECAST SUMMARY
# ============================================================

@router.get(
    "/forecast",
    response_model=DemandForecastSummaryResponse
)
def get_demand_forecast():

    try:

        if not FORECAST_SUMMARY_PATH.exists():

            raise HTTPException(
                status_code=404,
                detail=(
                    "Forecast summary not found. "
                    "Run scripts/demand_forecaster.py first."
                )
            )

        with open(
            FORECAST_SUMMARY_PATH,
            "r",
            encoding="utf-8"
        ) as file:

            forecast_data = json.load(file)

        required_horizons = [
            "7_days",
            "14_days",
            "30_days",
            "3_months",
            "6_months",
            "12_months"
        ]

        missing_horizons = [
            horizon
            for horizon in required_horizons
            if horizon not in forecast_data
        ]

        if missing_horizons:

            raise HTTPException(
                status_code=500,
                detail=(
                    "Forecast summary is incomplete. "
                    f"Missing horizons: {missing_horizons}"
                )
            )

        return {

            "seven_days":
                forecast_data["7_days"],

            "fourteen_days":
                forecast_data["14_days"],

            "thirty_days":
                forecast_data["30_days"],

            "three_months":
                forecast_data["3_months"],

            "six_months":
                forecast_data["6_months"],

            "twelve_months":
                forecast_data["12_months"]

        }

    except HTTPException:
        raise

    except json.JSONDecodeError as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Forecast summary JSON is invalid: "
                f"{str(e)}"
            )
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Failed to load demand forecast summary: "
                f"{str(e)}"
            )
        )


# ============================================================
# SEASONAL TREND
#
# IMPORTANT:
#
# Frontend sends:
#
#     /seasonal/{application_product_id}
#
# Example:
#
#     /seasonal/5
#
# Backend then:
#
#     products.id = 5
#             ↓
#     category = Shoes
#             ↓
#     historical category = Fashion
#             ↓
#     seasonal_sales.category = Fashion
#
# ============================================================

@router.get(
    "/seasonal/{product_id}",
    response_model=SeasonalTrendResponse
)
def get_seasonal_trend(
    product_id: str,
    db: Session = Depends(get_db)
):

    try:

        # ========================================================
        # 1. FIND APPLICATION PRODUCT
        # ========================================================

        try:

            application_product_id = int(
                str(product_id).strip()
            )

        except ValueError:

            raise HTTPException(
                status_code=400,
                detail="Invalid application product ID."
            )


        product = (

            db.query(Product)

            .filter(
                Product.id ==
                application_product_id
            )

            .first()

        )


        if not product:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Application product "
                    f"{product_id} was not found."
                )
            )


        # ========================================================
        # 2. GET APPLICATION CATEGORY
        # ========================================================

        application_category = (
            str(product.category or "")
            .strip()
        )


        if not application_category:

            raise HTTPException(
                status_code=400,
                detail=(
                    f"Product '{product.name}' "
                    "does not have a category."
                )
            )


        # ========================================================
        # 3. MAP APPLICATION CATEGORY
        # ========================================================

        historical_category = (
            resolve_historical_category(
                application_category
            )
        )


        if not historical_category:

            raise HTTPException(
                status_code=404,
                detail=(
                    "Unable to map the product category "
                    "to the historical seasonal dataset."
                )
            )


        # ========================================================
        # 4. VERIFY CATEGORY EXISTS
        # ========================================================

        category_exists = (

            db.query(
                SeasonalSales.category
            )

            .filter(
                func.lower(
                    SeasonalSales.category
                )
                ==
                historical_category.lower()
            )

            .first()

        )


        if not category_exists:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No seasonal history is available "
                    f"for category '{historical_category}'."
                )
            )


        # ========================================================
        # 5. DETERMINE HISTORICAL YEARS
        # ========================================================

        historical_year_rows = (

            db.query(

                extract(
                    "year",
                    SeasonalSales.order_date
                ).label("year")

            )

            .filter(

                func.lower(
                    SeasonalSales.category
                )
                ==
                historical_category.lower()

            )

            .filter(
                SeasonalSales.order_date.isnot(None)
            )

            .all()

        )


        historical_years = sorted({

            int(row.year)

            for row in historical_year_rows

            if row.year is not None

        })


        # ========================================================
        # 6. MONTHLY SALES
        #
        # We calculate:
        #
        #     total quantity per month per year
        #
        # and then average the yearly monthly values.
        #
        # This prevents a partial year from dominating the graph.
        # ========================================================

        monthly_yearly_rows = (

            db.query(

                extract(
                    "year",
                    SeasonalSales.order_date
                ).label("year"),

                extract(
                    "month",
                    SeasonalSales.order_date
                ).label("month_number"),

                func.sum(
                    SeasonalSales.quantity
                ).label("total_quantity")

            )

            .filter(

                func.lower(
                    SeasonalSales.category
                )
                ==
                historical_category.lower()

            )

            .filter(
                SeasonalSales.order_date.isnot(None)
            )

            .filter(
                SeasonalSales.quantity.isnot(None)
            )

            .group_by(

                extract(
                    "year",
                    SeasonalSales.order_date
                ),

                extract(
                    "month",
                    SeasonalSales.order_date
                )

            )

            .order_by(

                extract(
                    "year",
                    SeasonalSales.order_date
                ),

                extract(
                    "month",
                    SeasonalSales.order_date
                )

            )

            .all()

        )


        if not monthly_yearly_rows:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"No seasonal records found "
                    f"for category '{historical_category}'."
                )
            )


        # ========================================================
        # 7. BUILD YEAR -> MONTH DATA
        # ========================================================

        yearly_monthly_sales = {}


        for row in monthly_yearly_rows:

            year = int(row.year)

            month_number = int(
                row.month_number
            )

            quantity = float(
                row.total_quantity or 0
            )

            if year not in yearly_monthly_sales:

                yearly_monthly_sales[year] = {}

            yearly_monthly_sales[year][
                month_number
            ] = quantity


        # ========================================================
        # 8. AVERAGE EACH MONTH ACROSS AVAILABLE YEARS
        # ========================================================

        monthly_averages = {}


        for month_number in range(1, 13):

            values = []

            for year in historical_years:

                year_data = (
                    yearly_monthly_sales
                    .get(year, {})
                )

                if month_number in year_data:

                    values.append(
                        year_data[month_number]
                    )


            if values:

                monthly_averages[
                    month_number
                ] = sum(values) / len(values)

            else:

                monthly_averages[
                    month_number
                ] = 0


        # ========================================================
        # 9. CREATE COMPLETE 12-MONTH PROFILE
        # ========================================================

        seasonal_data = []


        for month_number in range(1, 13):

            demand = float(
                monthly_averages.get(
                    month_number,
                    0
                )
            )

            seasonal_data.append({

                "month":
                    MONTH_NAMES[
                        month_number
                    ],

                "month_number":
                    month_number,

                "demand":
                    round(
                        demand,
                        2
                    )

            })


        # ========================================================
        # 10. ACTUAL MONTHS WITH DATA
        # ========================================================

        positive_months = [

            item

            for item in seasonal_data

            if item["demand"] > 0

        ]


        if not positive_months:

            raise HTTPException(
                status_code=404,
                detail=(
                    f"Category '{historical_category}' "
                    "does not contain positive seasonal demand."
                )
            )


        # ========================================================
        # 11. PEAK MONTH
        # ========================================================

        peak_point = max(
            positive_months,
            key=lambda item: item["demand"]
        )


        # ========================================================
        # 12. LOWEST MONTH
        # ========================================================

        lowest_point = min(
            positive_months,
            key=lambda item: item["demand"]
        )


        peak_demand = float(
            peak_point["demand"]
        )

        lowest_demand = float(
            lowest_point["demand"]
        )


        # ========================================================
        # 13. SEASONALITY CHANGE
        # ========================================================

        if lowest_demand > 0:

            seasonality_change_pct = (

                (
                    peak_demand -
                    lowest_demand
                )
                /
                lowest_demand

            ) * 100

        else:

            seasonality_change_pct = 0


        seasonality_change_pct = round(
            seasonality_change_pct,
            2
        )


        # ========================================================
        # 14. SEASONALITY STRENGTH
        # ========================================================

        if seasonality_change_pct >= 50:

            seasonality_strength = "Strong"

        elif seasonality_change_pct >= 25:

            seasonality_strength = "Moderate"

        elif seasonality_change_pct >= 10:

            seasonality_strength = "Mild"

        else:

            seasonality_strength = "Stable"


        # ========================================================
        # 15. HISTORICAL COVERAGE
        # ========================================================

        historical_months_available = len(
            positive_months
        )

        estimated_months = (
            12 -
            historical_months_available
        )


        # ========================================================
        # 16. RESPONSE
        # ========================================================

        return {

            "product_id":
                str(product.id),

            "product_name":
                product.name,

            "application_category":
                application_category,

            "category":
                historical_category,

            "seasonal_data":
                seasonal_data,

            "peak_month":
                peak_point["month"],

            "peak_demand":
                round(
                    peak_demand,
                    2
                ),

            "lowest_month":
                lowest_point["month"],

            "lowest_demand":
                round(
                    lowest_demand,
                    2
                ),

            "seasonality_strength":
                seasonality_strength,

            "seasonality_change_pct":
                seasonality_change_pct,

            "historical_months_available":
                historical_months_available,

            "estimated_months":
                estimated_months,

            "historical_years":
                historical_years,

            "data_source":
                "ecommerce_sales_34500.csv"

        }


    except HTTPException:
        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Seasonal trend analysis failed: "
                f"{str(e)}"
            )
        )