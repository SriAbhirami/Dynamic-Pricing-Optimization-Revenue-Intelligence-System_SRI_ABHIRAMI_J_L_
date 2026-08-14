# ============================================================
# DEMAND FORECASTING - DAILY DATA PREPARATION
# ============================================================

import sys
from pathlib import Path

import pandas as pd
import numpy as np
from sqlalchemy import text


# ============================================================
# PROJECT PATH SETUP
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[1]

BACKEND_DIR = BASE_DIR / "backend"

sys.path.insert(0, str(BACKEND_DIR))


# ============================================================
# DATABASE
# ============================================================

from app.database.database import engine


# ============================================================
# OUTPUT
# ============================================================

PROCESSED_DIR = (
    BASE_DIR
    / "datasets"
    / "processed"
)

PROCESSED_DIR.mkdir(
    parents=True,
    exist_ok=True
)

OUTPUT_FILE = (
    PROCESSED_DIR
    / "demand_forecasting_features.csv"
)


# ============================================================
# HISTORICAL DATA CUTOFF
# ============================================================
#
# Your validated historical data ends on:
#
# 2019-10-31
#
# From 2019-11-01 onward the dataset contains zero sales
# and zero revenue. We do NOT want the forecasting model
# to learn those artificial zero-demand records.
#
# ============================================================

FORECAST_DATA_END = "2019-10-31"


# ============================================================
# MAIN
# ============================================================

