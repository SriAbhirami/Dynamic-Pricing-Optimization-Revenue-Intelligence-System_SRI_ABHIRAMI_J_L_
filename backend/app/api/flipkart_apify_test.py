from fastapi import APIRouter
from app.services.flipkart_scraper.scraper import scrape_flipkart_product

router = APIRouter(
    prefix="/flipkart-apify-test",
    tags=["Flipkart Apify Test"]
)


@router.get("")
def test_flipkart_apify():
    print("=" * 60, flush=True)
    print("FLIPKART APIFY TEST STARTED", flush=True)
    print("=" * 60)

    try:
        result = scrape_flipkart_product("One Plus Nord CE6")

        print("FLIPKART APIFY TEST RESULT:", result, flush=True)

        return {
            "status": "success",
            "result": result
        }

    except Exception as e:
        print("FLIPKART APIFY TEST FAILED", flush=True)
        print(f"Error type: {type(e).__name__}", flush=True)
        print(f"Error: {e}", flush=True)

        return {
            "status": "failed",
            "error_type": type(e).__name__,
            "error": str(e)
        }