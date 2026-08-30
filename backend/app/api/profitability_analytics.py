from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi import Depends
import re

from app.database.database import get_db
from app.models.products import Product

from app.services.amazon_scraper.scraper import scrape_competitor_price
from app.services.flipkart_scraper.scraper import scrape_flipkart_product


# ============================================================
# ROUTER
# ============================================================

router = APIRouter(
    prefix="/profitability",
    tags=["Profitability Analytics"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class ProfitabilityRequest(BaseModel):
    product_name: str


# ============================================================
# PRICE CLEANING
# ============================================================

def parse_price(value):
    """
    Convert different price formats into a numeric float.

    Examples:

        ₹2,619          -> 2619.0
        ₹2,619.00       -> 2619.0
        Rs. 2,619       -> 2619.0
        INR 2,619       -> 2619.0
        2619             -> 2619.0
        "N/A"            -> None
    """

    if value is None:
        return None

    if isinstance(value, (int, float)):
        try:
            number = float(value)

            if number > 0:
                return number

        except Exception:
            return None

        return None

    try:

        text = str(value).strip()

        if not text:
            return None

        if text.upper() in {
            "N/A",
            "NA",
            "NONE",
            "NULL",
            "NOT AVAILABLE",
            "UNAVAILABLE",
            "-"
        }:
            return None

        # Remove currency symbols and words.
        text = text.replace(",", "")

        # Find first valid numeric amount.
        match = re.search(
            r"\d+(?:\.\d+)?",
            text
        )

        if not match:
            return None

        number = float(match.group(0))

        if number <= 0:
            return None

        return number

    except Exception:

        return None


# ============================================================
# SAFE ROUNDING
# ============================================================

def rounded(value):

    if value is None:
        return None

    return round(float(value), 2)


# ============================================================
# PROFITABILITY ANALYSIS
# ============================================================

@router.post("/analyze")
def analyze_profitability(
    request: ProfitabilityRequest,
    db: Session = Depends(get_db)
):

    product_name = request.product_name.strip()

    if not product_name:

        raise HTTPException(
            status_code=400,
            detail="Product name cannot be empty."
        )


    # ========================================================
    # FIND PRODUCT FROM PRODUCTS TABLE
    # ========================================================

    product = (
        db.query(Product)
        .filter(
            Product.name == product_name
        )
        .first()
    )


    # --------------------------------------------------------
    # FALLBACK: CASE-INSENSITIVE SEARCH
    # --------------------------------------------------------

    if not product:

        product = (
            db.query(Product)
            .filter(
                Product.name.ilike(
                    product_name
                )
            )
            .first()
        )


    if not product:

        raise HTTPException(
            status_code=404,
            detail=(
                f"Product '{product_name}' "
                "was not found in the Products table."
            )
        )


    # ========================================================
    # YOUR STORE PRICE
    # ========================================================

    store_price = parse_price(
        product.current_price
    )


    if store_price is None:

        raise HTTPException(
            status_code=400,
            detail=(
                "The selected product has "
                "an invalid current price."
            )
        )


    # ========================================================
    # DEFAULT COMPETITOR RESULTS
    # ========================================================

    amazon_product = "N/A"
    amazon_price = None

    flipkart_product = "N/A"
    flipkart_price = None


    # ========================================================
    # AMAZON
    # ========================================================

    try:

        print(
            f"\n[Profitability] Searching Amazon "
            f"for: {product.name}"
        )

        amazon_data = scrape_competitor_price(
            product.name
        )


        if amazon_data:

            amazon_product = (
                amazon_data.get(
                    "Amazon Product"
                )
                or "N/A"
            )


            amazon_price = parse_price(
                amazon_data.get(
                    "Price"
                )
            )


        print(
            "[Profitability] Amazon:",
            amazon_product,
            amazon_price
        )


    except Exception as e:

        print(
            "[Profitability] Amazon scraper error:",
            str(e)
        )

        amazon_product = "N/A"
        amazon_price = None


    # ========================================================
    # FLIPKART
    # ========================================================

    try:

        print(
            f"\n[Profitability] Searching Flipkart "
            f"for: {product.name}"
        )

        flipkart_data = scrape_flipkart_product(
            product.name
        )


        if flipkart_data:

            flipkart_product = (
                flipkart_data.get(
                    "Flipkart Product"
                )
                or "N/A"
            )


            flipkart_price = parse_price(
                flipkart_data.get(
                    "Price"
                )
            )


        print(
            "[Profitability] Flipkart:",
            flipkart_product,
            flipkart_price
        )


    except Exception as e:

        print(
            "[Profitability] Flipkart scraper error:",
            str(e)
        )

        flipkart_product = "N/A"
        flipkart_price = None


    # ========================================================
    # COMPETITOR PRICE LIST
    # ========================================================

    competitor_prices = []

    if amazon_price is not None:

        competitor_prices.append(
            amazon_price
        )

    if flipkart_price is not None:

        competitor_prices.append(
            flipkart_price
        )


    # ========================================================
    # MARKET CALCULATIONS
    # ========================================================

    lowest_competitor = None
    highest_competitor = None
    competitor_average = None


    if competitor_prices:

        lowest_competitor = min(
            competitor_prices
        )

        highest_competitor = max(
            competitor_prices
        )

        competitor_average = (
            sum(competitor_prices)
            / len(competitor_prices)
        )


    # ========================================================
    # STORE VS AMAZON
    #
    # Positive:
    # Your price is HIGHER than Amazon.
    #
    # Negative:
    # Your price is LOWER than Amazon.
    # ========================================================

    store_vs_amazon = None

    if amazon_price is not None:

        store_vs_amazon = (
            store_price
            - amazon_price
        )


    # ========================================================
    # STORE VS FLIPKART
    # ========================================================

    store_vs_flipkart = None

    if flipkart_price is not None:

        store_vs_flipkart = (
            store_price
            - flipkart_price
        )


    # ========================================================
    # STORE VS MARKET AVERAGE
    # ========================================================

    store_vs_average = None

    if competitor_average is not None:

        store_vs_average = (
            store_price
            - competitor_average
        )


    # ========================================================
    # MARKET POSITION
    # ========================================================

    market_position = "No Competitor Data"


    if competitor_average is not None:

        if store_price < lowest_competitor:

            market_position = "Below Market"

        elif store_price > highest_competitor:

            market_position = "Above Market"

        else:

            market_position = "Within Market"


    # ========================================================
    # COMPETITIVENESS
    # ========================================================

    competitiveness = "No competitor data"


    if competitor_average is not None:

        difference_percentage = (
            (
                store_price
                - competitor_average
            )
            / competitor_average
        ) * 100


        if difference_percentage <= -5:

            competitiveness = (
                "Highly Competitive"
            )

        elif difference_percentage < 0:

            competitiveness = (
                "Competitive Price"
            )

        elif difference_percentage <= 5:

            competitiveness = (
                "Near Market Price"
            )

        else:

            competitiveness = (
                "Above Market Price"
            )


    # ========================================================
    # POTENTIAL GAIN VS LOWEST
    #
    # If your store price is below the lowest
    # competitor, this represents potential additional
    # price value available.
    # ========================================================

    potential_gain_vs_lowest = None


    if lowest_competitor is not None:

        potential_gain_vs_lowest = (
            lowest_competitor
            - store_price
        )


    # ========================================================
    # POTENTIAL GAIN VS AVERAGE
    # ========================================================

    potential_gain_vs_average = None


    if competitor_average is not None:

        potential_gain_vs_average = (
            competitor_average
            - store_price
        )


    # ========================================================
    # RECOMMENDED PRICE
    # ========================================================

    recommended_price = store_price


    if competitor_average is not None:

        # ----------------------------------------------------
        # If store is significantly below market,
        # move closer to market while maintaining
        # a small competitive advantage.
        # ----------------------------------------------------

        if store_price < competitor_average:

            recommended_price = min(
                competitor_average,
                store_price * 1.05
            )


        # ----------------------------------------------------
        # If store is significantly above market,
        # move closer to market.
        # ----------------------------------------------------

        elif store_price > competitor_average:

            recommended_price = max(
                competitor_average,
                store_price * 0.95
            )


        # ----------------------------------------------------
        # Already close to market.
        # ----------------------------------------------------

        else:

            recommended_price = store_price


    recommended_price = rounded(
        recommended_price
    )


    # ========================================================
    # PRICE DIFFERENCE PERCENTAGES
    # ========================================================

    store_vs_amazon_percentage = None

    if amazon_price is not None:

        store_vs_amazon_percentage = (
            (
                store_price
                - amazon_price
            )
            / amazon_price
        ) * 100


    store_vs_flipkart_percentage = None

    if flipkart_price is not None:

        store_vs_flipkart_percentage = (
            (
                store_price
                - flipkart_price
            )
            / flipkart_price
        ) * 100


    store_vs_average_percentage = None

    if competitor_average is not None:

        store_vs_average_percentage = (
            (
                store_price
                - competitor_average
            )
            / competitor_average
        ) * 100


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    return {

        # ----------------------------------------------------
        # PRODUCT
        # ----------------------------------------------------

        "product": {

            "id": product.id,

            "name": product.name,

            "category": product.category,

            "stock": product.stock

        },


        # ----------------------------------------------------
        # STORE
        # ----------------------------------------------------

        "store": {

            "price": rounded(
                store_price
            )

        },


        # ----------------------------------------------------
        # AMAZON
        # ----------------------------------------------------

        "amazon": {

            "product": amazon_product,

            "price": rounded(
                amazon_price
            )

        },


        # ----------------------------------------------------
        # FLIPKART
        # ----------------------------------------------------

        "flipkart": {

            "product": flipkart_product,

            "price": rounded(
                flipkart_price
            )

        },


        # ----------------------------------------------------
        # MARKET
        # ----------------------------------------------------

        "market": {

            "lowest_competitor":
                rounded(
                    lowest_competitor
                ),

            "highest_competitor":
                rounded(
                    highest_competitor
                ),

            "competitor_average":
                rounded(
                    competitor_average
                ),

            "store_vs_amazon":
                rounded(
                    store_vs_amazon
                ),

            "store_vs_flipkart":
                rounded(
                    store_vs_flipkart
                ),

            "store_vs_average":
                rounded(
                    store_vs_average
                ),

            "store_vs_amazon_percentage":
                rounded(
                    store_vs_amazon_percentage
                ),

            "store_vs_flipkart_percentage":
                rounded(
                    store_vs_flipkart_percentage
                ),

            "store_vs_average_percentage":
                rounded(
                    store_vs_average_percentage
                ),

            "market_position":
                market_position,

            "competitiveness":
                competitiveness

        },


        # ----------------------------------------------------
        # PROFITABILITY
        # ----------------------------------------------------

        "profitability": {

            "potential_gain_vs_lowest":
                rounded(
                    potential_gain_vs_lowest
                ),

            "potential_gain_vs_average":
                rounded(
                    potential_gain_vs_average
                )

        },


        # ----------------------------------------------------
        # RECOMMENDATION
        # ----------------------------------------------------

        "recommendation": {

            "recommended_price":
                recommended_price,

            "current_price":
                rounded(
                    store_price
                ),

            "price_change":
                rounded(
                    recommended_price
                    - store_price
                )

        }

    }