import sys
import os
sys.path.append(os.path.abspath("../backend"))
import pandas as pd
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.sales import Sale


CSV_PATH = "../datasets/raw/ecommerce_customer_behavior_dataset_v2.csv"


def load_sales_data():

    print("Reading CSV file...")

    df = pd.read_csv(CSV_PATH)

    print(f"Total rows found: {len(df)}")

    db: Session = SessionLocal()

    try:

        records = []

        for _, row in df.iterrows():

            sale = Sale(
                order_id=row["Order_ID"],
                customer_id=row["Customer_ID"],
                date=pd.to_datetime(row["Date"]).date(),
                age=int(row["Age"]),
                gender=row["Gender"],
                city=row["City"],
                product_category=row["Product_Category"],
                unit_price=float(row["Unit_Price"]),
                quantity=int(row["Quantity"]),
                discount_amount=float(row["Discount_Amount"]),
                total_amount=float(row["Total_Amount"]),
                payment_method=row["Payment_Method"],
                device_type=row["Device_Type"],
                session_duration_minutes=int(row["Session_Duration_Minutes"]),
                pages_viewed=int(row["Pages_Viewed"]),
                is_returning_customer=bool(row["Is_Returning_Customer"]),
                delivery_time_days=int(row["Delivery_Time_Days"]),
                customer_rating=float(row["Customer_Rating"])
            )

            records.append(sale)

        print("Inserting records into PostgreSQL...")

        db.add_all(records)
        db.commit()

        print(f"Successfully inserted {len(records)} records!")

    except Exception as e:

        db.rollback()
        print("Error occurred:")
        print(e)

    finally:

        db.close()


if __name__ == "__main__":
    load_sales_data()