def prepare_demand_data():

    print("=" * 75)
    print("DEMAND FORECASTING - DAILY DATA PREPARATION")
    print("=" * 75)

    print(
        f"\nHistorical cutoff: {FORECAST_DATA_END}"
    )

    print(
        f"Output file:\n{OUTPUT_FILE}"
    )


    # ========================================================
    # STEP 1 - DATABASE CONNECTION
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 1: Checking database connection")
    print("-" * 75)

    try:

        with engine.connect() as connection:

            result = connection.execute(
                text(
                    """
                    SELECT COUNT(*)
                    FROM historical_sales
                    """
                )
            )

            total_rows = result.scalar()

        print(
            f"Historical sales rows: {total_rows:,}"
        )

    except Exception as e:

        print("\nERROR: Database connection failed.")
        print(e)

        return


    # ========================================================
    # STEP 2 - CREATE DAILY BUSINESS AGGREGATION
    # ========================================================
    #
    # IMPORTANT:
    #
    # We aggregate directly in PostgreSQL.
    #
    # We DO NOT load 19.45 million rows into pandas.
    #
    # PostgreSQL performs the heavy aggregation and returns
    # only approximately 1,033 daily records.
    #
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 2: Creating daily business aggregation")
    print("-" * 75)

    query = """
        SELECT
            date,

            SUM(sales) AS sales,

            SUM(revenue) AS revenue,

            AVG(
                CASE
                    WHEN price > 0
                    THEN price
                END
            ) AS avg_price,

            SUM(stock) AS total_stock,

            COUNT(
                DISTINCT product_id
            ) FILTER (
                WHERE sales > 0
            ) AS active_products,

            COUNT(
                DISTINCT store_id
            ) FILTER (
                WHERE sales > 0
            ) AS active_stores,

            COUNT(
                DISTINCT product_id
            ) AS total_products,

            COUNT(
                DISTINCT store_id
            ) AS total_stores

        FROM historical_sales

        WHERE date <= :end_date

        GROUP BY date

        ORDER BY date
    """


    try:

        with engine.connect() as connection:

            df = pd.read_sql_query(
                text(query),
                connection,
                params={
                    "end_date": FORECAST_DATA_END
                }
            )

    except Exception as e:

        print(
            "\nERROR while creating daily aggregation."
        )

        print(e)

        return


    print(
        f"\nDaily records created: {len(df):,}"
    )


    # ========================================================
    # STEP 3 - BASIC DATA CLEANING
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 3: Cleaning daily data")
    print("-" * 75)

    df["date"] = pd.to_datetime(
        df["date"],
        errors="coerce"
    )

    numeric_columns = [
        "sales",
        "revenue",
        "avg_price",
        "total_stock",
        "active_products",
        "active_stores",
        "total_products",
        "total_stores"
    ]

    for column in numeric_columns:

        df[column] = pd.to_numeric(
            df[column],
            errors="coerce"
        )

        df[column] = (
            df[column]
            .replace(
                [np.inf, -np.inf],
                np.nan
            )
            .fillna(0)
        )


    df = df.dropna(
        subset=["date"]
    )


    # ========================================================
    # STEP 4 - SORT BY DATE
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 4: Sorting daily data")
    print("-" * 75)

    df = (
        df.sort_values("date")
        .reset_index(drop=True)
    )


    # ========================================================
    # STEP 5 - CALENDAR FEATURES
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 5: Creating calendar features")
    print("-" * 75)

    df["day_of_week"] = (
        df["date"].dt.dayofweek
    )

    df["day_of_month"] = (
        df["date"].dt.day
    )

    df["week_of_year"] = (
        df["date"]
        .dt.isocalendar()
        .week
        .astype(int)
    )

    df["month"] = (
        df["date"].dt.month
    )

    df["quarter"] = (
        df["date"].dt.quarter
    )

    df["year"] = (
        df["date"].dt.year
    )

    df["day_of_year"] = (
        df["date"].dt.dayofyear
    )

    df["is_weekend"] = (
        df["day_of_week"] >= 5
    ).astype(int)


    # ========================================================
    # STEP 6 - CYCLICAL CALENDAR FEATURES
    # ========================================================
    #
    # These allow the model to understand that:
    #
    # December and January are close in yearly seasonality.
    #
    # Sunday and Monday are also adjacent in weekly cycles.
    #
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 6: Creating cyclical seasonal features")
    print("-" * 75)

    df["dow_sin"] = np.sin(
        2 * np.pi * df["day_of_week"] / 7
    )

    df["dow_cos"] = np.cos(
        2 * np.pi * df["day_of_week"] / 7
    )

    df["month_sin"] = np.sin(
        2 * np.pi * df["month"] / 12
    )

    df["month_cos"] = np.cos(
        2 * np.pi * df["month"] / 12
    )

    df["day_of_year_sin"] = np.sin(
        2 * np.pi * df["day_of_year"] / 365.25
    )

    df["day_of_year_cos"] = np.cos(
        2 * np.pi * df["day_of_year"] / 365.25
    )


    # ========================================================
    # STEP 7 - SALES LAG FEATURES
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 7: Creating sales lag features")
    print("-" * 75)

    df["sales_lag_1"] = (
        df["sales"].shift(1)
    )

    df["sales_lag_7"] = (
        df["sales"].shift(7)
    )

    df["sales_lag_14"] = (
        df["sales"].shift(14)
    )

    df["sales_lag_30"] = (
        df["sales"].shift(30)
    )

    df["sales_lag_90"] = (
        df["sales"].shift(90)
    )


    # ========================================================
    # STEP 8 - REVENUE LAG FEATURES
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 8: Creating revenue lag features")
    print("-" * 75)

    df["revenue_lag_1"] = (
        df["revenue"].shift(1)
    )

    df["revenue_lag_7"] = (
        df["revenue"].shift(7)
    )

    df["revenue_lag_30"] = (
        df["revenue"].shift(30)
    )


    # ========================================================
    # STEP 9 - PRICE LAG FEATURES
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 9: Creating price features")
    print("-" * 75)

    df["price_lag_1"] = (
        df["avg_price"].shift(1)
    )

    df["price_lag_7"] = (
        df["avg_price"].shift(7)
    )

    df["price_change"] = (
        df["avg_price"]
        - df["price_lag_1"]
    )

    df["price_change_pct"] = np.where(
        df["price_lag_1"] > 0,

        (
            (
                df["avg_price"]
                - df["price_lag_1"]
            )
            / df["price_lag_1"]
        ) * 100,

        0
    )


    # ========================================================
    # STEP 10 - STOCK FEATURES
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 10: Creating inventory features")
    print("-" * 75)

    df["stock_lag_1"] = (
        df["total_stock"].shift(1)
    )

    df["stock_lag_7"] = (
        df["total_stock"].shift(7)
    )

    df["stock_change"] = (
        df["total_stock"]
        - df["stock_lag_1"]
    )

    df["stock_change_pct"] = np.where(
        df["stock_lag_1"] > 0,

        (
            (
                df["total_stock"]
                - df["stock_lag_1"]
            )
            / df["stock_lag_1"]
        ) * 100,

        0
    )

    df["stockout_flag"] = (
        df["total_stock"] <= 0
    ).astype(int)


    # ========================================================
    # STEP 11 - ROLLING SALES FEATURES
    # ========================================================
    #
    # shift(1) is essential.
    #
    # It prevents today's sales from leaking into today's
    # features.
    #
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 11: Creating rolling sales features")
    print("-" * 75)

    shifted_sales = (
        df["sales"].shift(1)
    )

    df["rolling_sales_7"] = (
        shifted_sales
        .rolling(
            window=7,
            min_periods=3
        )
        .mean()
    )

    df["rolling_sales_14"] = (
        shifted_sales
        .rolling(
            window=14,
            min_periods=7
        )
        .mean()
    )

    df["rolling_sales_30"] = (
        shifted_sales
        .rolling(
            window=30,
            min_periods=15
        )
        .mean()
    )

    df["rolling_sales_90"] = (
        shifted_sales
        .rolling(
            window=90,
            min_periods=30
        )
        .mean()
    )


    # ========================================================
    # STEP 12 - SALES VOLATILITY
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 12: Creating demand volatility features")
    print("-" * 75)

    df["sales_std_7"] = (
        shifted_sales
        .rolling(
            window=7,
            min_periods=3
        )
        .std()
    )

    df["sales_std_30"] = (
        shifted_sales
        .rolling(
            window=30,
            min_periods=15
        )
        .std()
    )


    # ========================================================
    # STEP 13 - ROLLING REVENUE
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 13: Creating rolling revenue features")
    print("-" * 75)

    shifted_revenue = (
        df["revenue"].shift(1)
    )

    df["rolling_revenue_7"] = (
        shifted_revenue
        .rolling(
            window=7,
            min_periods=3
        )
        .mean()
    )

    df["rolling_revenue_30"] = (
        shifted_revenue
        .rolling(
            window=30,
            min_periods=15
        )
        .mean()
    )


    # ========================================================
    # STEP 14 - DEMAND TREND FEATURES
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 14: Creating demand trend features")
    print("-" * 75)

    df["sales_growth_7d"] = np.where(
        df["sales_lag_7"] > 0,

        (
            (
                df["sales_lag_1"]
                - df["sales_lag_7"]
            )
            / df["sales_lag_7"]
        ) * 100,

        0
    )

    df["sales_growth_30d"] = np.where(
        df["sales_lag_30"] > 0,

        (
            (
                df["sales_lag_1"]
                - df["sales_lag_30"]
            )
            / df["sales_lag_30"]
        ) * 100,

        0
    )


    # ========================================================
    # STEP 15 - REVENUE PER UNIT
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 15: Creating revenue efficiency features")
    print("-" * 75)

    df["revenue_per_unit"] = np.where(
        df["sales"] > 0,

        df["revenue"] / df["sales"],

        0
    )


    # ========================================================
    # STEP 16 - TARGET
    # ========================================================
    #
    # For the first model:
    #
    # Predict next-day sales.
    #
    # IMPORTANT:
    #
    # We use the business-level daily series.
    #
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 16: Creating forecasting target")
    print("-" * 75)

    df["target_next_day_sales"] = (
        df["sales"].shift(-1)
    )


    # ========================================================
    # STEP 17 - REMOVE TARGET-UNAVAILABLE ROW
    # ========================================================

    before = len(df)

    df = df.dropna(
        subset=[
            "target_next_day_sales"
        ]
    )

    print(
        f"Rows removed: {before - len(df):,}"
    )


    # ========================================================
    # STEP 18 - HANDLE WARM-UP FEATURES
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 18: Handling warm-up periods")
    print("-" * 75)

    df = df.replace(
        [np.inf, -np.inf],
        np.nan
    )

    numeric_columns = (
        df.select_dtypes(
            include=[np.number]
        )
        .columns
    )

    df[numeric_columns] = (
        df[numeric_columns]
        .fillna(0)
    )


    # ========================================================
    # STEP 19 - FINAL COLUMN ORDER
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 19: Organizing final dataset")
    print("-" * 75)

    column_order = [

        # Date
        "date",

        # Main business metrics
        "sales",
        "revenue",
        "avg_price",
        "total_stock",

        # Business coverage
        "active_products",
        "active_stores",
        "total_products",
        "total_stores",

        # Calendar
        "day_of_week",
        "day_of_month",
        "week_of_year",
        "month",
        "quarter",
        "year",
        "day_of_year",
        "is_weekend",

        # Cyclical
        "dow_sin",
        "dow_cos",
        "month_sin",
        "month_cos",
        "day_of_year_sin",
        "day_of_year_cos",

        # Sales lags
        "sales_lag_1",
        "sales_lag_7",
        "sales_lag_14",
        "sales_lag_30",
        "sales_lag_90",

        # Revenue lags
        "revenue_lag_1",
        "revenue_lag_7",
        "revenue_lag_30",

        # Price
        "price_lag_1",
        "price_lag_7",
        "price_change",
        "price_change_pct",

        # Stock
        "stock_lag_1",
        "stock_lag_7",
        "stock_change",
        "stock_change_pct",
        "stockout_flag",

        # Rolling sales
        "rolling_sales_7",
        "rolling_sales_14",
        "rolling_sales_30",
        "rolling_sales_90",

        # Volatility
        "sales_std_7",
        "sales_std_30",

        # Rolling revenue
        "rolling_revenue_7",
        "rolling_revenue_30",

        # Trend
        "sales_growth_7d",
        "sales_growth_30d",

        # Revenue efficiency
        "revenue_per_unit",

        # Target
        "target_next_day_sales"
    ]


    df = df[
        [
            column
            for column in column_order
            if column in df.columns
        ]
    ]


    # ========================================================
    # STEP 20 - SAVE
    # ========================================================

    print("\n" + "-" * 75)
    print("STEP 20: Saving forecasting dataset")
    print("-" * 75)

    df.to_csv(
        OUTPUT_FILE,
        index=False
    )


    # ========================================================
    # FINAL VALIDATION
    # ========================================================

    print("\n" + "=" * 75)
    print("DEMAND FORECASTING DATA PREPARATION COMPLETED")
    print("=" * 75)

    print(
        f"\nRows              : {len(df):,}"
    )

    print(
        f"Columns           : {len(df.columns):,}"
    )

    print(
        f"Date range        : "
        f"{df['date'].min().date()} → "
        f"{df['date'].max().date()}"
    )

    print(
        f"\nAverage sales     : "
        f"{df['sales'].mean():,.2f}"
    )

    print(
        f"Maximum sales     : "
        f"{df['sales'].max():,.2f}"
    )

    print(
        f"Minimum sales     : "
        f"{df['sales'].min():,.2f}"
    )

    print(
        f"\nTotal sales       : "
        f"{df['sales'].sum():,.2f}"
    )

    print(
        f"Total revenue     : "
        f"{df['revenue'].sum():,.2f}"
    )

    print(
        f"\nStockout days     : "
        f"{df['stockout_flag'].sum():,}"
    )

    print(
        f"\nOutput saved to:"
    )

    print(
        OUTPUT_FILE
    )

    print("\n" + "=" * 75)


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    prepare_demand_data()