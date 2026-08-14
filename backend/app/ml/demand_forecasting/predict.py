# ============================================================
# DEMAND FORECASTING API PREDICTION ENGINE
# ============================================================
#
# This file adapts the API request format to the 50-feature
# production demand forecasting model.
#
# Production model:
#     Random Forest
#
# The production model was trained using the features from:
#
#     datasets/processed/demand_forecasting_features.csv
#
# Therefore the API must construct the same feature set before
# calling the model.
#
# ============================================================

from pathlib import Path

import numpy as np
import pandas as pd

from .model import (
    model,
    preprocessor
)


# ============================================================
# PRODUCTION FEATURES
# ============================================================

FEATURE_COLUMNS = [

    "sales",
    "revenue",
    "avg_price",
    "total_stock",
    "active_products",
    "active_stores",
    "total_products",
    "total_stores",

    "day_of_week",
    "day_of_month",
    "week_of_year",
    "month",
    "quarter",
    "year",
    "day_of_year",
    "is_weekend",

    "dow_sin",
    "dow_cos",

    "month_sin",
    "month_cos",

    "day_of_year_sin",
    "day_of_year_cos",

    "sales_lag_1",
    "sales_lag_7",
    "sales_lag_14",
    "sales_lag_30",
    "sales_lag_90",

    "revenue_lag_1",
    "revenue_lag_7",
    "revenue_lag_30",

    "price_lag_1",
    "price_lag_7",

    "price_change",
    "price_change_pct",

    "stock_lag_1",
    "stock_lag_7",

    "stock_change",
    "stock_change_pct",

    "stockout_flag",

    "rolling_sales_7",
    "rolling_sales_14",
    "rolling_sales_30",
    "rolling_sales_90",

    "sales_std_7",
    "sales_std_30",

    "rolling_revenue_7",
    "rolling_revenue_30",

    "sales_growth_7d",
    "sales_growth_30d",

    "revenue_per_unit"
]


# ============================================================
# CREATE MODEL INPUT
# ============================================================

