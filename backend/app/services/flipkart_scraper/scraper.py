import os
import requests


REEF_API_URL = "https://api.reefapi.com"
FLIPKART_SEARCH_URL = f"{REEF_API_URL}/flipkart/v1/search"


def scrape_flipkart_product(product_name: str):
    """
    Search Flipkart using ReefAPI and use the first result.
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
    print("REEFAPI FLIPKART SEARCH")
    print("=" * 60)
    print(f"Requested product: {product_name}")

    headers = {
        "x-api-key": api_key,
        "Content-Type": "application/json",
    }

    payload = {
        "q": product_name,
        "page": 1,
    }

    response = requests.post(
        FLIPKART_SEARCH_URL,
        headers=headers,
        json=payload,
        timeout=45,
    )

    response.raise_for_status()

    data = response.json()

    if not data.get("ok"):
        raise RuntimeError(
            data.get("error") or "Flipkart ReefAPI search failed."
        )

    results = data.get("data", {}).get("results", [])

    if not results:
        raise RuntimeError(
            f"No Flipkart results found for '{product_name}'."
        )

    # ---------------------------------------------------------
    # FIRST FLIPKART RESULT
    # ---------------------------------------------------------

    product = results[0]

    title = product.get("title") or "N/A"
    price = product.get("price")
    product_id = product.get("product_id") or "N/A"
    url = product.get("url") or "N/A"

    if price is None:
        raise RuntimeError(
            f"Flipkart first result '{title}' has no price."
        )

    print("\nFlipkart first result:")
    print(f"Product: {title}")
    print(f"Price: {price}")
    print(f"Product ID: {product_id}")
    print(f"URL: {url}")
    print("=" * 60)

    return {
        "Flipkart Product": title,
        "Price": price,
        "Product ID": product_id,
        "URL": url,
    }