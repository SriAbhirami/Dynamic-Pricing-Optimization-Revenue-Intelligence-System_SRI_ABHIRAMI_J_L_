
import os
import requests


# ============================================================
# CONFIGURATION
# ============================================================

APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")

# Apify Actor ID used in our successful test
APIFY_ACTOR_ID = "AB1hagbwjvrVAF3TT"

APIFY_URL = (
    f"https://api.apify.com/v2/actors/"
    f"{APIFY_ACTOR_ID}/run-sync-get-dataset-items"
)


# ============================================================
# AMAZON COMPETITOR SCRAPER
# ============================================================

def scrape_competitor_price(product_name: str):
    """
    Fetch the first Amazon search result for the requested product
    using the Apify Amazon Search Scraper Actor.

    The Actor performs the actual Amazon scraping externally,
    so Render does not need to launch Chromium/Playwright.
    """

    product_name = product_name.strip()

    print("\n")
    print("=" * 60)
    print("AMAZON COMPETITOR SCRAPER - APIFY")
    print("=" * 60)
    print(f"Requested product: {product_name}")
    print("=" * 60)

    # --------------------------------------------------------
    # Validate API token
    # --------------------------------------------------------

    if not APIFY_API_TOKEN:
        print("ERROR: APIFY_API_TOKEN is not configured.")

        return {
            "Requested Product": product_name,
            "Amazon Product": "N/A",
            "Price": "N/A",
            "ASIN": "N/A",
            "URL": "N/A",
            "Error": "APIFY_API_TOKEN is not configured"
        }

    # --------------------------------------------------------
    # Actor input
    # --------------------------------------------------------

    actor_input = {
        "searchQueries": [product_name],
        "searchQuery": product_name,
        "country": "IN",
        "maxResultsPerQuery": 1,
        "maxSearchPages": 1,
        "includeSponsored": False
    }

    # --------------------------------------------------------
    # Headers
    # --------------------------------------------------------

    headers = {
        "Authorization": f"Bearer {APIFY_API_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        print("Starting Apify Actor...")
        print(f"Actor ID: {APIFY_ACTOR_ID}")
        print(f"Search query: {product_name}")

        # ----------------------------------------------------
        # Run Actor and wait for dataset results
        # ----------------------------------------------------

        response = requests.post(
            APIFY_URL,
            headers=headers,
            json=actor_input,
            params={
                "format": "json",
                "clean": "true",
                "limit": "1"
            },
            timeout=300
        )

        print(f"Apify HTTP status: {response.status_code}")

        # ----------------------------------------------------
        # Handle API errors
        # ----------------------------------------------------

        if response.status_code not in (200, 201):
            print("Apify request failed.")
            print(f"Response: {response.text[:1000]}")

            return {
                "Requested Product": product_name,
                "Amazon Product": "N/A",
                "Price": "N/A",
                "ASIN": "N/A",
                "URL": "N/A",
                "Error": f"Apify returned HTTP {response.status_code}"
            }

        # ----------------------------------------------------
        # Parse results
        # ----------------------------------------------------

        results = response.json()

        print(f"Apify returned {len(results)} result(s).")

        if not results:
            print("No Amazon products found.")

            return {
                "Requested Product": product_name,
                "Amazon Product": "N/A",
                "Price": "N/A",
                "ASIN": "N/A",
                "URL": "N/A",
                "Error": "No Amazon results found"
            }

        # ----------------------------------------------------
        # First Amazon result
        # ----------------------------------------------------

        first_result = results[0]

        asin = first_result.get("asin")
        price = first_result.get("price")
        amazon_url = first_result.get("url")
        title = first_result.get("title")

        print("\nFirst Amazon result:")
        print(f"Title: {title}")
        print(f"ASIN: {asin}")
        print(f"Price: {price}")
        print(f"URL: {amazon_url}")

        # ----------------------------------------------------
        # Price validation
        # ----------------------------------------------------

        if price is None:
            print("Amazon result does not contain a price.")

            return {
                "Requested Product": product_name,
                "Amazon Product": title or "N/A",
                "Price": "N/A",
                "ASIN": asin or "N/A",
                "URL": amazon_url or "N/A",
                "Error": "Amazon product price unavailable"
            }

        # ----------------------------------------------------
        # Final result
        # ----------------------------------------------------

        final_result = {
            "Requested Product": product_name,
            "Amazon Product": title or "Amazon Product",
            "Price": price,
            "ASIN": asin or "N/A",
            "URL": amazon_url or "N/A"
        }

        print("\n")
        print("=" * 60)
        print("AMAZON COMPETITOR RESULT")
        print("=" * 60)
        print(final_result)
        print("=" * 60)

        return final_result

    except requests.Timeout:
        print("Apify request timed out.")

        return {
            "Requested Product": product_name,
            "Amazon Product": "N/A",
            "Price": "N/A",
            "ASIN": "N/A",
            "URL": "N/A",
            "Error": "Apify request timed out"
        }

    except requests.RequestException as e:
        print("Apify network error:")
        print(f"{type(e).__name__}: {e}")

        return {
            "Requested Product": product_name,
            "Amazon Product": "N/A",
            "Price": "N/A",
            "ASIN": "N/A",
            "URL": "N/A",
            "Error": str(e)
        }

    except Exception as e:
        print("Unexpected Amazon scraper error:")
        print(f"{type(e).__name__}: {e}")

        return {
            "Requested Product": product_name,
            "Amazon Product": "N/A",
            "Price": "N/A",
            "ASIN": "N/A",
            "URL": "N/A",
            "Error": str(e)
        }