def build_model_input(input_data: dict) -> pd.DataFrame:
    """
    Convert the API request into the exact 50-feature structure
    expected by the production Random Forest model.
    """

    # ========================================================
    # BASIC INPUT VALUES
    # ========================================================

    base_price = float(
        input_data.get(
            "base_price",
            0
        )
    )

    current_price = float(
        input_data.get(
            "current_price",
            base_price
        )
    )

    price_change_pct = float(
        input_data.get(
            "price_change_pct",
            0
        )
    )

    discount_pct = float(
        input_data.get(
            "discount_pct",
            0
        )
    )

    inventory = float(
        input_data.get(
            "inventory_level",
            0
        )
    )

    year = int(
        input_data.get(
            "year",
            2020
        )
    )

    month = int(
        input_data.get(
            "month",
            1
        )
    )

    day = int(
        input_data.get(
            "day",
            1
        )
    )

    day_of_week = int(
        input_data.get(
            "day_of_week",
            0
        )
    )


    # ========================================================
    # SALES SIGNALS
    # ========================================================

    sales_3 = float(
        input_data.get(
            "sales_rolling_3",
            0
        )
    )

    sales_7 = float(
        input_data.get(
            "sales_rolling_7",
            0
        )
    )

    sales_14 = float(
        input_data.get(
            "sales_rolling_14",
            0
        )
    )


    # ========================================================
    # ESTIMATE CURRENT DAILY SALES
    # ========================================================

    if sales_3 > 0:

        current_sales = sales_3

    elif sales_7 > 0:

        current_sales = sales_7

    elif sales_14 > 0:

        current_sales = (
            sales_14 / 14.0
        )

    else:

        current_sales = 0.0


    current_sales = max(
        current_sales,
        0.0
    )


    # ========================================================
    # REVENUE
    # ========================================================

    current_revenue = (
        current_sales
        * current_price
    )


    # ========================================================
    # DATE FEATURES
    # ========================================================

    try:

        current_date = pd.Timestamp(
            year=year,
            month=month,
            day=day
        )

    except Exception:

        current_date = pd.Timestamp.today()

        year = current_date.year
        month = current_date.month
        day = current_date.day
        day_of_week = current_date.dayofweek


    day_of_month = (
        current_date.day
    )

    week_of_year = int(
        current_date.isocalendar().week
    )

    quarter = (
        current_date.quarter
    )

    day_of_year = (
        current_date.dayofyear
    )

    is_weekend = int(
        day_of_week >= 5
    )


    # ========================================================
    # CYCLICAL FEATURES
    # ========================================================

    dow_sin = np.sin(
        2 * np.pi * day_of_week / 7
    )

    dow_cos = np.cos(
        2 * np.pi * day_of_week / 7
    )

    month_sin = np.sin(
        2 * np.pi * month / 12
    )

    month_cos = np.cos(
        2 * np.pi * month / 12
    )

    day_of_year_sin = np.sin(
        2 * np.pi * day_of_year / 365
    )

    day_of_year_cos = np.cos(
        2 * np.pi * day_of_year / 365
    )


    # ========================================================
    # SALES LAGS
    # ========================================================

    sales_lag_1 = current_sales

    sales_lag_7 = sales_7

    sales_lag_14 = sales_14

    sales_lag_30 = sales_14

    sales_lag_90 = sales_14


    # ========================================================
    # REVENUE LAGS
    # ========================================================

    revenue_lag_1 = current_revenue

    revenue_lag_7 = (
        sales_7
        * current_price
    )

    revenue_lag_30 = (
        sales_14
        * current_price
    )


    # ========================================================
    # PRICE LAGS
    # ========================================================

    price_lag_1 = current_price

    price_lag_7 = (
        base_price
        if base_price > 0
        else current_price
    )


    # ========================================================
    # PRICE CHANGE
    # ========================================================

    price_change = (
        current_price
        - price_lag_1
    )

    # Since current price is the latest known price,
    # use the supplied percentage as the historical signal.

    if price_change_pct == 0:

        price_change_pct_value = 0.0

    else:

        price_change_pct_value = (
            price_change_pct
        )


    # ========================================================
    # STOCK FEATURES
    # ========================================================

    total_stock = max(
        inventory,
        0.0
    )

    stock_lag_1 = total_stock

    stock_lag_7 = total_stock

    stock_change = 0.0

    stock_change_pct = 0.0

    stockout_flag = int(
        total_stock <= 0
    )


    # ========================================================
    # ROLLING SALES
    # ========================================================

    rolling_sales_7 = (
        sales_7
    )

    rolling_sales_14 = (
        sales_14
    )

    rolling_sales_30 = (
        sales_14
    )

    rolling_sales_90 = (
        sales_14
    )


    # ========================================================
    # SALES VOLATILITY
    # ========================================================

    sales_values = np.array(

        [
            sales_3,
            sales_7,
            sales_14
        ],

        dtype=float

    )

    sales_std_7 = float(
        np.std(
            sales_values
        )
    )

    sales_std_30 = float(
        np.std(
            sales_values
        )
    )


    # ========================================================
    # ROLLING REVENUE
    # ========================================================

    rolling_revenue_7 = (
        rolling_sales_7
        * current_price
    )

    rolling_revenue_30 = (
        rolling_sales_30
        * current_price
    )


    # ========================================================
    # SALES GROWTH
    # ========================================================

    if sales_14 > 0:

        sales_growth_7d = (
            (
                sales_7
                - sales_14
            )
            /
            abs(sales_14)
        )

    else:

        sales_growth_7d = 0.0


    sales_growth_30d = (
        sales_growth_7d
    )


    # ========================================================
    # REVENUE PER UNIT
    # ========================================================

    revenue_per_unit = (
        current_price
    )


    # ========================================================
    # BUILD FEATURE ROW
    # ========================================================

    row = {

        "sales":
            current_sales,

        "revenue":
            current_revenue,

        "avg_price":
            current_price,

        "total_stock":
            total_stock,

        # API request represents one product.
        "active_products":
            1,

        "active_stores":
            1,

        "total_products":
            1,

        "total_stores":
            1,

        "day_of_week":
            day_of_week,

        "day_of_month":
            day_of_month,

        "week_of_year":
            week_of_year,

        "month":
            month,

        "quarter":
            quarter,

        "year":
            year,

        "day_of_year":
            day_of_year,

        "is_weekend":
            is_weekend,

        "dow_sin":
            dow_sin,

        "dow_cos":
            dow_cos,

        "month_sin":
            month_sin,

        "month_cos":
            month_cos,

        "day_of_year_sin":
            day_of_year_sin,

        "day_of_year_cos":
            day_of_year_cos,

        "sales_lag_1":
            sales_lag_1,

        "sales_lag_7":
            sales_lag_7,

        "sales_lag_14":
            sales_lag_14,

        "sales_lag_30":
            sales_lag_30,

        "sales_lag_90":
            sales_lag_90,

        "revenue_lag_1":
            revenue_lag_1,

        "revenue_lag_7":
            revenue_lag_7,

        "revenue_lag_30":
            revenue_lag_30,

        "price_lag_1":
            price_lag_1,

        "price_lag_7":
            price_lag_7,

        "price_change":
            price_change,

        "price_change_pct":
            price_change_pct_value,

        "stock_lag_1":
            stock_lag_1,

        "stock_lag_7":
            stock_lag_7,

        "stock_change":
            stock_change,

        "stock_change_pct":
            stock_change_pct,

        "stockout_flag":
            stockout_flag,

        "rolling_sales_7":
            rolling_sales_7,

        "rolling_sales_14":
            rolling_sales_14,

        "rolling_sales_30":
            rolling_sales_30,

        "rolling_sales_90":
            rolling_sales_90,

        "sales_std_7":
            sales_std_7,

        "sales_std_30":
            sales_std_30,

        "rolling_revenue_7":
            rolling_revenue_7,

        "rolling_revenue_30":
            rolling_revenue_30,

        "sales_growth_7d":
            sales_growth_7d,

        "sales_growth_30d":
            sales_growth_30d,

        "revenue_per_unit":
            revenue_per_unit

    }


    # ========================================================
    # DATAFRAME
    # ========================================================

    input_df = pd.DataFrame(
        [row]
    )

    # Guarantee exact training feature order.

    input_df = input_df[
        FEATURE_COLUMNS
    ]

    return input_df


