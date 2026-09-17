from fastapi import APIRouter
from playwright.sync_api import sync_playwright


router = APIRouter(
    prefix="/playwright-test",
    tags=["Playwright Test"]
)


@router.get("")
def test_playwright():

    print("=" * 60, flush=True)
    print("PLAYWRIGHT TEST STARTED", flush=True)
    print("=" * 60, flush=True)

    try:

        with sync_playwright() as p:

            print("Launching Chromium...", flush=True)

            browser = p.chromium.launch(
                headless=True,
                args=[
                    "--no-sandbox",
                    "--disable-dev-shm-usage"
                ]
            )

            print("Chromium launched successfully.", flush=True)

            page = browser.new_page()

            print("Opening test page...", flush=True)

            page.goto(
                "https://example.com",
                wait_until="domcontentloaded",
                timeout=30000
            )

            title = page.title()

            print(f"Page title: {title}", flush=True)

            browser.close()

            print("Browser closed successfully.", flush=True)

            return {
                "status": "success",
                "message": "Playwright and Chromium are working on Render.",
                "page_title": title
            }

    except Exception as e:

        print("=" * 60, flush=True)
        print("PLAYWRIGHT TEST FAILED", flush=True)
        print(f"Error type: {type(e).__name__}", flush=True)
        print(f"Error message: {e}", flush=True)
        print("=" * 60, flush=True)

        return {
            "status": "failed",
            "error_type": type(e).__name__,
            "error": str(e)
        }