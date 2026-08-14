import sys
import csv
from pathlib import Path
from datetime import datetime


# ============================================================
# PROJECT PATH SETUP
# ============================================================

# Project root:
# Dynamic-Pricing-Optimization-...
BASE_DIR = Path(__file__).resolve().parents[1]

# Backend directory:
# Dynamic-Pricing-Optimization-.../backend
BACKEND_DIR = BASE_DIR / "backend"

# Add backend to Python's import path
sys.path.insert(0, str(BACKEND_DIR))


# ============================================================
# IMPORT BACKEND MODULES
# ============================================================

from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.historical_sales import HistoricalSales


# ============================================================
# CSV FILE
# ============================================================

CSV_FILE = (
    BASE_DIR
    / "datasets"
    / "raw"
    / "sales.csv"
)


# ============================================================
# SETTINGS
# ============================================================

BATCH_SIZE = 5000


# ============================================================
# LOAD HISTORICAL SALES
# ============================================================

def load_historical_sales():

    print("=" * 60)
    print("Loading Historical Sales Data")
    print("=" * 60)

    print(f"\nCSV file:")
    print(CSV_FILE)

    # --------------------------------------------------------
    # Check CSV
    # --------------------------------------------------------

    if not CSV_FILE.exists():

        print("\nERROR: CSV file not found!")

        print(
            f"Expected location:\n{CSV_FILE}"
        )

        return

    print("\nCSV file found successfully.")

    # --------------------------------------------------------
    # Create database session
    # --------------------------------------------------------

    db: Session = SessionLocal()

    try:

        # ----------------------------------------------------
        # Clear existing historical data
        # ----------------------------------------------------

        print(
            "\nClearing existing historical sales data..."
        )

        db.query(HistoricalSales).delete(
            synchronize_session=False
        )

        db.commit()

        print(
            "Existing historical data cleared."
        )

        # ----------------------------------------------------
        # Read CSV
        # ----------------------------------------------------

        total_rows = 0
        skipped_rows = 0
        batch = []

        print("\nReading CSV...")
        print("-" * 60)

        with open(
            CSV_FILE,
            "r",
            encoding="utf-8"
        ) as file:

            reader = csv.DictReader(file)

            for row in reader:

                try:

                    # ------------------------------------------------
                    # Date
                    # ------------------------------------------------

                    date_value = datetime.strptime(
                        row["date"],
                        "%Y-%m-%d"
                    ).date()

                    # ------------------------------------------------
                    # Numeric values
                    # ------------------------------------------------

                    sales = (
                        float(row["sales"])
                        if row["sales"]
                        else 0.0
                    )

                    revenue = (
                        float(row["revenue"])
                        if row["revenue"]
                        else 0.0
                    )

                    stock = (
                        float(row["stock"])
                        if row["stock"]
                        else 0.0
                    )

                    price = (
                        float(row["price"])
                        if row["price"]
                        else 0.0
                    )

                    # ------------------------------------------------
                    # Create HistoricalSales object
                    # ------------------------------------------------

                    historical_sale = HistoricalSales(

                        product_id=row["product_id"],

                        store_id=row["store_id"],

                        date=date_value,

                        sales=sales,

                        revenue=revenue,

                        stock=stock,

                        price=price
                    )

                    batch.append(
                        historical_sale
                    )

                    total_rows += 1

                    # ------------------------------------------------
                    # Insert batch
                    # ------------------------------------------------

                    if len(batch) >= BATCH_SIZE:

                        db.bulk_save_objects(
                            batch
                        )

                        db.commit()

                        print(
                            f"Inserted {total_rows:,} rows..."
                        )

                        batch.clear()

                except Exception as row_error:

                    skipped_rows += 1

                    if skipped_rows <= 10:

                        print(
                            f"Skipping invalid row: "
                            f"{row_error}"
                        )

        # --------------------------------------------------------
        # Insert remaining rows
        # --------------------------------------------------------

        if batch:

            db.bulk_save_objects(
                batch
            )

            db.commit()

        # --------------------------------------------------------
        # Final result
        # --------------------------------------------------------

        print("\n" + "=" * 60)
        print("Historical Sales Import Completed")
        print("=" * 60)

        print(
            f"Total rows inserted : {total_rows:,}"
        )

        print(
            f"Rows skipped        : {skipped_rows:,}"
        )

        print("=" * 60)

    except Exception as e:

        db.rollback()

        print("\n" + "=" * 60)
        print("ERROR WHILE IMPORTING DATA")
        print("=" * 60)

        print(e)

        print("=" * 60)

    finally:

        db.close()


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    load_historical_sales()