# ============================================================
# SINGLE DEMAND PREDICTION
# ============================================================

def predict_demand(
    input_data: dict
) -> float:
    """
    Generate a demand prediction using the production
    Random Forest model.
    """

    input_df = build_model_input(
        input_data
    )

    processed_data = (
        preprocessor.transform(
            input_df
        )
    )

    prediction = (
        model.predict(
            processed_data
        )
    )

    predicted_demand = float(
        prediction[0]
    )

    # Demand cannot be negative.

    predicted_demand = max(
        predicted_demand,
        0.0
    )

    return predicted_demand


# ============================================================
# MULTI-HORIZON DEMAND FORECAST
# ============================================================

def generate_demand_forecast(
    input_data: dict
) -> dict:
    """
    Generate demand predictions for:

        7 days
        14 days
        30 days
        3 months
        6 months
        12 months

    The production model is evaluated for each horizon
    using projected calendar, sales and inventory features.
    """

    # ========================================================
    # CURRENT PREDICTION
    # ========================================================

    current_prediction = (
        predict_demand(
            input_data
        )
    )


    # ========================================================
    # HORIZONS
    # ========================================================

    horizons = {

        "7_days": 7,

        "14_days": 14,

        "30_days": 30,

        "3_months": 90,

        "6_months": 180,

        "12_months": 365

    }


    forecasts = {}


    # ========================================================
    # BASE DATE
    # ========================================================

    try:

        base_date = pd.Timestamp(

            year=int(
                input_data["year"]
            ),

            month=int(
                input_data["month"]
            ),

            day=int(
                input_data["day"]
            )

        )

    except Exception:

        base_date = pd.Timestamp.today()


    # ========================================================
    # SALES SIGNALS
    # ========================================================

    sales_3 = float(
        input_data.get(
            "sales_rolling_3",
            0
        )
    )

    sales_7 = float(
        input_data.get(
            "sales_rolling_7",
            0
        )
    )

    sales_14 = float(
        input_data.get(
            "sales_rolling_14",
            0
        )
    )


    # ========================================================
    # SALES TREND
    # ========================================================

    if sales_14 > 0:

        short_term_ratio = (
            sales_3
            /
            (sales_14 / 14.0)
        )

    else:

        short_term_ratio = 1.0


    short_term_ratio = max(
        0.80,
        min(
            short_term_ratio,
            1.20
        )
    )


    # ========================================================
    # GENERATE HORIZONS
    # ========================================================

    for horizon_name, days_ahead in (
        horizons.items()
    ):

        forecast_input = (
            input_data.copy()
        )


        # ----------------------------------------------------
        # Future date
        # ----------------------------------------------------

        forecast_date = (
            base_date
            +
            pd.Timedelta(
                days=days_ahead
            )
        )


        forecast_input["year"] = (
            forecast_date.year
        )

        forecast_input["month"] = (
            forecast_date.month
        )

        forecast_input["day"] = (
            forecast_date.day
        )

        forecast_input["day_of_week"] = (
            forecast_date.dayofweek
        )


        # ----------------------------------------------------
        # Trend attenuation by horizon
        # ----------------------------------------------------

        if days_ahead <= 7:

            trend_factor = (
                short_term_ratio
            )

        elif days_ahead <= 14:

            trend_factor = (
                short_term_ratio * 0.75
                +
                0.25
            )

        elif days_ahead <= 30:

            trend_factor = (
                short_term_ratio * 0.50
                +
                0.50
            )

        elif days_ahead <= 90:

            trend_factor = (
                short_term_ratio * 0.35
                +
                0.65
            )

        elif days_ahead <= 180:

            trend_factor = (
                short_term_ratio * 0.20
                +
                0.80
            )

        else:

            trend_factor = (
                short_term_ratio * 0.10
                +
                0.90
            )


        # ----------------------------------------------------
        # Project sales signals
        # ----------------------------------------------------

        forecast_input[
            "sales_rolling_3"
        ] = (
            sales_3
            * trend_factor
        )

        forecast_input[
            "sales_rolling_7"
        ] = (
            sales_7
            * trend_factor
        )

        forecast_input[
            "sales_rolling_14"
        ] = (
            sales_14
            * trend_factor
        )


        # ----------------------------------------------------
        # Inventory projection
        # ----------------------------------------------------

        current_inventory = float(
            input_data.get(
                "inventory_level",
                0
            )
        )


        if sales_14 > 0:

            estimated_daily_sales = (
                sales_14 / 14.0
            )

        elif sales_7 > 0:

            estimated_daily_sales = (
                sales_7 / 7.0
            )

        elif sales_3 > 0:

            estimated_daily_sales = (
                sales_3 / 3.0
            )

        else:

            estimated_daily_sales = 0.0


        projected_inventory = (

            current_inventory

            -

            estimated_daily_sales
            * days_ahead

        )


        projected_inventory = max(
            0.0,
            projected_inventory
        )


        forecast_input[
            "inventory_level"
        ] = (
            projected_inventory
        )


        # ----------------------------------------------------
        # Stockout
        # ----------------------------------------------------

        forecast_input[
            "stockout_flag"
        ] = int(
            projected_inventory <= 0
        )


        # ----------------------------------------------------
        # Predict
        # ----------------------------------------------------

        predicted_demand = (
            predict_demand(
                forecast_input
            )
        )


        forecasts[
            horizon_name
        ] = round(
            float(
                predicted_demand
            ),
            2
        )


    # ========================================================
    # TREND ANALYSIS
    # ========================================================

    final_prediction = (
        forecasts[
            "12_months"
        ]
    )


    if current_prediction != 0:

        percentage_change = (

            (
                final_prediction
                -
                current_prediction
            )

            /

            abs(
                current_prediction
            )

        ) * 100

    else:

        percentage_change = 0.0


    if percentage_change >= 5:

        trend = "INCREASING"

    elif percentage_change <= -5:

        trend = "DECREASING"

    else:

        trend = "STABLE"


    # ========================================================
    # CONFIDENCE SCORE
    # ========================================================

    forecast_values = list(
        forecasts.values()
    )


    if forecast_values:

        mean_forecast = (
            sum(
                forecast_values
            )
            /
            len(
                forecast_values
            )
        )

        if mean_forecast != 0:

            variation = (

                (
                    max(
                        forecast_values
                    )
                    -
                    min(
                        forecast_values
                    )
                )

                /

                abs(
                    mean_forecast
                )

            )

        else:

            variation = 0.0

    else:

        variation = 0.0


    confidence = (
        100
        -
        variation * 100
    )


    confidence = max(
        50.0,
        min(
            confidence,
            95.0
        )
    )


    # ========================================================
    # RESPONSE
    # ========================================================

    return {

        "current_demand":
            round(
                float(
                    current_prediction
                ),
                2
            ),

        "short_term": {

            "7_days":
                forecasts["7_days"],

            "14_days":
                forecasts["14_days"],

            "30_days":
                forecasts["30_days"]

        },

        "medium_term": {

            "3_months":
                forecasts["3_months"],

            "6_months":
                forecasts["6_months"]

        },

        "long_term": {

            "12_months":
                forecasts["12_months"]

        },

        "trend":
            trend,

        "trend_change_pct":
            round(
                float(
                    percentage_change
                ),
                2
            ),

        "confidence_score":
            round(
                float(
                    confidence
                ),
                2
            )

    }