import sys
from pathlib import Path

import pandas as pd
from sqlalchemy.orm import Session


# ============================================================
# PROJECT PATHS
# ============================================================

PROJECT_ROOT = Path(__file__).resolve().parents[1]

BACKEND_ROOT = (
    PROJECT_ROOT
    / "backend"
)


# ============================================================
# PYTHON PATH
# ============================================================

# Your FastAPI application imports modules as:
#
#     from app.models...
#
# Therefore the backend directory must be on sys.path.

if str(BACKEND_ROOT) not in sys.path:

    sys.path.insert(
        0,
        str(BACKEND_ROOT)
    )


# ============================================================
# IMPORT DATABASE
# ============================================================

from app.database.database import (
    SessionLocal,
    engine,
    Base
)

from app.models.seasonal_sales import (
    SeasonalSales
)


# ============================================================
# CSV LOCATION
# ============================================================

CSV_PATH = (

    PROJECT_ROOT
    / "datasets"
    / "raw"
    / "ecommerce_sales_34500.csv"

)


# ============================================================
# BATCH SIZE
# ============================================================

BATCH_SIZE = 1000


# ============================================================
# MAIN LOADER
# ============================================================

def load_seasonal_sales():

    print()

    print("=" * 60)

    print(
        "SEASONAL SALES DATA LOADER"
    )

    print("=" * 60)

    print()


    # ========================================================
    # CHECK CSV
    # ========================================================

    if not CSV_PATH.exists():

        print(
            "ERROR: CSV file not found:"
        )

        print(
            CSV_PATH
        )

        print()

        print(
            "Expected location:"
        )

        print(
            "datasets/raw/ecommerce_sales_34500.csv"
        )

        return


    print(
        "Reading CSV:"
    )

    print(
        CSV_PATH
    )

    print()


    # ========================================================
    # READ CSV
    # ========================================================

    df = pd.read_csv(
        CSV_PATH
    )


    print(
        f"Rows found: {len(df):,}"
    )

    print(
        f"Columns found: {len(df.columns)}"
    )

    print()


    # ========================================================
    # REQUIRED COLUMNS
    # ========================================================

    required_columns = [

        "order_id",
        "customer_id",
        "product_id",
        "category",
        "price",
        "discount",
        "quantity",
        "payment_method",
        "order_date",
        "delivery_time_days",
        "region",
        "returned",
        "total_amount",
        "shipping_cost",
        "profit_margin",
        "customer_age",
        "customer_gender"

    ]


    missing_columns = [

        column

        for column in required_columns

        if column not in df.columns

    ]


    if missing_columns:

        print(
            "ERROR: Missing required columns:"
        )

        for column in missing_columns:

            print(
                f"  - {column}"
            )

        return


    # ========================================================
    # DATE CONVERSION
    # ========================================================

    df["order_date"] = pd.to_datetime(

        df["order_date"],

        errors="coerce"

    )


    invalid_dates = (
        df["order_date"]
        .isna()
        .sum()
    )


    if invalid_dates > 0:

        print(
            f"WARNING: {invalid_dates:,} rows "
            "have invalid dates and will be skipped."
        )

        df = df[
            df["order_date"].notna()
        ]


    # ========================================================
    # NUMERIC COLUMNS
    # ========================================================

    numeric_columns = [

        "price",
        "discount",
        "quantity",
        "total_amount",
        "shipping_cost",
        "profit_margin",
        "customer_age",
        "delivery_time_days"

    ]


    for column in numeric_columns:

        df[column] = pd.to_numeric(

            df[column],

            errors="coerce"

        )


    # ========================================================
    # FILL REQUIRED NUMERIC NULLS
    # ========================================================

    for column in [

        "price",
        "discount",
        "quantity",
        "total_amount",
        "shipping_cost",
        "profit_margin"

    ]:

        df[column] = (
            df[column]
            .fillna(0)
        )


    # ========================================================
    # OPTIONAL NUMERIC FIELDS
    # ========================================================

    df["customer_age"] = (

        df["customer_age"]
        .fillna(0)

    )


    df["delivery_time_days"] = (

        df["delivery_time_days"]
        .fillna(0)

    )


    # ========================================================
    # STRING COLUMNS
    # ========================================================

    string_columns = [

        "order_id",
        "customer_id",
        "product_id",
        "category",
        "payment_method",
        "region",
        "returned",
        "customer_gender"

    ]


    for column in string_columns:

        df[column] = (

            df[column]
            .fillna("")
            .astype(str)
            .str.strip()

        )


    # ========================================================
    # REMOVE EMPTY CATEGORIES
    # ========================================================

    df = df[
        df["category"] != ""
    ]


    print(
        f"Valid rows after cleaning: {len(df):,}"
    )

    print()


    # ========================================================
    # DATE RANGE
    # ========================================================

    print(
        "Date range:"
    )

    print(

        f"  {df['order_date'].min().date()} "
        f"→ "
        f"{df['order_date'].max().date()}"

    )

    print()


    # ========================================================
    # CATEGORY SUMMARY
    # ========================================================

    print(
        "Categories:"
    )


    category_counts = (

        df["category"]
        .value_counts()
        .sort_index()

    )


    for category, count in category_counts.items():

        print(

            f"  {category:<20}"
            f"{count:>8,}"

        )


    print()


    # ========================================================
    # CREATE TABLE
    # ========================================================

    print(
        "Checking database table..."
    )


    Base.metadata.create_all(
        bind=engine
    )


    # ========================================================
    # DATABASE SESSION
    # ========================================================

    db: Session = SessionLocal()


    try:

        # ====================================================
        # CHECK EXISTING RECORDS
        # ====================================================

        existing_count = (

            db.query(
                SeasonalSales
            ).count()

        )


        if existing_count > 0:

            print(

                f"Existing seasonal records found: "
                f"{existing_count:,}"

            )

            print(
                "Clearing previous seasonal dataset..."
            )


            db.query(
                SeasonalSales
            ).delete(

                synchronize_session=False

            )


            db.commit()


            print(
                "Previous seasonal data removed."
            )

            print()


        # ====================================================
        # INSERT DATA
        # ====================================================

        print(
            "Loading records into PostgreSQL..."
        )

        print()


        records = []

        inserted = 0


        for _, row in df.iterrows():

            record = SeasonalSales(

                order_id=row[
                    "order_id"
                ],

                order_date=row[
                    "order_date"
                ].date(),

                customer_id=row[
                    "customer_id"
                ],

                customer_age=int(
                    row["customer_age"]
                ),

                customer_gender=row[
                    "customer_gender"
                ],

                product_id=row[
                    "product_id"
                ],

                category=row[
                    "category"
                ],

                price=float(
                    row["price"]
                ),

                discount=float(
                    row["discount"]
                ),

                quantity=float(
                    row["quantity"]
                ),

                total_amount=float(
                    row["total_amount"]
                ),

                profit_margin=float(
                    row["profit_margin"]
                ),

                payment_method=row[
                    "payment_method"
                ],

                region=row[
                    "region"
                ],

                delivery_time_days=int(
                    row["delivery_time_days"]
                ),

                returned=row[
                    "returned"
                ],

                shipping_cost=float(
                    row["shipping_cost"]
                )

            )


            records.append(
                record
            )


            # =================================================
            # BATCH INSERT
            # =================================================

            if len(records) >= BATCH_SIZE:

                db.bulk_save_objects(
                    records
                )

                db.commit()


                inserted += len(
                    records
                )


                print(

                    f"  Inserted: "
                    f"{inserted:,} / "
                    f"{len(df):,}"

                )


                records = []


        # ====================================================
        # REMAINING RECORDS
        # ====================================================

        if records:

            db.bulk_save_objects(
                records
            )

            db.commit()


            inserted += len(
                records
            )


        # ====================================================
        # VERIFY DATABASE
        # ====================================================

        database_count = (

            db.query(
                SeasonalSales
            ).count()

        )


        print()

        print("=" * 60)

        print(
            "SEASONAL SALES LOAD COMPLETE"
        )

        print("=" * 60)

        print()


        print(
            f"Rows read       : {len(df):,}"
        )

        print(
            f"Rows inserted   : {inserted:,}"
        )

        print(
            f"Database records: {database_count:,}"
        )

        print()


        # ====================================================
        # DATABASE CATEGORIES
        # ====================================================

        print(
            "Categories loaded:"
        )


        loaded_categories = (

            db.query(
                SeasonalSales.category
            )

            .distinct()

            .order_by(
                SeasonalSales.category
            )

            .all()

        )


        for row in loaded_categories:

            print(
                f"  - {row.category}"
            )


        print()


        print(
            "Date range:"
        )

        print(

            f"  {df['order_date'].min().date()} "
            f"→ "
            f"{df['order_date'].max().date()}"

        )

        print()


        print(
            "Seasonal dataset is ready."
        )

        print(

            "The existing HistoricalSales table "
            "was not modified."

        )

        print()


        print("=" * 60)


    except Exception as e:

        db.rollback()

        print()

        print(
            "ERROR while loading seasonal sales:"
        )

        print(
            str(e)
        )

        raise


    finally:

        db.close()


# ============================================================
# RUN
# ============================================================

if __name__ == "__main__":

    load_seasonal_sales()