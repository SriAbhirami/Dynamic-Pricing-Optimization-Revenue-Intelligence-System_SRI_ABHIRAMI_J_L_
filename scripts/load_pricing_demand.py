import sys
import os

# Allow Python to find the backend/app package
sys.path.append(os.path.abspath("../backend"))

import pandas as pd
from sqlalchemy import insert

from app.database.database import SessionLocal
from app.models.pricing_demand import PricingDemand


CSV_PATH = "../datasets/raw/retail_pricing_demand_100k.csv"


def load_pricing_demand():
    print("Reading pricing and demand CSV file...")

    df = pd.read_csv(CSV_PATH)

    print(f"Total rows found: {len(df)}")

    # Convert date column to Python date objects
    df["date"] = pd.to_datetime(df["date"]).dt.date

    # Convert 0/1 into Boolean values
    df["stockout_flag"] = df["stockout_flag"].astype(bool)

    # Convert pandas NaN values to None
    df = df.where(pd.notnull(df), None)

    # Convert DataFrame to list of dictionaries
    records = df.to_dict(orient="records")

    db = SessionLocal()

    try:
        # Safety check: prevent accidental duplicate loading
        existing_count = db.query(PricingDemand).count()

        if existing_count > 0:
            print(
                f"pricing_demand already contains {existing_count} records."
            )
            print("Loading cancelled to prevent duplicates.")
            return

        print("Inserting records into PostgreSQL...")

        # Insert in batches
        batch_size = 5000

        for i in range(0, len(records), batch_size):
            batch = records[i:i + batch_size]

            db.execute(insert(PricingDemand), batch)
            db.commit()

            print(
                f"Inserted {min(i + batch_size, len(records))} "
                f"/ {len(records)} records"
            )

        print(f"Successfully inserted {len(records)} records!")

    except Exception as e:
        db.rollback()
        print("Error while inserting data:")
        print(e)

    finally:
        db.close()


if __name__ == "__main__":
    load_pricing_demand()