from playwright.sync_api import sync_playwright


product_name = "Nike Revolution 7"


with sync_playwright() as p:

    browser = p.chromium.launch(headless=True)

    page = browser.new_page()

    # Open Amazon India
    page.goto(
        "https://www.amazon.in",
        wait_until="domcontentloaded",
        timeout=60000
    )

    # Search for the product
    search_box = page.locator("#twotabsearchtextbox")

    search_box.fill(product_name)

    search_box.press("Enter")

    # Wait for the search results page
    page.wait_for_load_state(
        "domcontentloaded",
        timeout=60000
    )

    # Get the first product result
    first_product = page.locator(
        'div[data-component-type="s-search-result"]'
    ).first

    # Extract the complete product title
    product_title = first_product.locator(
        "h2 span"
    ).last.inner_text()

    # Extract the price
    price_locator = first_product.locator(
        ".a-price .a-offscreen"
    ).first

    if price_locator.count() > 0:
        price = price_locator.inner_text()
    else:
        price = "Price not available"

    print("\n-----------------------------")
    print("Amazon Product Information")
    print("-----------------------------")
    print("Requested Product :", product_name)
    print("Found Product     :", product_title)
    print("Price             :", price)
    print("-----------------------------")

    browser.close()