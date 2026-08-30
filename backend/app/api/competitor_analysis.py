from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.amazon_scraper.scraper import advanced_amazon_scraper
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

    # --------------------------------------------------------
    # AMAZON
    # --------------------------------------------------------

    amazon_result = {
        "Product": "N/A",
        "Price": "N/A"
    }

    try:

        amazon_data = advanced_amazon_scraper(
            product_name,
            target_count=1
        )

        if amazon_data:

            first_product = amazon_data[0]

            amazon_result = {
                "Product": first_product.get(
                    "Title",
                    "N/A"
                ),
                "Price": first_product.get(
                    "Price",
                    "N/A"
                )
            }

    except Exception as e:

        print(
            f"Amazon scraping error: {e}"
        )


    # --------------------------------------------------------
    # FLIPKART
    # --------------------------------------------------------

    flipkart_result = {
        "Product": "N/A",
        "Price": "N/A"
    }

    try:

        flipkart_data = scrape_flipkart_product(
            product_name
        )

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

        print(
            f"Flipkart scraping error: {e}"
        )


    # --------------------------------------------------------
    # RETURN COMBINED RESULT
    # --------------------------------------------------------

    return {
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