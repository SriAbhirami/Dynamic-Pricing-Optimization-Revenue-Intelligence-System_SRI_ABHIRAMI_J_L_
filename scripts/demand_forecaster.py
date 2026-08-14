# ============================================================
# DEMAND FORECASTING ENGINE
# ============================================================
#
# Purpose:
#   Generate short-term, medium-term and long-term
#   demand forecasts using the trained production model.
#
# Forecast horizons:
#   Short-term:
#       7 days
#       14 days
#       30 days
#
#   Medium-term:
#       3 months  (90 days)
#       6 months  (180 days)
#
#   Long-term:
#       12 months (365 days)
#
# IMPORTANT:
#   This engine is designed specifically for the actual
#   demand_forecasting_features.csv schema:
#
#   date
#   sales
#   revenue
#   avg_price
#   total_stock
#   active_products
#   active_stores
#   total_products
#   total_stores
#   calendar features
#   cyclical features
#   lag features
#   rolling features
#   volatility features
#   growth features
#   target_next_day_sales
#
# ============================================================

from pathlib import Path
import json
import warnings

import joblib
import numpy as np
import pandas as pd


warnings.filterwarnings("ignore")


# ============================================================
# PROJECT PATH SETUP
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]


DATA_FILE = (
    BASE_DIR
    / "datasets"
    / "processed"
    / "demand_forecasting_features.csv"
)


MODEL_DIR = (
    BASE_DIR
    / "models"
    / "demand_forecasting"
)


# Production model selected by train_demand_forecasting.py
MODEL_FILE = (
    MODEL_DIR
    / "demand_forecasting_model.joblib"
)


PREPROCESSOR_FILE = (
    MODEL_DIR
    / "demand_preprocessor.joblib"
)


METRICS_FILE = (
    MODEL_DIR
    / "model_metrics.json"
)


OUTPUT_DIR = (
    BASE_DIR
    / "datasets"
    / "forecasts"
)


OUTPUT_DIR.mkdir(
    parents=True,
    exist_ok=True
)


# ============================================================
# FORECAST HORIZONS
# ============================================================

FORECAST_HORIZONS = {

    "7_days": 7,

    "14_days": 14,

    "30_days": 30,

    "3_months": 90,

    "6_months": 180,

    "12_months": 365
}


# ============================================================
# TARGET
# ============================================================

TARGET_COLUMN = (
    "target_next_day_sales"
)


# ============================================================
# EXPECTED MODEL FEATURES
# ============================================================

