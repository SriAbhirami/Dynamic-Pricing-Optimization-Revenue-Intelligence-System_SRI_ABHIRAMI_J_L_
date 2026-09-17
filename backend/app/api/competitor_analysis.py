from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.amazon_scraper.scraper import scrape_competitor_price
from app.services.flipkart_scraper.scraper import scrape_flipkart_product


router = APIRouter(
    prefix="/competitor-pricing",
    tags=["Competitor Pricing"]
)


# ============================================================
# REQUEST MODEL
# ============================================================

class CompetitorPricingRequest(BaseModel):
    product_name: str


# ============================================================
# COMPETITOR PRICING ENDPOINT
# ============================================================

@router.post("/compare")
def compare_competitor_prices(
    request: CompetitorPricingRequest
):

    product_name = request.product_name.strip()

    if not product_name:
        raise HTTPException(
            status_code=400,
            detail="Product name cannot be empty"
        )

    print("\n")
    print("=" * 60)
    print("COMPETITOR PRICING REQUEST")
    print("=" * 60)
    print(f"Requested product: {product_name}")
    print("=" * 60)


    # ========================================================
    # AMAZON
    # ========================================================

    amazon_result = {
        "Product": "N/A",
        "Price": "N/A"
    }

    try:

        print("\nStarting Amazon competitor scraper...")

        amazon_data = scrape_competitor_price(
            product_name
        )

        print("\nAmazon scraper returned:")
        print(amazon_data)

        amazon_result = {
            "Product": amazon_data.get(
                "Amazon Product",
                "N/A"
            ),
            "Price": amazon_data.get(
                "Price",
                "N/A"
            )
        }

    except Exception as e:

        print("\nAmazon scraping error:")
        print(f"{type(e).__name__}: {e}")


    # ========================================================
    # FLIPKART
    # ========================================================

    flipkart_result = {
        "Product": "N/A",
        "Price": "N/A"
    }

    try:

        print("\nStarting Flipkart competitor scraper...")

        flipkart_data = scrape_flipkart_product(
            product_name
        )

        print("\nFlipkart scraper returned:")
        print(flipkart_data)

        flipkart_result = {
            "Product": flipkart_data.get(
                "Flipkart Product",
                "N/A"
            ),
            "Price": flipkart_data.get(
                "Price",
                "N/A"
            )
        }

    except Exception as e:

        print("\nFlipkart scraping error:")
        print(f"{type(e).__name__}: {e}")


    # ========================================================
    # FINAL RESPONSE
    # ========================================================

    final_result = {
        "requested_product": product_name,

        "competitors": [

            {
                "platform": "Amazon",
                "product": amazon_result["Product"],
                "price": amazon_result["Price"]
            },

            {
                "platform": "Flipkart",
                "product": flipkart_result["Product"],
                "price": flipkart_result["Price"]
            }

        ]
    }

    print("\n")
    print("=" * 60)
    print("COMPETITOR PRICING FINAL RESULT")
    print("=" * 60)
    print(final_result)
    print("=" * 60)

    return final_result