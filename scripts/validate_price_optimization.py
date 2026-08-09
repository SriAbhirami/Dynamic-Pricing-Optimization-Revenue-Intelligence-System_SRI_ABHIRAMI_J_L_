"""
validate_price_optimization.py

============================================================
WHY THIS SCRIPT EXISTS
============================================================

Model metrics (MAE / RMSE / R^2) do not tell you whether a
pricing optimizer actually behaves sensibly. This script
loads the trained price-response model exactly the way the
API does, and for a handful of representative synthetic
products spanning every category in the dataset, prints:

    Price -> Predicted Units -> Predicted Revenue

for the full candidate range the API now uses
(CANDIDATE_MIN_PCT to CANDIDATE_MAX_PCT, see
backend/app/api/price_prediction.py), plus the resulting
recommendation.

Run this after any retraining, or whenever the optimization
logic in price_prediction.py changes, to confirm:

  1. The demand curve is downward sloping in price (or at
     least non-increasing) for every tested product.
  2. The recommendation is NOT always sitting at the edge of
     the candidate range.
  3. Different products / categories / inventory levels
     produce genuinely different recommendations.

NOTE: this sandbox that produced this script could not run it
(no network access, xgboost not installed here) - please run
it in your own project environment where
backend/requirements.txt is installed.

Usage:
    python scripts/validate_price_optimization.py
============================================================
"""

import os
import sys
import joblib
import pandas as pd

BASE_DIR = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..")
)

MODEL_DIR = os.path.join(
    BASE_DIR, "backend", "app", "ml", "price_prediction"
)

MODEL_PATH = os.path.join(MODEL_DIR, "xgb_price_response_model.joblib")
PREPROCESSOR_PATH = os.path.join(MODEL_DIR, "price_response_preprocessor.joblib")

CUSTOMER_DATA_PATH = os.path.join(
    BASE_DIR, "datasets", "raw", "ecommerce_customer_behavior_dataset_v2.csv"
)

PRICING_DATA_PATH = os.path.join(
    BASE_DIR, "datasets", "raw", "retail_pricing_demand_100k.csv"
)

# Must match backend/app/api/price_prediction.py
CANDIDATE_MIN_PCT = -20
CANDIDATE_MAX_PCT = 15
CANDIDATE_STEP_PCT = 1
MIN_REVENUE_IMPROVEMENT_PCT = 1.0
HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT = -8


def load_model():
    if not os.path.exists(MODEL_PATH):
        print(f"Model not found at {MODEL_PATH}")
        sys.exit(1)
    model = joblib.load(MODEL_PATH)
    preprocessor = joblib.load(PREPROCESSOR_PATH)
    return model, preprocessor


def load_customer_behavior():
    df = pd.read_csv(CUSTOMER_DATA_PATH)
    df["Product_Category"] = df["Product_Category"].astype(str).str.strip().str.lower()
    df["Is_Returning_Customer"] = (
        pd.to_numeric(df["Is_Returning_Customer"], errors="coerce").fillna(0).astype(int)
    )
    behavior = (
        df.groupby("Product_Category")
        .agg(
            customer_avg_age=("Age", "mean"),
            customer_avg_unit_price=("Unit_Price", "mean"),
            customer_avg_quantity=("Quantity", "mean"),
            customer_avg_discount_amount=("Discount_Amount", "mean"),
            customer_avg_order_value=("Total_Amount", "mean"),
            customer_returning_rate=("Is_Returning_Customer", "mean"),
            customer_avg_session_duration=("Session_Duration_Minutes", "mean"),
            customer_avg_pages_viewed=("Pages_Viewed", "mean"),
            customer_avg_delivery_time=("Delivery_Time_Days", "mean"),
            customer_avg_rating=("Customer_Rating", "mean"),
            customer_order_count=("Order_ID", "count"),
        )
        .reset_index()
    )
    return behavior


