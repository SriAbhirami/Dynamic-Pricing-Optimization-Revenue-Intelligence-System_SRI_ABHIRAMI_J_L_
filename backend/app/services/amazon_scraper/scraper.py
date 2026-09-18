import os
import requests


REEF_API_URL = "https://api.reefapi.com"
AMAZON_SEARCH_URL = f"{REEF_API_URL}/amazon/v1/search"


def scrape_competitor_price(product_name: str):
    """
    Search Amazon India using ReefAPI and use the first result.
    """

    api_key = os.getenv("REEF_API_KEY")

    if not api_key:
        raise RuntimeError(
            "REEF_API_KEY environment variable is not configured."
        )

    product_name = product_name.strip()

    if not product_name:
        raise ValueError("Product name cannot be empty.")

    print("\n" + "=" * 60)
    print("REEFAPI AMAZON SEARCH")
    print("=" * 60)
    print(f"Requested product: {product_name}")

    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "query": product_name,
        "marketplace": "in",
    }

    response = requests.post(
        AMAZON_SEARCH_URL,
        headers=headers,
        json=payload,
        timeout=45,
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("ok"):
        raise RuntimeError(
            data.get("error") or "Amazon ReefAPI search failed."
        )

    results = data.get("data", {}).get("results", [])

    if not results:
        raise RuntimeError(
            f"No Amazon results found for '{product_name}'."
        )

    # ---------------------------------------------------------
    # FIRST AMAZON RESULT
    # ---------------------------------------------------------

    product = results[0]

    title = product.get("title") or "N/A"
    price = product.get("price")
    asin = product.get("asin") or "N/A"
    url = product.get("url")

    if not url and asin != "N/A":
        url = f"https://www.amazon.in/dp/{asin}"

    if price is None:
        raise RuntimeError(
            f"Amazon first result '{title}' has no price."
        )

    print("\nAmazon first result:")
    print(f"Product: {title}")
    print(f"Price: {price}")
    print(f"ASIN: {asin}")
    print(f"URL: {url}")
    print("=" * 60)

    return {
        "Amazon Product": title,
        "Price": price,
        "ASIN": asin,
        "URL": url or "N/A",
    }