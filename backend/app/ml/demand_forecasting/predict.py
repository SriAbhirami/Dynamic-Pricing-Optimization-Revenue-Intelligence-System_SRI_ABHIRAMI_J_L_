# ============================================================
# DEMAND FORECASTING API PREDICTION ENGINE
# ============================================================
#
# This file adapts the API request format to the
# 20-feature production demand forecasting model.
#
# Production model:
#     XGBRegressor
#
# The API constructs the exact feature structure expected
# by the saved preprocessing pipeline.
#
# ============================================================

import pandas as pd

from .model import (
    model,
    preprocessor
)


# ============================================================
# PRODUCTION FEATURES
# ============================================================
#
# These are the exact 20 features expected by the saved
# demand forecasting preprocessor.
#
# ============================================================

FEATURE_COLUMNS = [
    "product_id",
    "category",
    "brand",
    "region",
    "channel",
    "season",
    "base_price",
    "current_price",
    "price_change_pct",
    "discount_pct",
    "promotion_type",
    "inventory_level",
    "stockout_flag",
    "year",
    "month",
    "day",
    "day_of_week",
    "sales_rolling_3",
    "sales_rolling_7",
    "sales_rolling_14"
]


# ============================================================
# CREATE MODEL INPUT
# ============================================================

def build_model_input(
    input_data: dict
) -> pd.DataFrame:
    """
    Convert the API request into the exact 20-feature
    structure expected by the production demand model.
    """

    row = {

        "product_id": str(
            input_data.get(
                "product_id",
                ""
            )
        ),

        "category": str(
            input_data.get(
                "category",
                ""
            )
        ),

        "brand": str(
            input_data.get(
                "brand",
                ""
            )
        ),

        "region": str(
            input_data.get(
                "region",
                ""
            )
        ),

        "channel": str(
            input_data.get(
                "channel",
                ""
            )
        ),

        "season": str(
            input_data.get(
                "season",
                ""
            )
        ),

        "base_price": float(
            input_data.get(
                "base_price",
                0
            )
        ),

        "current_price": float(
            input_data.get(
                "current_price",
                0
            )
        ),

        "price_change_pct": float(
            input_data.get(
                "price_change_pct",
                0
            )
        ),

        "discount_pct": float(
            input_data.get(
                "discount_pct",
                0
            )
        ),

        "promotion_type": str(
            input_data.get(
                "promotion_type",
                ""
            )
        ),

        "inventory_level": float(
            input_data.get(
                "inventory_level",
                0
            )
        ),

        "stockout_flag": int(
            input_data.get(
                "stockout_flag",
                0
            )
        ),

        "year": int(
            input_data.get(
                "year",
                2026
            )
        ),

        "month": int(
            input_data.get(
                "month",
                1
            )
        ),

        "day": int(
            input_data.get(
                "day",
                1
            )
        ),

        "day_of_week": int(
            input_data.get(
                "day_of_week",
                0
            )
        ),

        "sales_rolling_3": float(
            input_data.get(
                "sales_rolling_3",
                0
            )
        ),

        "sales_rolling_7": float(
            input_data.get(
                "sales_rolling_7",
                0
            )
        ),

        "sales_rolling_14": float(
            input_data.get(
                "sales_rolling_14",
                0
            )
        )
    }


    # ========================================================
    # CREATE ONE-ROW DATAFRAME
    # ========================================================

    input_df = pd.DataFrame(
        [row]
    )


    # ========================================================
    # GUARANTEE EXACT FEATURE ORDER
    # ========================================================

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
    XGBRegressor model.
    """

    input_df = build_model_input(
        input_data
    )


    # ========================================================
    # PREPROCESS INPUT
    # ========================================================

    processed_data = (
        preprocessor.transform(
            input_df
        )
    )


    # ========================================================
    # MODEL PREDICTION
    # ========================================================

    prediction = (
        model.predict(
            processed_data
        )
    )


    predicted_demand = float(
        prediction[0]
    )


    # ========================================================
    # DEMAND CANNOT BE NEGATIVE
    # ========================================================

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
    # FORECAST HORIZONS
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
        # FUTURE DATE
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
        # TREND ATTENUATION BY HORIZON
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
        # PROJECT SALES SIGNALS
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
        # INVENTORY PROJECTION
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
        # STOCKOUT
        # ----------------------------------------------------

        forecast_input[
            "stockout_flag"
        ] = int(
            projected_inventory <= 0
        )


        # ----------------------------------------------------
        # PREDICT
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