def load_category_signals():
    df = pd.read_csv(PRICING_DATA_PATH)
    df["category"] = df["category"].astype(str).str.strip().str.lower()
    signals = (
        df.groupby("category")
        .agg(
            average_base_price=("base_price", "mean"),
            average_units_sold=("units_sold", "mean"),
            average_inventory=("inventory_level", "mean"),
            average_demand_index=("demand_index", "mean"),
            average_discount_pct=("discount_pct", "mean"),
        )
        .reset_index()
    )
    latest = df.sort_values("date").groupby("category").tail(1)
    return signals, latest


def build_row(category, brand, region, channel, season, promotion_type,
              current_price, stock, average_base_price, customer_behavior):
    today = pd.Timestamp.today()
    reference_price = current_price if current_price > 0 else 1.0
    price_ratio = current_price / reference_price
    effective_discount_pct = ((reference_price - current_price) / reference_price) * 100

    row = {
        "current_price": current_price,
        "base_price": average_base_price,
        "price_ratio": price_ratio,
        "effective_discount_pct": effective_discount_pct,
        "inventory_level": stock,
        "stockout_flag": 1 if stock <= 0 else 0,
        "year": today.year,
        "month": today.month,
        "day": today.day,
        "day_of_week": today.weekday(),
        "product_id": "VALIDATION",
        "category": category,
        "brand": brand,
        "region": region,
        "channel": channel,
        "season": season,
        "promotion_type": promotion_type,
    }

    cb = customer_behavior[customer_behavior["Product_Category"] == category]
    if not cb.empty:
        cb_row = cb.iloc[0]
        for col in customer_behavior.columns:
            if col != "Product_Category":
                row[col] = cb_row[col]
    else:
        row.update({
            "customer_avg_age": 35.0,
            "customer_avg_unit_price": average_base_price,
            "customer_avg_quantity": 3.0,
            "customer_avg_discount_amount": 0.0,
            "customer_avg_order_value": average_base_price * 3,
            "customer_returning_rate": 0.88,
            "customer_avg_session_duration": 14.5,
            "customer_avg_pages_viewed": 9.0,
            "customer_avg_delivery_time": 6.5,
            "customer_avg_rating": 3.9,
            "customer_order_count": 2000,
        })

    return pd.DataFrame([row])


def sanity_cap(average_units_sold):
    if average_units_sold and average_units_sold > 0:
        return max(average_units_sold * 5, 50)
    return 10000


