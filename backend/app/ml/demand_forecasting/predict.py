
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
# The model predicts NEXT-DAY demand.
#
# Multi-horizon forecasting is therefore performed
# recursively: each predicted day is used to update the
# rolling demand features for the following day.
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

    input_df = pd.DataFrame(
        [row]
    )

    # Guarantee exact feature order.
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
    Generate a next-day demand prediction using the
    production XGBRegressor model.

    Diagnostic logging is included so that Render logs
    reveal the exact raw prediction before any
    non-negative correction is applied.
    """

    print("=" * 70)
    print("DEMAND PREDICTION DEBUG")
    print("=" * 70)

    try:

        # ----------------------------------------------------
        # BUILD INPUT
        # ----------------------------------------------------

        input_df = build_model_input(
            input_data
        )

        print(
            "Input dataframe:"
        )

        print(
            input_df.to_dict(
                orient="records"
            )
        )

        print(
            "Input dataframe shape:",
            input_df.shape
        )

        print(
            "Input dataframe columns:",
            list(
                input_df.columns
            )
        )


        # ----------------------------------------------------
        # PREPROCESS
        # ----------------------------------------------------

        processed_data = (
            preprocessor.transform(
                input_df
            )
        )

        print(
            "Processed data shape:",
            getattr(
                processed_data,
                "shape",
                "unknown"
            )
        )


        # ----------------------------------------------------
        # MODEL PREDICTION
        # ----------------------------------------------------

        prediction = (
            model.predict(
                processed_data
            )
        )

        print(
            "Raw model prediction:",
            prediction
        )


        # ----------------------------------------------------
        # EXTRACT VALUE
        # ----------------------------------------------------

        predicted_demand = float(
            prediction[0]
        )

        print(
            "Raw predicted demand:",
            predicted_demand
        )


        # ----------------------------------------------------
        # VALIDATE VALUE
        # ----------------------------------------------------

        if pd.isna(
            predicted_demand
        ):

            raise ValueError(
                "Model returned NaN demand."
            )


        # ----------------------------------------------------
        # NON-NEGATIVE DEMAND
        # ----------------------------------------------------

        predicted_demand = max(
            predicted_demand,
            0.0
        )

        print(
            "Final predicted demand:",
            predicted_demand
        )

        print("=" * 70)

        return predicted_demand


    except Exception as e:

        print("=" * 70)

        print(
            "DEMAND PREDICTION FAILED"
        )

        print(
            "Error type:",
            type(e).__name__
        )

        print(
            "Error:",
            str(e)
        )

        print("=" * 70)

        raise


# ============================================================
# HELPER: CURRENT SEASON
# ============================================================

def _get_season(
    month: int
) -> str:
    """
    Determine a simple seasonal label from the month.

    This is only used when the API request does not already
    provide a season.
    """

    if month in [3, 4, 5]:
        return "Summer"

    if month in [6, 7, 8, 9]:
        return "Monsoon"

    if month in [10, 11]:
        return "Autumn"

    return "Winter"


# ============================================================
# MULTI-HORIZON DEMAND FORECAST
# ============================================================

def generate_demand_forecast(
    input_data: dict
) -> dict:
    """
    Generate recursive demand forecasts for:

        7 days
        14 days
        30 days
        3 months
        6 months
        12 months

    The production model predicts next-day demand.

    Therefore this function predicts one future day at a time.
    The prediction is then added to the rolling-demand history
    before predicting the next day.

    The returned structure is compatible with the
    DemandForecast API layer.
    """

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

        base_date = (
            pd.Timestamp.today()
            .normalize()
        )


    # ========================================================
    # INITIAL ROLLING VALUES
    # ========================================================

    sales_3 = max(
        float(
            input_data.get(
                "sales_rolling_3",
                0
            )
        ),
        0.0
    )

    sales_7 = max(
        float(
            input_data.get(
                "sales_rolling_7",
                0
            )
        ),
        0.0
    )

    sales_14 = max(
        float(
            input_data.get(
                "sales_rolling_14",
                0
            )
        ),
        0.0
    )


    # ========================================================
    # INITIAL DAILY BASELINE
    # ========================================================
    #
    # The API supplies rolling demand values rather than the
    # individual previous 14 days.
    #
    # We therefore construct a stable initial history.
    #
    # Once recursive predictions begin, the actual predicted
    # values replace this initial history.
    #
    # ========================================================

    if sales_3 > 0:

        baseline_daily = sales_3

    elif sales_7 > 0:

        baseline_daily = sales_7

    elif sales_14 > 0:

        baseline_daily = sales_14

    else:

        baseline_daily = 0.0


    history = [
        float(
            baseline_daily
        )
        for _ in range(14)
    ]


    # ========================================================
    # INITIAL INVENTORY
    # ========================================================

    initial_inventory = max(
        float(
            input_data.get(
                "inventory_level",
                0
            )
        ),
        0.0
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


    # ========================================================
    # RECURSIVE DAILY FORECAST
    # ========================================================

    daily_predictions = []

    current_inventory = (
        initial_inventory
    )


    for day_number in range(
        1,
        366
    ):

        # ----------------------------------------------------
        # FUTURE DATE
        # ----------------------------------------------------

        forecast_date = (
            base_date
            +
            pd.Timedelta(
                days=day_number
            )
        )


        # ----------------------------------------------------
        # UPDATE ROLLING FEATURES
        # ----------------------------------------------------

        recent_3 = history[-3:]

        recent_7 = history[-7:]

        recent_14 = history[-14:]


        rolling_3 = (
            sum(recent_3)
            /
            len(recent_3)
        )

        rolling_7 = (
            sum(recent_7)
            /
            len(recent_7)
        )

        rolling_14 = (
            sum(recent_14)
            /
            len(recent_14)
        )


        # ----------------------------------------------------
        # BUILD FUTURE INPUT
        # ----------------------------------------------------

        forecast_input = (
            input_data.copy()
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


        forecast_input[
            "sales_rolling_3"
        ] = rolling_3

        forecast_input[
            "sales_rolling_7"
        ] = rolling_7

        forecast_input[
            "sales_rolling_14"
        ] = rolling_14


        # ----------------------------------------------------
        # UPDATE SEASON
        # ----------------------------------------------------
        #
        # Keep the user's supplied season when present.
        # Otherwise calculate it from the future month.
        #
        # ----------------------------------------------------

        if not forecast_input.get(
            "season"
        ):

            forecast_input[
                "season"
            ] = _get_season(
                forecast_date.month
            )


        # ----------------------------------------------------
        # INVENTORY
        # ----------------------------------------------------
        #
        # Inventory represents stock available before the
        # current day's predicted demand.
        #
        # ----------------------------------------------------

        forecast_input[
            "inventory_level"
        ] = max(
            current_inventory,
            0.0
        )


        # ----------------------------------------------------
        # STOCKOUT STATUS
        # ----------------------------------------------------

        forecast_input[
            "stockout_flag"
        ] = int(
            current_inventory <= 0
        )


        # ----------------------------------------------------
        # PREDICT NEXT DAY
        # ----------------------------------------------------

        predicted_demand = (
            predict_demand(
                forecast_input
            )
        )


        predicted_demand = max(
            float(
                predicted_demand
            ),
            0.0
        )


        # ----------------------------------------------------
        # STORE PREDICTION
        # ----------------------------------------------------

        daily_predictions.append(
            predicted_demand
        )


        # ----------------------------------------------------
        # UPDATE INVENTORY
        # ----------------------------------------------------

        current_inventory = max(
            0.0,
            current_inventory
            -
            predicted_demand
        )


        # ----------------------------------------------------
        # UPDATE HISTORY
        # ----------------------------------------------------

        history.append(
            predicted_demand
        )


    # ========================================================
    # CURRENT MODEL PREDICTION
    # ========================================================

    current_prediction = (
        predict_demand(
            input_data
        )
    )

    current_prediction = max(
        float(
            current_prediction
        ),
        0.0
    )


    # ========================================================
    # PRODUCTION MODEL NAME
    # ========================================================

    production_model = (
        type(model).__name__
    )


    # ========================================================
    # BUILD HORIZON RESULTS
    # ========================================================

    forecasts = {}


    for horizon_name, days in (
        horizons.items()
    ):

        values = (
            daily_predictions[
                :days
            ]
        )


        # ----------------------------------------------------
        # TOTAL DEMAND
        # ----------------------------------------------------

        total_demand = sum(
            values
        )


        # ----------------------------------------------------
        # AVERAGE DAILY DEMAND
        # ----------------------------------------------------

        if values:

            average_daily_demand = (
                total_demand
                /
                len(values)
            )

        else:

            average_daily_demand = 0.0


        # ----------------------------------------------------
        # MAXIMUM / MINIMUM
        # ----------------------------------------------------

        if values:

            maximum_daily_demand = max(
                values
            )

            minimum_daily_demand = min(
                values
            )

        else:

            maximum_daily_demand = 0.0

            minimum_daily_demand = 0.0


        # ----------------------------------------------------
        # REVENUE
        # ----------------------------------------------------

        current_price = max(
            float(
                input_data.get(
                    "current_price",
                    0
                )
            ),
            0.0
        )


        total_predicted_revenue = (
            total_demand
            *
            current_price
        )


        # ----------------------------------------------------
        # HORIZON TREND
        # ----------------------------------------------------

        if current_prediction > 0:

            horizon_change = (

                (
                    average_daily_demand
                    -
                    current_prediction
                )

                /

                current_prediction

            ) * 100

        else:

            if average_daily_demand > 0:

                horizon_change = 100.0

            else:

                horizon_change = 0.0


        if horizon_change >= 5:

            horizon_trend = "INCREASING"

        elif horizon_change <= -5:

            horizon_trend = "DECREASING"

        else:

            horizon_trend = "STABLE"


        # ----------------------------------------------------
        # STORE HORIZON
        # ----------------------------------------------------

        forecasts[
            horizon_name
        ] = {

            "forecast_horizon":
                horizon_name,

            "forecast_start":
                (
                    base_date
                    +
                    pd.Timedelta(
                        days=1
                    )
                ).strftime(
                    "%Y-%m-%d"
                ),

            "forecast_end":
                (
                    base_date
                    +
                    pd.Timedelta(
                        days=days
                    )
                ).strftime(
                    "%Y-%m-%d"
                ),

            "forecast_days":
                days,

            "production_model":
                production_model,

            "total_predicted_demand":
                round(
                    float(
                        total_demand
                    ),
                    2
                ),

            "average_daily_demand":
                round(
                    float(
                        average_daily_demand
                    ),
                    2
                ),

            "maximum_daily_demand":
                round(
                    float(
                        maximum_daily_demand
                    ),
                    2
                ),

            "minimum_daily_demand":
                round(
                    float(
                        minimum_daily_demand
                    ),
                    2
                ),

            "total_predicted_revenue":
                round(
                    float(
                        total_predicted_revenue
                    ),
                    2
                ),

            "demand_trend":
                horizon_trend,

            "trend_change_percent":
                round(
                    float(
                        horizon_change
                    ),
                    2
                ),

            "confidence_score":
                0.0
        }


    # ========================================================
    # CONFIDENCE SCORE
    # ========================================================
    #
    # This is a heuristic stability indicator.
    # It is NOT a statistical confidence interval.
    #
    # ========================================================

    valid_values = [
        float(value)
        for value in daily_predictions
        if float(value) >= 0
    ]


    if valid_values:

        mean_forecast = (
            sum(valid_values)
            /
            len(valid_values)
        )


        if mean_forecast > 0:

            variation = (

                (
                    max(valid_values)
                    -
                    min(valid_values)
                )

                /

                mean_forecast

            )

        else:

            variation = 0.0

    else:

        variation = 0.0


    confidence = (
        100.0
        -
        variation * 100.0
    )


    confidence = max(
        50.0,
        min(
            confidence,
            95.0
        )
    )


    # ========================================================
    # APPLY CONFIDENCE TO ALL HORIZONS
    # ========================================================

    for horizon_name in forecasts:

        forecasts[
            horizon_name
        ][
            "confidence_score"
        ] = round(
            float(
                confidence
            ),
            2
        )


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        "current_demand":
            round(
                float(
                    current_prediction
                ),
                2
            ),

        "seven_days":
            forecasts[
                "7_days"
            ],

        "fourteen_days":
            forecasts[
                "14_days"
            ],

        "thirty_days":
            forecasts[
                "30_days"
            ],

        "three_months":
            forecasts[
                "3_months"
            ],

        "six_months":
            forecasts[
                "6_months"
            ],

        "twelve_months":
            forecasts[
                "12_months"
            ]

    }

