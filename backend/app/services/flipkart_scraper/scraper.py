import os
import requests


# ============================================================
# CONFIGURATION
# ============================================================

APIFY_API_TOKEN = os.getenv("APIFY_API_TOKEN")

APIFY_ACTOR_ID = "S8WYPuFl8SWsfvLXG"

APIFY_URL = (
    f"https://api.apify.com/v2/actors/"
    f"{APIFY_ACTOR_ID}/run-sync-get-dataset-items"
)


# ============================================================
# FLIPKART COMPETITOR SCRAPER
# ============================================================

def scrape_flipkart_product(product_name: str):
    """
    Fetch the first Flipkart search result using Apify.
    """

    product_name = product_name.strip()

    print("\n")
    print("=" * 60)
    print("FLIPKART COMPETITOR SCRAPER - APIFY")
    print("=" * 60)
    print(f"Requested product: {product_name}")
    print("=" * 60)

    # --------------------------------------------------------
    # Check Apify token
    # --------------------------------------------------------

    if not APIFY_API_TOKEN:
        print("ERROR: APIFY_API_TOKEN is not configured.")

        return {
            "Requested Product": product_name,
            "Flipkart Product": "N/A",
            "Price": "N/A",
            "Product ID": "N/A",
            "URL": "N/A",
            "Error": "APIFY_API_TOKEN is not configured"
        }

    # --------------------------------------------------------
    # Flipkart Actor input
    # --------------------------------------------------------

    actor_input = {
        "keyword": product_name,
        "maxItems": 1
    }

    headers = {
        "Authorization": f"Bearer {APIFY_API_TOKEN}",
        "Content-Type": "application/json"
    }

    try:
        print("Starting Flipkart Apify Actor...")
        print(f"Actor ID: {APIFY_ACTOR_ID}")
        print(f"Search keyword: {product_name}")

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
        # Check HTTP response
        # ----------------------------------------------------

        if response.status_code not in (200, 201):
            print("Flipkart Apify request failed.")
            print(f"Response: {response.text[:1000]}")

            return {
                "Requested Product": product_name,
                "Flipkart Product": "N/A",
                "Price": "N/A",
                "Product ID": "N/A",
                "URL": "N/A",
                "Error": f"Apify returned HTTP {response.status_code}"
            }

        # ----------------------------------------------------
        # Parse response
        # ----------------------------------------------------

        results = response.json()

        print(f"Apify returned {len(results)} result(s).")

        if not isinstance(results, list):
            print("Unexpected Apify response format.")

            return {
                "Requested Product": product_name,
                "Flipkart Product": "N/A",
                "Price": "N/A",
                "Product ID": "N/A",
                "URL": "N/A",
                "Error": "Unexpected Apify response format"
            }

        if not results:
            print("No Flipkart products found.")

            return {
                "Requested Product": product_name,
                "Flipkart Product": "N/A",
                "Price": "N/A",
                "Product ID": "N/A",
                "URL": "N/A",
                "Error": "No Flipkart results found"
            }

        # ----------------------------------------------------
        # First Flipkart result
        # ----------------------------------------------------

        first_result = results[0]

        titles = first_result.get("titles") or {}
        pricing = first_result.get("pricing") or {}

        product_title = (
            titles.get("title")
            or titles.get("new_title")
            or "Flipkart Product"
        )

        product_id = first_result.get("id")

        base_url = first_result.get("base_url")

        # ----------------------------------------------------
        # Extract current selling price
        # ----------------------------------------------------

        prices = pricing.get("prices") or []

        price = None

        # Prefer the current selling price
        # rather than the strike-off/MRP price.
        for price_item in prices:
            if price_item.get("strike_off") is False:
                price = price_item.get("value")
                break

        # Fallback
        if price is None and prices:
            price = prices[0].get("value")

        # ----------------------------------------------------
        # Build Flipkart URL
        # ----------------------------------------------------

        flipkart_url = "N/A"

        if base_url:
            if base_url.startswith("http://") or base_url.startswith("https://"):
                flipkart_url = base_url
            else:
                flipkart_url = f"https://www.flipkart.com{base_url}"

        # ----------------------------------------------------
        # Print result
        # ----------------------------------------------------

        print("\nFirst Flipkart result:")
        print(f"Title: {product_title}")
        print(f"Product ID: {product_id}")
        print(f"Price: {price}")
        print(f"URL: {flipkart_url}")

        # ----------------------------------------------------
        # Price unavailable
        # ----------------------------------------------------

        if price is None:
            print("Flipkart product price unavailable.")

            return {
                "Requested Product": product_name,
                "Flipkart Product": product_title,
                "Price": "N/A",
                "Product ID": product_id or "N/A",
                "URL": flipkart_url,
                "Error": "Flipkart product price unavailable"
            }

        # ----------------------------------------------------
        # Final result
        # ----------------------------------------------------

        final_result = {
            "Requested Product": product_name,
            "Flipkart Product": product_title,
            "Price": price,
            "Product ID": product_id or "N/A",
            "URL": flipkart_url
        }

        print("\n")
        print("=" * 60)
        print("FLIPKART COMPETITOR RESULT")
        print("=" * 60)
        print(final_result)
        print("=" * 60)

        return final_result

    # --------------------------------------------------------
    # Timeout
    # --------------------------------------------------------

    except requests.Timeout:
        print("Flipkart Apify request timed out.")

        return {
            "Requested Product": product_name,
            "Flipkart Product": "N/A",
            "Price": "N/A",
            "Product ID": "N/A",
            "URL": "N/A",
            "Error": "Apify request timed out"
        }

    # --------------------------------------------------------
    # Network error
    # --------------------------------------------------------

    except requests.RequestException as e:
        print("Flipkart Apify network error:")
        print(f"{type(e).__name__}: {e}")

        return {
            "Requested Product": product_name,
            "Flipkart Product": "N/A",
            "Price": "N/A",
            "Product ID": "N/A",
            "URL": "N/A",
            "Error": str(e)
        }

    # --------------------------------------------------------
    # Unexpected error
    # --------------------------------------------------------

    except Exception as e:
        print("Unexpected Flipkart scraper error:")
        print(f"{type(e).__name__}: {e}")

        return {
            "Requested Product": product_name,
            "Flipkart Product": "N/A",
            "Price": "N/A",
            "Product ID": "N/A",
            "URL": "N/A",
            "Error": str(e)
        }