def evaluate_product(model, preprocessor, category, brand, region, channel,
                      season, promotion_type, current_price, stock,
                      average_base_price, average_units_sold,
                      average_demand_index, customer_behavior):

    print()
    print("=" * 78)
    print(
        f"CATEGORY={category!r}  brand={brand!r}  "
        f"current_price=Rs.{current_price:.2f}  stock={stock}"
    )
    print(
        f"category avg demand_index={average_demand_index:.1f}  "
        f"category avg units_sold={average_units_sold:.1f}"
    )
    print("-" * 78)
    print(f"{'change':>8} | {'price':>12} | {'pred_units':>12} | {'pred_revenue':>14}")
    print("-" * 78)

    rows = []
    for pct in range(CANDIDATE_MIN_PCT, CANDIDATE_MAX_PCT + 1, CANDIDATE_STEP_PCT):
        candidate_price = round(current_price * (1 + pct / 100), 2)
        input_df = build_row(
            category, brand, region, channel, season, promotion_type,
            candidate_price, stock, average_base_price, customer_behavior,
        )
        processed = preprocessor.transform(input_df)
        predicted_units = float(model.predict(processed)[0])
        predicted_units = max(0.0, min(predicted_units, sanity_cap(average_units_sold)))
        predicted_revenue = candidate_price * predicted_units

        marker = ""
        rows.append((pct, candidate_price, predicted_units, predicted_revenue))
        print(
            f"{pct:>+7d}% | Rs.{candidate_price:>9.2f} | "
            f"{predicted_units:>12.2f} | Rs.{predicted_revenue:>11.2f}"
        )

    # business-aware selection, mirroring select_best_candidate()
    baseline = min(rows, key=lambda r: abs(r[1] - current_price))
    is_high_demand = average_demand_index >= 200
    is_low_inventory = stock <= 50

    eligible = [
        r for r in rows
        if not (is_high_demand and is_low_inventory and r[0] < HIGH_DEMAND_LOW_STOCK_MAX_DISCOUNT_PCT)
    ] or rows

    best = max(eligible, key=lambda r: r[3])
    improvement = (
        (best[3] - baseline[3]) / baseline[3] * 100 if baseline[3] > 0 else 0.0
    )
    final = best if improvement >= MIN_REVENUE_IMPROVEMENT_PCT else baseline

    change_pct = (final[1] - current_price) / current_price * 100
    if change_pct >= 2:
        recommendation = "INCREASE PRICE"
    elif change_pct <= -2:
        recommendation = "DECREASE PRICE"
    else:
        recommendation = "MAINTAIN PRICE"

    at_lower_edge = final[0] == CANDIDATE_MIN_PCT
    at_upper_edge = final[0] == CANDIDATE_MAX_PCT

    print("-" * 78)
    print(
        f"RECOMMENDATION: {recommendation}  "
        f"(price=Rs.{final[1]:.2f}, change={change_pct:+.2f}%)"
    )
    if at_lower_edge or at_upper_edge:
        print(
            "NOTE: recommendation sits at the edge of the candidate range "
            "for this product - inspect whether that is genuinely justified "
            "by its signals."
        )

    return {
        "category": category,
        "current_price": current_price,
        "recommended_price": final[1],
        "change_pct": change_pct,
        "recommendation": recommendation,
        "at_edge": at_lower_edge or at_upper_edge,
    }


def main():
    model, preprocessor = load_model()
    customer_behavior = load_customer_behavior()
    category_signals, latest_rows = load_category_signals()

    print("Loaded price-response model and preprocessor successfully.")
    print(f"Categories found: {list(category_signals['category'])}")

    # Representative synthetic products: for every category, test a
    # LOW stock / HIGH stock variant at a couple of price points, so
    # we can see whether recommendations genuinely vary with signals
    # (not just with category).
    summary = []

    for _, sig in category_signals.iterrows():
        category = sig["category"]
        latest = latest_rows[latest_rows["category"] == category].iloc[0]

        avg_base_price = float(sig["average_base_price"])
        avg_units_sold = float(sig["average_units_sold"])
        avg_demand_index = float(sig["average_demand_index"])

        for stock, label in [(30, "LOW STOCK"), (300, "HIGH STOCK")]:
            print(f"\n### {category.upper()} - {label} ###")
            result = evaluate_product(
                model, preprocessor,
                category=category,
                brand=str(latest["brand"]),
                region=str(latest["region"]),
                channel=str(latest["channel"]),
                season=str(latest["season"]),
                promotion_type=str(latest["promotion_type"]),
                current_price=round(avg_base_price, 2),
                stock=stock,
                average_base_price=avg_base_price,
                average_units_sold=avg_units_sold,
                average_demand_index=avg_demand_index,
                customer_behavior=customer_behavior,
            )
            summary.append(result)

    print()
    print("=" * 78)
    print("SUMMARY ACROSS ALL TESTED PRODUCTS")
    print("=" * 78)
    summary_df = pd.DataFrame(summary)
    print(summary_df.to_string(index=False))

    print()
    edge_count = summary_df["at_edge"].sum()
    total = len(summary_df)
    print(f"Recommendations sitting at a candidate-range edge: {edge_count}/{total}")
    if edge_count == total:
        print("WARNING: every single recommendation is at an edge - investigate.")
    else:
        print("OK: recommendations are NOT uniformly stuck at one boundary.")

    print(
        f"Recommendation mix: "
        f"{summary_df['recommendation'].value_counts().to_dict()}"
    )


if __name__ == "__main__":
    main()