from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.products import Product
from app.models.pricing_demand import PricingDemand


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/business-intelligence",
    tags=["Executive Business Intelligence"]
)


# ============================================================
# HELPER FUNCTIONS
# ============================================================

def safe_float(value, default=0.0):
    """
    Safely convert a value to float.
    """

    try:

        if value is None:
            return default

        return float(value)

    except (TypeError, ValueError):

        return default


def rounded(value, digits=2):
    """
    Safely round numeric values.
    """

    return round(
        safe_float(value),
        digits
    )


def get_model_value(obj, possible_names, default=None):
    """
    Return the first available attribute from a list
    of possible model field names.

    This keeps the BI API compatible with the existing
    SQLAlchemy model naming conventions.
    """

    for name in possible_names:

        if hasattr(obj, name):

            value = getattr(
                obj,
                name
            )

            if value is not None:

                return value

    return default


# ============================================================
# EXECUTIVE BUSINESS INTELLIGENCE
# ============================================================

@router.get("/executive-summary")
def get_executive_business_intelligence(
    db: Session = Depends(get_db)
):

    try:

        # ====================================================
        # 1. PRODUCTS
        # ====================================================

        products = (
            db.query(Product)
            .all()
        )

        product_count = len(products)


        # ====================================================
        # 2. BASIC PRODUCT METRICS
        # ====================================================

        total_inventory = 0.0

        total_current_price = 0.0

        priced_products = 0

        low_stock_count = 0

        out_of_stock_count = 0

        product_summaries = []


        # ====================================================
        # 3. PROCESS PRODUCTS
        # ====================================================

        for product in products:

            # ------------------------------------------------
            # CURRENT PRICE
            # ------------------------------------------------

            current_price = get_model_value(
                product,
                [
                    "current_price",
                    "price",
                    "selling_price"
                ],
                0
            )

            current_price = safe_float(
                current_price
            )


            # ------------------------------------------------
            # STOCK
            # ------------------------------------------------

            stock = get_model_value(
                product,
                [
                    "stock",
                    "stock_quantity",
                    "inventory",
                    "inventory_level"
                ],
                0
            )

            stock = safe_float(
                stock
            )


            # ------------------------------------------------
            # TOTAL INVENTORY
            # ------------------------------------------------

            total_inventory += stock


            # ------------------------------------------------
            # PRICED PRODUCTS
            # ------------------------------------------------

            if current_price > 0:

                total_current_price += (
                    current_price
                )

                priced_products += 1


            # ------------------------------------------------
            # STOCK STATUS
            # ------------------------------------------------

            if stock <= 0:

                out_of_stock_count += 1

            elif stock <= 10:

                low_stock_count += 1


            # ------------------------------------------------
            # PRODUCT SUMMARY
            # ------------------------------------------------

            product_summaries.append({

                "id":
                    getattr(
                        product,
                        "id",
                        None
                    ),

                "name":
                    getattr(
                        product,
                        "name",
                        "Unknown Product"
                    ),

                "category":
                    getattr(
                        product,
                        "category",
                        "Unknown"
                    ),

                "price":
                    rounded(
                        current_price
                    ),

                "stock":
                    rounded(
                        stock
                    )

            })


        # ====================================================
        # 4. AVERAGE PRODUCT PRICE
        # ====================================================

        average_product_price = 0.0

        if priced_products > 0:

            average_product_price = (
                total_current_price
                / priced_products
            )


        # ====================================================
        # 5. PRICING / DEMAND DATA
        # ====================================================

        pricing_records = (
            db.query(PricingDemand)
            .all()
        )


        total_revenue = 0.0

        total_units_sold = 0.0

        total_demand_index = 0.0

        demand_index_count = 0

        total_discount = 0.0

        discount_count = 0

        total_historical_price = 0.0

        historical_price_count = 0

        stockout_count = 0


        category_metrics = {}


        # ====================================================
        # 6. PROCESS PRICING / DEMAND RECORDS
        # ====================================================

        for record in pricing_records:

            # ------------------------------------------------
            # REVENUE
            # ------------------------------------------------

            revenue = get_model_value(
                record,
                [
                    "revenue",
                    "total_revenue",
                    "sales_revenue"
                ],
                0
            )

            revenue = safe_float(
                revenue
            )

            total_revenue += revenue


            # ------------------------------------------------
            # UNITS SOLD
            # ------------------------------------------------

            units = get_model_value(
                record,
                [
                    "units_sold",
                    "quantity",
                    "sales",
                    "demand"
                ],
                0
            )

            units = safe_float(
                units
            )

            total_units_sold += units


            # ------------------------------------------------
            # DEMAND INDEX
            # ------------------------------------------------

            demand_index = get_model_value(
                record,
                [
                    "demand_index",
                    "demand"
                ],
                None
            )

            if demand_index is not None:

                demand_index = safe_float(
                    demand_index
                )

                total_demand_index += (
                    demand_index
                )

                demand_index_count += 1


            # ------------------------------------------------
            # DISCOUNT
            # ------------------------------------------------

            discount = get_model_value(
                record,
                [
                    "discount_pct",
                    "discount_percentage",
                    "discount"
                ],
                None
            )

            if discount is not None:

                discount = safe_float(
                    discount
                )

                total_discount += discount

                discount_count += 1


            # ------------------------------------------------
            # HISTORICAL PRICE
            # ------------------------------------------------

            historical_price = get_model_value(
                record,
                [
                    "current_price",
                    "price",
                    "selling_price"
                ],
                None
            )

            if historical_price is not None:

                historical_price = safe_float(
                    historical_price
                )

                if historical_price > 0:

                    total_historical_price += (
                        historical_price
                    )

                    historical_price_count += 1


            # ------------------------------------------------
            # STOCKOUT
            # ------------------------------------------------

            stockout_flag = get_model_value(
                record,
                [
                    "stockout_flag",
                    "stockout"
                ],
                0
            )

            try:

                if int(
                    safe_float(
                        stockout_flag
                    )
                ) == 1:

                    stockout_count += 1

            except Exception:

                pass


            # ------------------------------------------------
            # CATEGORY
            # ------------------------------------------------

            category = get_model_value(
                record,
                [
                    "category",
                    "product_category"
                ],
                "Unknown"
            )

            category = str(
                category or "Unknown"
            ).strip()


            if not category:

                category = "Unknown"


            # ------------------------------------------------
            # INITIALIZE CATEGORY
            # ------------------------------------------------

            if category not in category_metrics:

                category_metrics[category] = {

                    "revenue": 0.0,

                    "units_sold": 0.0,

                    "record_count": 0,

                    "demand_total": 0.0,

                    "demand_count": 0

                }


            # ------------------------------------------------
            # CATEGORY REVENUE
            # ------------------------------------------------

            category_metrics[
                category
            ]["revenue"] += revenue


            # ------------------------------------------------
            # CATEGORY UNITS
            # ------------------------------------------------

            category_metrics[
                category
            ]["units_sold"] += units


            # ------------------------------------------------
            # CATEGORY RECORDS
            # ------------------------------------------------

            category_metrics[
                category
            ]["record_count"] += 1


            # ------------------------------------------------
            # CATEGORY DEMAND
            # ------------------------------------------------

            if demand_index is not None:

                category_metrics[
                    category
                ]["demand_total"] += (
                    demand_index
                )

                category_metrics[
                    category
                ]["demand_count"] += 1


        # ====================================================
        # 7. DERIVED KPIs
        # ====================================================

        average_demand_index = 0.0

        if demand_index_count > 0:

            average_demand_index = (
                total_demand_index
                / demand_index_count
            )


        average_discount = 0.0

        if discount_count > 0:

            average_discount = (
                total_discount
                / discount_count
            )


        average_historical_price = 0.0

        if historical_price_count > 0:

            average_historical_price = (
                total_historical_price
                / historical_price_count
            )


        average_revenue_per_unit = 0.0

        if total_units_sold > 0:

            average_revenue_per_unit = (
                total_revenue
                / total_units_sold
            )


        # ====================================================
        # 8. CATEGORY PERFORMANCE
        # ====================================================

        category_performance = []


        for category, metrics in (
            category_metrics.items()
        ):

            category_demand = 0.0

            if metrics["demand_count"] > 0:

                category_demand = (
                    metrics["demand_total"]
                    /
                    metrics["demand_count"]
                )


            category_performance.append({

                "category":
                    category,

                "revenue":
                    rounded(
                        metrics["revenue"]
                    ),

                "units_sold":
                    rounded(
                        metrics["units_sold"]
                    ),

                "demand_index":
                    rounded(
                        category_demand
                    ),

                "records":
                    metrics[
                        "record_count"
                    ]

            })


        # ====================================================
        # 9. SORT CATEGORY PERFORMANCE
        # ====================================================

        category_performance.sort(
            key=lambda item:
                item["revenue"],
            reverse=True
        )


        # ====================================================
        # 10. TOP PRODUCTS
        #
        # Products table does not necessarily contain
        # historical sales information.
        #
        # Therefore the current implementation ranks
        # available products by current price.
        # ====================================================

        top_products = sorted(

            product_summaries,

            key=lambda item:
                item["price"],

            reverse=True

        )[:10]


        # ====================================================
        # 11. LOW STOCK PRODUCTS
        # ====================================================

        low_stock_products = [

            product

            for product in product_summaries

            if product["stock"] <= 10

        ][:10]


        # ====================================================
        # 12. BUSINESS HEALTH
        # ====================================================

        health_score = 100


        # ----------------------------------------------------
        # STOCK PENALTIES
        # ----------------------------------------------------

        if product_count > 0:

            stockout_rate = (
                out_of_stock_count
                / product_count
            ) * 100


            low_stock_rate = (
                low_stock_count
                / product_count
            ) * 100


            # Stockout penalty

            if stockout_rate > 20:

                health_score -= 25

            elif stockout_rate > 10:

                health_score -= 15

            elif stockout_rate > 5:

                health_score -= 8


            # Low stock penalty

            if low_stock_rate > 30:

                health_score -= 15

            elif low_stock_rate > 15:

                health_score -= 8


        # ----------------------------------------------------
        # DEMAND PENALTY
        # ----------------------------------------------------

        if average_demand_index < 50:

            health_score -= 15

        elif average_demand_index < 75:

            health_score -= 8


        # ----------------------------------------------------
        # DISCOUNT PENALTY
        # ----------------------------------------------------

        if average_discount > 30:

            health_score -= 10

        elif average_discount > 20:

            health_score -= 5


        # ----------------------------------------------------
        # LIMIT HEALTH SCORE
        # ----------------------------------------------------

        health_score = max(
            0,
            min(
                100,
                health_score
            )
        )


        # ----------------------------------------------------
        # BUSINESS HEALTH LABEL
        # ----------------------------------------------------

        if health_score >= 80:

            business_health = "Excellent"

        elif health_score >= 65:

            business_health = "Healthy"

        elif health_score >= 50:

            business_health = "Needs Attention"

        else:

            business_health = "At Risk"


        # ====================================================
        # 13. EXECUTIVE RECOMMENDATIONS
        # ====================================================

        recommendations = []


        # ----------------------------------------------------
        # OUT OF STOCK
        # ----------------------------------------------------

        if out_of_stock_count > 0:

            recommendations.append({

                "priority":
                    "High",

                "area":
                    "Inventory",

                "message":
                    (
                        f"{out_of_stock_count} "
                        "product(s) are currently "
                        "out of stock. Review inventory "
                        "replenishment immediately."
                    )

            })


        # ----------------------------------------------------
        # LOW STOCK
        # ----------------------------------------------------

        if low_stock_count > 0:

            recommendations.append({

                "priority":
                    "Medium",

                "area":
                    "Inventory",

                "message":
                    (
                        f"{low_stock_count} "
                        "product(s) have low inventory "
                        "levels and should be monitored."
                    )

            })


        # ----------------------------------------------------
        # HIGH DISCOUNT
        # ----------------------------------------------------

        if average_discount > 20:

            recommendations.append({

                "priority":
                    "Medium",

                "area":
                    "Pricing",

                "message":
                    (
                        "Average discounting is relatively "
                        "high. Review discount strategy "
                        "to protect revenue."
                    )

            })


        # ----------------------------------------------------
        # LOW DEMAND
        # ----------------------------------------------------

        if average_demand_index < 75:

            recommendations.append({

                "priority":
                    "Medium",

                "area":
                    "Demand",

                "message":
                    (
                        "Average demand index is below "
                        "the preferred range. Consider "
                        "targeted pricing and promotional "
                        "strategies."
                    )

            })


        # ----------------------------------------------------
        # STABLE BUSINESS
        # ----------------------------------------------------

        if not recommendations:

            recommendations.append({

                "priority":
                    "Low",

                "area":
                    "Business",

                "message":
                    (
                        "Current business indicators are "
                        "stable. Continue monitoring "
                        "pricing, demand and inventory."
                    )

            })


        # ====================================================
        # 14. PRICING STATUS
        # ====================================================

        if average_discount >= 25:

            pricing_status = (
                "High Discounting"
            )

        elif average_discount >= 10:

            pricing_status = (
                "Moderate Discounting"
            )

        else:

            pricing_status = (
                "Low Discounting"
            )


        # ====================================================
        # 15. DEMAND STATUS
        # ====================================================

        if average_demand_index >= 120:

            demand_status = (
                "Very High Demand"
            )

        elif average_demand_index >= 100:

            demand_status = (
                "High Demand"
            )

        elif average_demand_index >= 75:

            demand_status = (
                "Moderate Demand"
            )

        else:

            demand_status = (
                "Low Demand"
            )


        # ====================================================
        # 16. FINAL RESPONSE
        # ====================================================

        return {

            # ==================================================
            # REPORT
            # ==================================================

            "report": {

                "title":
                    (
                        "PricePilot AI Executive "
                        "Business Intelligence"
                    ),

                "business_health":
                    business_health,

                "health_score":
                    health_score

            },


            # ==================================================
            # EXECUTIVE KPIs
            # ==================================================

            "executive_kpis": {

                "total_revenue":
                    rounded(
                        total_revenue
                    ),

                "total_units_sold":
                    rounded(
                        total_units_sold
                    ),

                "average_demand_index":
                    rounded(
                        average_demand_index
                    ),

                "average_discount_pct":
                    rounded(
                        average_discount
                    ),

                "average_current_price":
                    rounded(
                        average_product_price
                    ),

                "average_historical_price":
                    rounded(
                        average_historical_price
                    ),

                "average_revenue_per_unit":
                    rounded(
                        average_revenue_per_unit
                    ),

                "number_of_products":
                    product_count,

                "total_inventory":
                    rounded(
                        total_inventory
                    ),

                "stockout_count":
                    stockout_count,

                "out_of_stock_products":
                    out_of_stock_count,

                "low_stock_products":
                    low_stock_count

            },


            # ==================================================
            # PRICING INTELLIGENCE
            # ==================================================

            "pricing_intelligence": {

                "average_current_price":
                    rounded(
                        average_product_price
                    ),

                "average_historical_price":
                    rounded(
                        average_historical_price
                    ),

                "average_discount_pct":
                    rounded(
                        average_discount
                    ),

                "pricing_status":
                    pricing_status

            },


            # ==================================================
            # DEMAND INTELLIGENCE
            # ==================================================

            "demand_intelligence": {

                "average_demand_index":
                    rounded(
                        average_demand_index
                    ),

                "demand_status":
                    demand_status,

                "total_units_sold":
                    rounded(
                        total_units_sold
                    )

            },


            # ==================================================
            # INVENTORY INTELLIGENCE
            # ==================================================

            "inventory_intelligence": {

                "total_inventory":
                    rounded(
                        total_inventory
                    ),

                "out_of_stock":
                    out_of_stock_count,

                "low_stock":
                    low_stock_count,

                "stockout_records":
                    stockout_count

            },


            # ==================================================
            # CATEGORY PERFORMANCE
            # ==================================================

            "category_performance":
                category_performance[:10],


            # ==================================================
            # TOP PRODUCTS
            # ==================================================

            "top_products":
                top_products,


            # ==================================================
            # LOW STOCK PRODUCTS
            # ==================================================

            "low_stock_products":
                low_stock_products,


            # ==================================================
            # EXECUTIVE RECOMMENDATIONS
            # ==================================================

            "recommendations":
                recommendations

        }


    # ========================================================
    # ERROR HANDLING
    # ========================================================

    except HTTPException:

        raise


    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=(
                "Executive Business Intelligence "
                f"analysis failed: {str(e)}"
            )
        )


# ============================================================
# SIMPLE HEALTH CHECK
# ============================================================

@router.get("/health")
def business_intelligence_health():

    return {

        "status":
            "healthy",

        "module":
            "Executive Business Intelligence",

        "message":
            "Business Intelligence API is running."

    }