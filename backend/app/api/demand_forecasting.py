from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from sqlalchemy.orm import Session
from sqlalchemy import func

from pathlib import Path
import json
import math

from app.ml.demand_forecasting.predict import (
    predict_demand
)

from app.database.database import get_db
from app.models.pricing_demand import PricingDemand
from app.models.historical_sales import HistoricalSales
from app.models.products import Product


router = APIRouter(
    prefix="/demand-forecast",
    tags=["Demand Forecasting"]
)


# ============================================================
# FORECAST FILE LOCATION
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[3]

FORECAST_SUMMARY_PATH = (
    PROJECT_ROOT
    / "datasets"
    / "forecasts"
    / "forecast_summary.json"
)


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
# SEASONAL TREND RESPONSE
# ============================================================

class SeasonalDataPoint(BaseModel):

    month: str
    month_number: int
    demand: float
    is_estimated: bool = False


class SeasonalTrendResponse(BaseModel):

    product_id: str
    product_name: str
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

    data_source: str


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
# HELPER: SAFE FLOAT
# ============================================================

def safe_float(value, default=0.0):

    try:

        number = float(value)

        if math.isnan(number) or math.isinf(number):

            return default

        return number

    except (TypeError, ValueError):

        return default


# ============================================================
# HELPER: INTERPOLATE MISSING MONTHS
# ============================================================

def interpolate_monthly_values(
    observed_values: dict[int, float]
):
    """
    Build a complete January-December seasonal profile.

    Existing months retain their actual historical values.

    Missing months are estimated by interpolation between
    surrounding observed months.

    The interpolation is circular so December and January
    are also treated as neighboring seasonal months.
    """

    if not observed_values:

        return {}, set()


    complete = {}

    estimated_months = set()


    observed_months = sorted(
        observed_values.keys()
    )


    # --------------------------------------------------------
    # ONLY ONE OBSERVED MONTH
    # --------------------------------------------------------

    if len(observed_months) == 1:

        only_month = observed_months[0]

        only_value = observed_values[only_month]

        for month_number in range(1, 13):

            complete[month_number] = only_value

            if month_number != only_month:

                estimated_months.add(
                    month_number
                )

        return complete, estimated_months


    # --------------------------------------------------------
    # TWO OR MORE OBSERVED MONTHS
    # --------------------------------------------------------

    for month_number in range(1, 13):

        if month_number in observed_values:

            complete[month_number] = (
                observed_values[month_number]
            )

            continue


        # ----------------------------------------------------
        # Find previous observed month
        # ----------------------------------------------------

        previous_candidates = [

            month

            for month in observed_months

            if month < month_number

        ]


        if previous_candidates:

            previous_month = max(
                previous_candidates
            )

        else:

            previous_month = max(
                observed_months
            )


        # ----------------------------------------------------
        # Find next observed month
        # ----------------------------------------------------

        next_candidates = [

            month

            for month in observed_months

            if month > month_number

        ]


        if next_candidates:

            next_month = min(
                next_candidates
            )

        else:

            next_month = min(
                observed_months
            )


        # ----------------------------------------------------
        # Convert circular month positions
        # ----------------------------------------------------

        previous_position = previous_month

        next_position = next_month

        current_position = month_number


        if next_position <= previous_position:

            next_position += 12


        if current_position <= previous_position:

            current_position += 12


        # ----------------------------------------------------
        # Linear interpolation
        # ----------------------------------------------------

        previous_value = safe_float(
            observed_values[previous_month]
        )

        next_value = safe_float(
            observed_values[next_month]
        )


        distance = (
            next_position -
            previous_position
        )


        if distance <= 0:

            interpolated_value = (
                previous_value +
                next_value
            ) / 2

        else:

            ratio = (

                current_position -
                previous_position

            ) / distance


            interpolated_value = (

                previous_value +

                (
                    next_value -
                    previous_value
                ) * ratio

            )


        complete[month_number] = max(
            0,
            interpolated_value
        )

        estimated_months.add(
            month_number
        )


    return complete, estimated_months


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

            "predicted_demand_index":
                round(
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

    """
    Return production demand forecasts generated by:

        scripts/demand_forecaster.py

    Horizons:

        7 days
        14 days
        30 days
        3 months
        6 months
        12 months
    """

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
# APPLICATION PRODUCTS
# ============================================================

@router.get(
    "/application-products"
)
def get_application_products(
    db: Session = Depends(get_db)
):

    """
    Return the products managed by PricePilot AI.

    This endpoint is intentionally based on the products table,
    not on the historical dataset product IDs.
    """

    try:

        products = (

            db.query(Product)

            .order_by(
                Product.name.asc()
            )

            .all()

        )


        return {

            "products": [

                {

                    "id":
                        product.id,

                    "name":
                        product.name,

                    "category":
                        product.category,

                    "current_price":
                        product.current_price,

                    "stock":
                        product.stock

                }

                for product in products

            ],

            "count":
                len(products)

        }


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to load application products: "
                f"{str(e)}"
            )

        )