EXPECTED_FEATURES = [

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
# FORECASTER
# ============================================================

class DemandForecaster:

    # ========================================================
    # INITIALIZATION
    # ========================================================

    def __init__(self):

        print("=" * 70)
        print("DEMAND FORECASTING ENGINE")
        print("=" * 70)

        self.data = None

        self.model = None

        self.preprocessor = None

        self.metrics = {}

        self.feature_columns = []

        self.latest_date = None

        self.history = None

        self.production_model_name = (
            "Unknown"
        )

        self._load_resources()

    # ========================================================
    # LOAD RESOURCES
    # ========================================================

    def _load_resources(self):

        print("\n" + "-" * 70)
        print("LOADING FORECASTING RESOURCES")
        print("-" * 70)

        # ----------------------------------------------------
        # Dataset
        # ----------------------------------------------------

        if not DATA_FILE.exists():

            raise FileNotFoundError(
                f"\nForecasting dataset not found:\n"
                f"{DATA_FILE}"
            )

        print(
            f"\nLoading dataset:\n"
            f"{DATA_FILE}"
        )

        self.data = pd.read_csv(
            DATA_FILE
        )

        # ----------------------------------------------------
        # Date
        # ----------------------------------------------------

        if "date" not in self.data.columns:

            raise ValueError(
                "Dataset does not contain 'date' column."
            )

        self.data["date"] = pd.to_datetime(
            self.data["date"],
            errors="coerce"
        )

        self.data = (
            self.data
            .dropna(
                subset=["date"]
            )
            .sort_values("date")
            .reset_index(drop=True)
        )

        print(
            f"Dataset rows: "
            f"{len(self.data):,}"
        )

        print(
            f"Dataset columns: "
            f"{len(self.data.columns):,}"
        )

        print(
            f"Date range: "
            f"{self.data['date'].min().date()} → "
            f"{self.data['date'].max().date()}"
        )

        # ----------------------------------------------------
        # Validate required raw columns
        # ----------------------------------------------------

        required_columns = [

            "sales",
            "revenue",
            "avg_price",
            "total_stock",

            "active_products",
            "active_stores",

            "total_products",
            "total_stores"
        ]

        missing_columns = [
            column
            for column in required_columns
            if column not in self.data.columns
        ]

        if missing_columns:

            raise ValueError(
                "\nDataset is missing required columns:\n"
                + "\n".join(
                    f"  - {column}"
                    for column in missing_columns
                )
            )

        # ----------------------------------------------------
        # Model
        # ----------------------------------------------------

        if not MODEL_FILE.exists():

            raise FileNotFoundError(
                f"\nProduction model not found:\n"
                f"{MODEL_FILE}"
            )

        print(
            f"\nLoading production model:\n"
            f"{MODEL_FILE}"
        )

        self.model = joblib.load(
            MODEL_FILE
        )

        # ----------------------------------------------------
        # Preprocessor
        # ----------------------------------------------------

        if not PREPROCESSOR_FILE.exists():

            raise FileNotFoundError(
                f"\nPreprocessor not found:\n"
                f"{PREPROCESSOR_FILE}"
            )

        print(
            f"\nLoading preprocessor:\n"
            f"{PREPROCESSOR_FILE}"
        )

        self.preprocessor = joblib.load(
            PREPROCESSOR_FILE
        )

        # ----------------------------------------------------
        # Metrics
        # ----------------------------------------------------

        if METRICS_FILE.exists():

            with open(
                METRICS_FILE,
                "r",
                encoding="utf-8"
            ) as file:

                self.metrics = json.load(
                    file
                )

            self.production_model_name = (
                self.metrics.get(
                    "best_model",
                    "Unknown"
                )
            )

        # ----------------------------------------------------
        # Feature columns
        # ----------------------------------------------------

        self.feature_columns = [

            column
            for column in self.data.columns
            if column not in [
                "date",
                TARGET_COLUMN
            ]
        ]

        print(
            f"\nForecasting features available: "
            f"{len(self.feature_columns)}"
        )

        # ----------------------------------------------------
        # Validate feature count
        # ----------------------------------------------------

        if len(self.feature_columns) != 50:

            print(
                "\nWARNING:"
            )

            print(
                "Expected 50 model features, "
                f"found {len(self.feature_columns)}."
            )

        # ----------------------------------------------------
        # Check expected features
        # ----------------------------------------------------

        missing_expected = [

            column
            for column in EXPECTED_FEATURES
            if column not in self.feature_columns
        ]

        if missing_expected:

            print(
                "\nWARNING: The following expected "
                "features are missing:"
            )

            for column in missing_expected:

                print(
                    f"  - {column}"
                )

        # ----------------------------------------------------
        # Latest date
        # ----------------------------------------------------

        self.latest_date = (
            self.data["date"].max()
        )

        # ----------------------------------------------------
        # History
        # ----------------------------------------------------

        self.history = (
            self.data
            .copy()
        )

        print(
            "\nForecasting resources loaded successfully."
        )

        print(
            f"Production model: "
            f"{self.production_model_name}"
        )

        print(
            f"Latest historical date: "
            f"{self.latest_date.date()}"
        )

    # ========================================================
    # SAFE LAST VALUE
    # ========================================================

    def _last_value(
        self,
        column,
        default=0.0
    ):

        if column not in self.history.columns:

            return float(default)

        series = (
            pd.to_numeric(
                self.history[column],
                errors="coerce"
            )
            .dropna()
        )

        if len(series) == 0:

            return float(default)

        return float(
            series.iloc[-1]
        )

    # ========================================================
    # HISTORY VALUES
    # ========================================================

    def _history_values(
        self,
        column
    ):

        if column not in self.history.columns:

            return []

        values = (
            pd.to_numeric(
                self.history[column],
                errors="coerce"
            )
            .dropna()
            .astype(float)
            .tolist()
        )

        return values

    # ========================================================
    # CALENDAR FEATURES
    # ========================================================

    @staticmethod
    def _calendar_features(
        date
    ):

        day_of_year = (
            date.timetuple().tm_yday
        )

        week_of_year = int(
            date.isocalendar().week
        )

        return {

            "day_of_week":
                int(date.dayofweek),

            "day_of_month":
                int(date.day),

            "week_of_year":
                week_of_year,

            "month":
                int(date.month),

            "quarter":
                int(date.quarter),

            "year":
                int(date.year),

            "day_of_year":
                int(day_of_year),

            "is_weekend":
                int(date.dayofweek >= 5)
        }

    # ========================================================
    # CYCLICAL FEATURES
    # ========================================================

    @staticmethod
    def _cyclical_features(
        date
    ):

        day_of_week = (
            date.dayofweek
        )

        month = (
            date.month
        )

        day_of_year = (
            date.timetuple().tm_yday
        )

        return {

            "dow_sin":
                np.sin(
                    2
                    * np.pi
                    * day_of_week
                    / 7
                ),

            "dow_cos":
                np.cos(
                    2
                    * np.pi
                    * day_of_week
                    / 7
                ),

            "month_sin":
                np.sin(
                    2
                    * np.pi
                    * month
                    / 12
                ),

            "month_cos":
                np.cos(
                    2
                    * np.pi
                    * month
                    / 12
                ),

            "day_of_year_sin":
                np.sin(
                    2
                    * np.pi
                    * day_of_year
                    / 365
                ),

            "day_of_year_cos":
                np.cos(
                    2
                    * np.pi
                    * day_of_year
                    / 365
                )
        }

    # ========================================================
    # ROLLING MEAN
    # ========================================================

    @staticmethod
    def _rolling_mean(
        values,
        window
    ):

        if not values:

            return 0.0

        return float(
            np.mean(
                values[-window:]
            )
        )

    # ========================================================
    # ROLLING STD
    # ========================================================

    @staticmethod
    def _rolling_std(
        values,
        window
    ):

        if not values:

            return 0.0

        return float(
            np.std(
                values[-window:]
            )
        )

    # ========================================================
    # GROWTH
    # ========================================================

    @staticmethod
    def _growth_percentage(
        values,
        recent_window
    ):

        if len(values) < (
            recent_window * 2
        ):

            return 0.0

        recent = np.mean(
            values[
                -recent_window:
            ]
        )

        previous = np.mean(
            values[
                -(
                    recent_window * 2
                ):
                -recent_window
            ]
        )

        if previous == 0:

            return 0.0

        return float(
            (
                (
                    recent
                    - previous
                )
                / abs(previous)
            )
            * 100
        )

    # ========================================================
    # CREATE FUTURE FEATURE ROW
    # ========================================================

    def _create_future_row(
        self,
        forecast_date
    ):
        """
        Construct one future model input row using the
        actual feature schema.
        """

        row = {}

        # ----------------------------------------------------
        # Current historical values
        # ----------------------------------------------------

        current_sales = (
            self._last_value(
                "sales"
            )
        )

        current_revenue = (
            self._last_value(
                "revenue"
            )
        )

        current_price = (
            self._last_value(
                "avg_price"
            )
        )

        current_stock = (
            self._last_value(
                "total_stock"
            )
        )

        current_active_products = (
            self._last_value(
                "active_products"
            )
        )

        current_active_stores = (
            self._last_value(
                "active_stores"
            )
        )

        current_total_products = (
            self._last_value(
                "total_products"
            )
        )

        current_total_stores = (
            self._last_value(
                "total_stores"
            )
        )

        # ----------------------------------------------------
        # Historical arrays
        # ----------------------------------------------------

        sales_values = (
            self._history_values(
                "sales"
            )
        )

        revenue_values = (
            self._history_values(
                "revenue"
            )
        )

        price_values = (
            self._history_values(
                "avg_price"
            )
        )

        stock_values = (
            self._history_values(
                "total_stock"
            )
        )

        # ----------------------------------------------------
        # Raw business features
        # ----------------------------------------------------

        row["sales"] = (
            current_sales
        )

        row["revenue"] = (
            current_revenue
        )

        row["avg_price"] = (
            current_price
        )

        row["total_stock"] = (
            current_stock
        )

        row["active_products"] = (
            current_active_products
        )

        row["active_stores"] = (
            current_active_stores
        )

        row["total_products"] = (
            current_total_products
        )

        row["total_stores"] = (
            current_total_stores
        )

        # ----------------------------------------------------
        # Calendar
        # ----------------------------------------------------

        row.update(
            self._calendar_features(
                forecast_date
            )
        )

        # ----------------------------------------------------
        # Cyclical
        # ----------------------------------------------------

        row.update(
            self._cyclical_features(
                forecast_date
            )
        )

        # ----------------------------------------------------
        # Sales lag features
        # ----------------------------------------------------

        row["sales_lag_1"] = (
            sales_values[-1]
            if len(sales_values) >= 1
            else current_sales
        )

        row["sales_lag_7"] = (
            sales_values[-7]
            if len(sales_values) >= 7
            else current_sales
        )

        row["sales_lag_14"] = (
            sales_values[-14]
            if len(sales_values) >= 14
            else current_sales
        )

        row["sales_lag_30"] = (
            sales_values[-30]
            if len(sales_values) >= 30
            else current_sales
        )

        row["sales_lag_90"] = (
            sales_values[-90]
            if len(sales_values) >= 90
            else current_sales
        )

        # ----------------------------------------------------
        # Revenue lag features
        # ----------------------------------------------------

        row["revenue_lag_1"] = (
            revenue_values[-1]
            if len(revenue_values) >= 1
            else current_revenue
        )

        row["revenue_lag_7"] = (
            revenue_values[-7]
            if len(revenue_values) >= 7
            else current_revenue
        )

        row["revenue_lag_30"] = (
            revenue_values[-30]
            if len(revenue_values) >= 30
            else current_revenue
        )

        # ----------------------------------------------------
        # Price features
        # ----------------------------------------------------

        previous_price = (
            price_values[-1]
            if len(price_values) >= 1
            else current_price
        )

        price_7 = (
            price_values[-7]
            if len(price_values) >= 7
            else current_price
        )

        row["price_lag_1"] = (
            previous_price
        )

        row["price_lag_7"] = (
            price_7
        )

        row["price_change"] = (
            current_price
            - previous_price
        )

        if previous_price != 0:

            row["price_change_pct"] = (

                (
                    current_price
                    - previous_price
                )
                / abs(previous_price)
            ) * 100

        else:

            row["price_change_pct"] = 0.0

        # ----------------------------------------------------
        # Stock features
        # ----------------------------------------------------

        previous_stock = (
            stock_values[-1]
            if len(stock_values) >= 1
            else current_stock
        )

        stock_7 = (
            stock_values[-7]
            if len(stock_values) >= 7
            else current_stock
        )

        row["stock_lag_1"] = (
            previous_stock
        )

        row["stock_lag_7"] = (
            stock_7
        )

        row["stock_change"] = (
            current_stock
            - previous_stock
        )

        if previous_stock != 0:

            row["stock_change_pct"] = (

                (
                    current_stock
                    - previous_stock
                )
                / abs(previous_stock)
            ) * 100

        else:

            row["stock_change_pct"] = 0.0

        row["stockout_flag"] = int(
            current_stock <= 0
        )

        # ----------------------------------------------------
        # Rolling sales
        # ----------------------------------------------------

        row["rolling_sales_7"] = (
            self._rolling_mean(
                sales_values,
                7
            )
        )

        row["rolling_sales_14"] = (
            self._rolling_mean(
                sales_values,
                14
            )
        )

        row["rolling_sales_30"] = (
            self._rolling_mean(
                sales_values,
                30
            )
        )

        row["rolling_sales_90"] = (
            self._rolling_mean(
                sales_values,
                90
            )
        )

        # ----------------------------------------------------
        # Sales volatility
        # ----------------------------------------------------

        row["sales_std_7"] = (
            self._rolling_std(
                sales_values,
                7
            )
        )

        row["sales_std_30"] = (
            self._rolling_std(
                sales_values,
                30
            )
        )

        # ----------------------------------------------------
        # Rolling revenue
        # ----------------------------------------------------

        row["rolling_revenue_7"] = (
            self._rolling_mean(
                revenue_values,
                7
            )
        )

        row["rolling_revenue_30"] = (
            self._rolling_mean(
                revenue_values,
                30
            )
        )

        # ----------------------------------------------------
        # Sales growth
        # ----------------------------------------------------

        row["sales_growth_7d"] = (
            self._growth_percentage(
                sales_values,
                7
            )
        )

        row["sales_growth_30d"] = (
            self._growth_percentage(
                sales_values,
                30
            )
        )

        # ----------------------------------------------------
        # Revenue per unit
        # ----------------------------------------------------

        if current_sales > 0:

            row["revenue_per_unit"] = (
                current_revenue
                / current_sales
            )

        else:

            row["revenue_per_unit"] = (
                current_price
            )

        # ----------------------------------------------------
        # Return
        # ----------------------------------------------------

        return row

    # ========================================================
    # COMPLETE FEATURE ROW
    # ========================================================

    def _prepare_feature_dataframe(
        self,
        row
    ):
        """
        Ensure the generated row exactly matches the training
        feature schema.
        """

        feature_df = pd.DataFrame(
            [row]
        )

        # ----------------------------------------------------
        # Add missing model features
        # ----------------------------------------------------

        for column in self.feature_columns:

            if column not in feature_df.columns:

                if column in self.history.columns:

                    value = (
                        self._last_value(
                            column
                        )
                    )

                else:

                    value = 0.0

                feature_df[column] = (
                    value
                )

        # ----------------------------------------------------
        # Remove unexpected columns
        # ----------------------------------------------------

        feature_df = feature_df[
            self.feature_columns
        ]

        # ----------------------------------------------------
        # Numeric conversion
        # ----------------------------------------------------

        for column in feature_df.columns:

            feature_df[column] = pd.to_numeric(
                feature_df[column],
                errors="coerce"
            )

        # ----------------------------------------------------
        # Replace invalid values
        # ----------------------------------------------------

        feature_df = (
            feature_df
            .replace(
                [np.inf, -np.inf],
                np.nan
            )
        )

        return feature_df

    # ========================================================
    # PREDICT SINGLE DAY
    # ========================================================

    def _predict_single_day(
        self,
        forecast_date
    ):

        # ----------------------------------------------------
        # Build future row
        # ----------------------------------------------------

        row = (
            self._create_future_row(
                forecast_date
            )
        )

        # ----------------------------------------------------
        # Prepare features
        # ----------------------------------------------------

        feature_df = (
            self._prepare_feature_dataframe(
                row
            )
        )

        # ----------------------------------------------------
        # Preprocess
        # ----------------------------------------------------

        processed = (
            self.preprocessor.transform(
                feature_df
            )
        )

        # ----------------------------------------------------
        # Predict
        # ----------------------------------------------------

        prediction = (
            self.model.predict(
                processed
            )
        )

        predicted_sales = float(
            prediction[0]
        )

        # ----------------------------------------------------
        # Prevent negative demand
        # ----------------------------------------------------

        predicted_sales = max(
            predicted_sales,
            0.0
        )

        return (
            predicted_sales,
            feature_df
        )

    # ========================================================
    # UPDATE HISTORY
    # ========================================================

    def _append_forecast_to_history(
        self,
        forecast_date,
        predicted_sales,
        feature_df
    ):
        """
        Append predicted sales to history so the next
        recursive prediction can use it.
        """

        # ----------------------------------------------------
        # Current price
        # ----------------------------------------------------

        current_price = (
            self._last_value(
                "avg_price"
            )
        )

        # ----------------------------------------------------
        # Predicted revenue
        # ----------------------------------------------------

        predicted_revenue = (
            predicted_sales
            * current_price
        )

        # ----------------------------------------------------
        # Start with model features
        # ----------------------------------------------------

        history_row = {}

        for column in self.data.columns:

            if column == "date":

                history_row[column] = (
                    forecast_date
                )

            elif column == TARGET_COLUMN:

                history_row[column] = (
                    np.nan
                )

            elif column == "sales":

                history_row[column] = (
                    predicted_sales
                )

            elif column == "revenue":

                history_row[column] = (
                    predicted_revenue
                )

            elif column in feature_df.columns:

                history_row[column] = (
                    feature_df[
                        column
                    ].iloc[0]
                )

            else:

                history_row[column] = (
                    self._last_value(
                        column
                    )
                )

        # ----------------------------------------------------
        # Append
        # ----------------------------------------------------

        new_row = pd.DataFrame(
            [history_row]
        )

        self.history = pd.concat(
            [
                self.history,
                new_row
            ],
            ignore_index=True
        )

    # ========================================================
    # FORECAST
    # ========================================================

    def forecast(
        self,
        horizon_days
    ):
        """
        Generate recursive forecast for the requested number
        of days.
        """

        if horizon_days <= 0:

            raise ValueError(
                "Forecast horizon must be greater than zero."
            )

        print("\n" + "-" * 70)

        print(
            f"Generating {horizon_days}-day forecast"
        )

        print("-" * 70)

        # ----------------------------------------------------
        # Reset history
        # ----------------------------------------------------

        self.history = (
            self.data.copy()
        )

        forecasts = []

        # ----------------------------------------------------
        # Future dates
        # ----------------------------------------------------

        future_dates = pd.date_range(

            start=(
                self.latest_date
                + pd.Timedelta(days=1)
            ),

            periods=horizon_days,

            freq="D"
        )

        # ----------------------------------------------------
        # Recursive prediction
        # ----------------------------------------------------

        for index, forecast_date in enumerate(
            future_dates,
            start=1
        ):

            predicted_sales, feature_df = (
                self._predict_single_day(
                    forecast_date
                )
            )

            # ------------------------------------------------
            # Current price
            # ------------------------------------------------

            current_price = (
                self._last_value(
                    "avg_price"
                )
            )

            # ------------------------------------------------
            # Predicted revenue
            # ------------------------------------------------

            predicted_revenue = (
                predicted_sales
                * current_price
            )

            # ------------------------------------------------
            # Save result
            # ------------------------------------------------

            forecasts.append({

                "date":
                    forecast_date,

                "predicted_sales":
                    predicted_sales,

                "predicted_revenue":
                    predicted_revenue,

                "avg_price":
                    current_price
            })

            # ------------------------------------------------
            # Update history
            # ------------------------------------------------

            self._append_forecast_to_history(

                forecast_date,

                predicted_sales,

                feature_df
            )

            # ------------------------------------------------
            # Progress
            # ------------------------------------------------

            if (

                index == 1

                or index % 30 == 0

                or index == horizon_days
            ):

                print(

                    f"Day {index:>3}/"
                    f"{horizon_days}: "

                    f"{forecast_date.date()} → "

                    f"{predicted_sales:,.2f} "
                    f"sales"
                )

        # ----------------------------------------------------
        # DataFrame
        # ----------------------------------------------------

        forecast_df = pd.DataFrame(
            forecasts
        )

        return forecast_df

    # ========================================================
    # CONFIDENCE SCORE
    # ========================================================

    def calculate_confidence(
        self,
        forecast_df
    ):
        """
        Business-oriented confidence estimate.

        This is NOT a statistical prediction interval.

        Base confidence:
            100 - test WAPE

        Longer horizons receive a conservative penalty.
        """

        # ----------------------------------------------------
        # Obtain WAPE
        # ----------------------------------------------------

        models = (
            self.metrics.get(
                "models",
                {}
            )
        )

        production_metrics = (
            models.get(
                self.production_model_name,
                {}
            )
        )

        wape = (
            production_metrics.get(
                "test_wape_percent",
                None
            )
        )

        # Fallback
        if wape is None:

            wape = 12.74

        # ----------------------------------------------------
        # Base confidence
        # ----------------------------------------------------

        confidence = (
            100
            - float(wape)
        )

        confidence = max(
            0,
            min(
                100,
                confidence
            )
        )

        # ----------------------------------------------------
        # Horizon factor
        # ----------------------------------------------------

        horizon_days = (
            len(forecast_df)
        )

        if horizon_days <= 7:

            factor = 1.00

        elif horizon_days <= 30:

            factor = 0.95

        elif horizon_days <= 90:

            factor = 0.85

        elif horizon_days <= 180:

            factor = 0.75

        else:

            factor = 0.65

        confidence *= factor

        return round(
            confidence,
            2
        )

    # ========================================================
    # TREND ANALYSIS
    # ========================================================

    @staticmethod
    def analyze_trend(
        forecast_df
    ):
        """
        Determine whether forecast demand is increasing,
        decreasing or stable.
        """

        if len(forecast_df) < 2:

            return "STABLE"

        values = (
            forecast_df[
                "predicted_sales"
            ]
            .astype(float)
            .values
        )

        third = max(
            1,
            len(values) // 3
        )

        first_period = np.mean(
            values[
                :third
            ]
        )

        last_period = np.mean(
            values[
                -third:
            ]
        )

        if first_period == 0:

            return "STABLE"

        percentage_change = (

            (
                last_period
                - first_period
            )
            / abs(first_period)

        ) * 100

        if percentage_change > 5:

            return "INCREASING"

        if percentage_change < -5:

            return "DECREASING"

        return "STABLE"

    # ========================================================
    # TREND PERCENTAGE
    # ========================================================

    @staticmethod
    def calculate_trend_percentage(
        forecast_df
    ):

        if len(forecast_df) < 2:

            return 0.0

        values = (
            forecast_df[
                "predicted_sales"
            ]
            .astype(float)
            .values
        )

        third = max(
            1,
            len(values) // 3
        )

        first_period = np.mean(
            values[
                :third
            ]
        )

        last_period = np.mean(
            values[
                -third:
            ]
        )

        if first_period == 0:

            return 0.0

        return float(

            (
                (
                    last_period
                    - first_period
                )
                / abs(first_period)
            )
            * 100
        )

    # ========================================================
    # SUMMARY
    # ========================================================

    def create_summary(
        self,
        forecast_df,
        horizon_name
    ):

        total_demand = (
            forecast_df[
                "predicted_sales"
            ]
            .sum()
        )

        total_revenue = (
            forecast_df[
                "predicted_revenue"
            ]
            .sum()
        )

        average_daily_demand = (
            forecast_df[
                "predicted_sales"
            ]
            .mean()
        )

        maximum_daily_demand = (
            forecast_df[
                "predicted_sales"
            ]
            .max()
        )

        minimum_daily_demand = (
            forecast_df[
                "predicted_sales"
            ]
            .min()
        )

        trend = (
            self.analyze_trend(
                forecast_df
            )
        )

        trend_percentage = (
            self.calculate_trend_percentage(
                forecast_df
            )
        )

        confidence = (
            self.calculate_confidence(
                forecast_df
            )
        )

        summary = {

            "forecast_horizon":
                horizon_name,

            "forecast_start":
                str(
                    forecast_df[
                        "date"
                    ].min().date()
                ),

            "forecast_end":
                str(
                    forecast_df[
                        "date"
                    ].max().date()
                ),

            "forecast_days":
                int(
                    len(forecast_df)
                ),

            "production_model":
                self.production_model_name,

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
                        total_revenue
                    ),
                    2
                ),

            "demand_trend":
                trend,

            "trend_change_percent":
                round(
                    trend_percentage,
                    2
                ),

            "confidence_score":
                confidence
        }

        return summary

    # ========================================================
    # SAVE FORECAST
    # ========================================================

    def save_forecast(
        self,
        forecast_df,
        horizon_name
    ):

        output_file = (
            OUTPUT_DIR
            / (
                "demand_forecast_"
                f"{horizon_name}.csv"
            )
        )

        forecast_df.to_csv(
            output_file,
            index=False
        )

        print(
            f"\nForecast saved:"
        )

        print(
            output_file
        )

        return output_file

    # ========================================================
    # GENERATE ALL FORECASTS
    # ========================================================

    def generate_all_forecasts(
        self
    ):

        print("\n" + "=" * 70)
        print("GENERATING ALL FORECAST HORIZONS")
        print("=" * 70)

        all_summaries = {}

        for horizon_name, horizon_days in (
            FORECAST_HORIZONS.items()
        ):

            print("\n" + "=" * 70)

            print(
                f"HORIZON: "
                f"{horizon_name.upper()}"
            )

            print("=" * 70)

            # ------------------------------------------------
            # Forecast
            # ------------------------------------------------

            forecast_df = (
                self.forecast(
                    horizon_days
                )
            )

            # ------------------------------------------------
            # Summary
            # ------------------------------------------------

            summary = (
                self.create_summary(
                    forecast_df,
                    horizon_name
                )
            )

            # ------------------------------------------------
            # Save
            # ------------------------------------------------

            self.save_forecast(
                forecast_df,
                horizon_name
            )

            all_summaries[
                horizon_name
            ] = summary

            # ------------------------------------------------
            # Display
            # ------------------------------------------------

            print(
                "\nForecast Summary:"
            )

            print(
                f"Total predicted demand : "
                f"{summary['total_predicted_demand']:,.2f}"
            )

            print(
                f"Average daily demand   : "
                f"{summary['average_daily_demand']:,.2f}"
            )

            print(
                f"Total predicted revenue: "
                f"{summary['total_predicted_revenue']:,.2f}"
            )

            print(
                f"Demand trend           : "
                f"{summary['demand_trend']}"
            )

            print(
                f"Trend change           : "
                f"{summary['trend_change_percent']:.2f}%"
            )

            print(
                f"Confidence score       : "
                f"{summary['confidence_score']:.2f}%"
            )

        # ====================================================
        # SAVE COMBINED SUMMARY
        # ====================================================

        summary_file = (
            OUTPUT_DIR
            / "forecast_summary.json"
        )

        with open(
            summary_file,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                all_summaries,
                file,
                indent=4
            )

        print("\n" + "=" * 70)
        print("ALL FORECASTS COMPLETED")
        print("=" * 70)

        print(
            f"\nSummary saved:"
        )

        print(
            summary_file
        )

        return all_summaries


