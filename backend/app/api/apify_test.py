from fastapi import APIRouter
from app.services.amazon_scraper.scraper import scrape_competitor_price

router = APIRouter(
    prefix="/apify-test",
    tags=["Apify Test"]
)


@router.get("")
def test_apify():
    print("=" * 60, flush=True)
    print("APIFY TEST STARTED", flush=True)
    print("=" * 60)

    try:
        result = scrape_competitor_price("OnePlus Nord CE6")

        print("APIFY TEST RESULT:", result, flush=True)

        return {
            "status": "success",
            "result": result
        }

    except Exception as e:
        print("APIFY TEST FAILED", flush=True)
        print(f"Error type: {type(e).__name__}", flush=True)
        print(f"Error: {e}", flush=True)

        return {
            "status": "failed",
            "error_type": type(e).__name__,
            "error": str(e)
        }