# ============================================================
# HISTORICAL PRODUCT LIST
# ============================================================

@router.get(
    "/historical-products"
)
def get_historical_products(
    db: Session = Depends(get_db)
):

    """
    Return historical dataset product IDs.

    This endpoint is retained for dataset diagnostics only.

    These identifiers are NOT used by the Forecast page as
    application products.
    """

    try:

        historical_products = (

            db.query(
                HistoricalSales.product_id
            )

            .filter(
                HistoricalSales.product_id.isnot(None)
            )

            .filter(
                HistoricalSales.product_id != ""
            )

            .distinct()

            .order_by(
                HistoricalSales.product_id
            )

            .all()

        )


        product_ids = [

            str(row.product_id)

            for row in historical_products

        ]


        return {

            "historical_products":
                product_ids,

            "count":
                len(product_ids)

        }


    except Exception as e:

        raise HTTPException(

            status_code=500,

            detail=(
                "Failed to load historical products: "
                f"{str(e)}"
            )

        )


# ============================================================
# SEASONAL TREND
# ============================================================

@router.get(
    "/seasonal/{product_id}",
    response_model=SeasonalTrendResponse
)
def get_seasonal_trend(
    product_id: str,
    db: Session = Depends(get_db)
):

    """
    Calculate seasonal demand for an application product.

    IMPORTANT:

    product_id refers to the ID from the application's
    products table.

    Historical dataset IDs such as P0001/P0002 are NOT assumed
    to match application product IDs.

    The selected application's category is used to retrieve
    historical market behavior from PricingDemand.

    Missing months are interpolated so the frontend receives
    a complete January-December seasonal profile.
    """

    try:

        # ====================================================
        # NORMALIZE ID
        # ====================================================

        product_id = str(
            product_id
        ).strip()


        if not product_id:

            raise HTTPException(

                status_code=400,

                detail="Product ID cannot be empty."

            )


        # ====================================================
        # FIND APPLICATION PRODUCT
        # ====================================================

        try:

            application_product_id = int(
                product_id
            )

        except ValueError:

            raise HTTPException(

                status_code=400,

                detail=(
                    "Forecast product ID must belong "
                    "to the application products table."
                )

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
                    f"Application product {product_id} "
                    "was not found in the products table."
                )

            )


        # ====================================================
        # GET APPLICATION CATEGORY
        # ====================================================

        category = str(
            product.category or ""
        ).strip()


        if not category:

            raise HTTPException(

                status_code=404,

                detail=(
                    f"Product {product.name} "
                    "does not have a category."
                )

            )


        # ====================================================
        # CATEGORY HISTORICAL MONTHLY DEMAND
        # ====================================================
        #
        # PricingDemand contains the historical market
        # signals used by the forecasting system.
        #
        # We intentionally aggregate by category because the
        # application product IDs do not correspond to the
        # historical dataset product IDs.
        #
        # ====================================================

        monthly_data = (

            db.query(

                func.extract(
                    "month",
                    PricingDemand.date
                ).label(
                    "month_number"
                ),

                func.avg(
                    PricingDemand.demand_index
                ).label(
                    "average_demand"
                )

            )

            .filter(

                PricingDemand.category ==
                category

            )

            .filter(

                PricingDemand.date.isnot(None)

            )

            .filter(

                PricingDemand.demand_index.isnot(None)

            )

            .group_by(

                func.extract(
                    "month",
                    PricingDemand.date
                )

            )

            .order_by(

                func.extract(
                    "month",
                    PricingDemand.date
                )

            )

            .all()

        )


        # ====================================================
        # FALLBACK: CASE-INSENSITIVE CATEGORY
        # ====================================================

        if not monthly_data:

            monthly_data = (

                db.query(

                    func.extract(
                        "month",
                        PricingDemand.date
                    ).label(
                        "month_number"
                    ),

                    func.avg(
                        PricingDemand.demand_index
                    ).label(
                        "average_demand"
                    )

                )

                .filter(

                    func.lower(
                        PricingDemand.category
                    ) ==
                    category.lower()

                )

                .filter(

                    PricingDemand.date.isnot(None)

                )

                .filter(

                    PricingDemand.demand_index.isnot(None)

                )

                .group_by(

                    func.extract(
                        "month",
                        PricingDemand.date
                    )

                )

                .order_by(

                    func.extract(
                        "month",
                        PricingDemand.date
                    )

                )

                .all()

            )


        # ====================================================
        # NO CATEGORY DATA
        # ====================================================

        if not monthly_data:

            raise HTTPException(

                status_code=404,

                detail=(

                    f"No historical seasonal data "
                    f"was found for the "
                    f"'{category}' category."

                )

            )


        # ====================================================
        # STORE OBSERVED VALUES
        # ====================================================

        observed_values = {}


        for row in monthly_data:

            month_number = int(
                row.month_number
            )

            demand_value = safe_float(
                row.average_demand
            )


            observed_values[
                month_number
            ] = max(
                0,
                demand_value
            )


        # ====================================================
        # COMPLETE 12-MONTH PROFILE
        # ====================================================

        complete_values, estimated_months = (
            interpolate_monthly_values(
                observed_values
            )
        )


        # ====================================================
        # BUILD RESPONSE DATA
        # ====================================================

        seasonal_data = []


        for month_number in range(
            1,
            13
        ):

            demand_value = safe_float(
                complete_values.get(
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
                        demand_value,
                        2
                    ),

                "is_estimated":
                    month_number
                    in estimated_months

            })


        # ====================================================
        # PEAK / LOWEST
        # ====================================================

        positive_months = [

            item

            for item in seasonal_data

            if item["demand"] > 0

        ]


        if not positive_months:

            raise HTTPException(

                status_code=404,

                detail=(
                    f"The '{category}' category "
                    "does not contain positive historical "
                    "demand values."
                )

            )


        peak_point = max(

            positive_months,

            key=lambda item:
                item["demand"]

        )


        lowest_point = min(

            positive_months,

            key=lambda item:
                item["demand"]

        )


        peak_demand = safe_float(
            peak_point["demand"]
        )

        lowest_demand = safe_float(
            lowest_point["demand"]
        )


        # ====================================================
        # SEASONALITY CHANGE
        # ====================================================

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

            max(
                0,
                seasonality_change_pct
            ),

            2

        )


        # ====================================================
        # SEASONALITY STRENGTH
        # ====================================================

        if seasonality_change_pct >= 40:

            seasonality_strength = "Strong"

        elif seasonality_change_pct >= 20:

            seasonality_strength = "Moderate"

        elif seasonality_change_pct >= 10:

            seasonality_strength = "Mild"

        else:

            seasonality_strength = "Stable"


        # ====================================================
        # SOURCE DESCRIPTION
        # ====================================================

        historical_months_available = len(
            observed_values
        )

        estimated_month_count = len(
            estimated_months
        )


        if estimated_month_count == 0:

            data_source = (
                "Historical monthly demand "
                "for the selected product category"
            )

        else:

            data_source = (

                "Historical monthly demand for the "
                "selected product category, with "
                f"{estimated_month_count} month(s) "
                "estimated by seasonal interpolation"

            )


        # ====================================================
        # RESPONSE
        # ====================================================

        return {

            "product_id":
                product_id,

            "product_name":
                product.name,

            "category":
                category,

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
                estimated_month_count,

            "data_source":
                data_source

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