# ============================================================
# MAIN
# ============================================================

def main():

    try:

        forecaster = (
            DemandForecaster()
        )

        summaries = (
            forecaster
            .generate_all_forecasts()
        )

        # ----------------------------------------------------
        # Final report
        # ----------------------------------------------------

        print("\n" + "=" * 70)
        print(
            "DEMAND FORECASTING ENGINE COMPLETED"
        )
        print("=" * 70)

        print(
            "\nProduction model:"
        )

        print(
            f"  {forecaster.production_model_name}"
        )

        print(
            "\nAvailable forecasts:"
        )

        for horizon_name, summary in (
            summaries.items()
        ):

            print(
                f"\n{horizon_name}"
            )

            print(
                f"  Period: "
                f"{summary['forecast_start']} → "
                f"{summary['forecast_end']}"
            )

            print(
                f"  Demand: "
                f"{summary['total_predicted_demand']:,.2f}"
            )

            print(
                f"  Revenue: "
                f"{summary['total_predicted_revenue']:,.2f}"
            )

            print(
                f"  Trend: "
                f"{summary['demand_trend']}"
            )

            print(
                f"  Trend change: "
                f"{summary['trend_change_percent']:.2f}%"
            )

            print(
                f"  Confidence: "
                f"{summary['confidence_score']:.2f}%"
            )

        print(
            "\nForecast files are available in:"
        )

        print(
            OUTPUT_DIR
        )

        print("\n" + "=" * 70)

    except Exception as e:

        print("\n" + "=" * 70)
        print("FORECASTING ERROR")
        print("=" * 70)

        print(
            f"\n{type(e).__name__}: {e}"
        )

        raise


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    main()