from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
import time
import csv
import random
import os


# ============================================================
# CONFIGURATION
# ============================================================

AMAZON_URL = "https://www.amazon.in"

BROWSER_WIDTH = 1366
BROWSER_HEIGHT = 768

PAGE_TIMEOUT = 60000

# Render automatically provides the RENDER environment variable.
IS_RENDER = os.getenv("RENDER") is not None


# ============================================================
# HELPER
# ============================================================

def human_delay(min_sec=2, max_sec=4):
    """Mimic human reading delays."""
    time.sleep(random.uniform(min_sec, max_sec))


# ============================================================
# CAPTCHA / BLOCK DETECTION
# ============================================================

def captcha_detected(page):
    """
    Detect common Amazon CAPTCHA / verification pages.
    """

    try:
        captcha_form = page.locator(
            "form[action='/errors/validateCaptcha']"
        )

        if captcha_form.count() > 0:
            return True

        captcha_text = page.locator(
            "text=Enter the characters you see below"
        )

        if captcha_text.count() > 0:
            return True

        verify_text = page.locator(
            "text=Sorry, we just need to make sure you're not a robot"
        )

        if verify_text.count() > 0:
            return True

        return False

    except Exception:
        return False


def page_is_blocked(page):
    """
    Detect common Amazon blocking / challenge pages.
    """

    try:
        current_url = page.url.lower()

        if "captcha" in current_url:
            return True

        if "errors/validatecaptcha" in current_url:
            return True

        if captcha_detected(page):
            return True

        return False

    except Exception:
        return False


# ============================================================
# BROWSER LAUNCH
# ============================================================

def launch_amazon_browser(playwright):
    """
    Launch a persistent Chromium browser.

    Local:
        headed browser

    Render:
        headless browser
    """

    user_data_dir = os.path.join(
        os.getcwd(),
        "amazon_session"
    )

    print("\n========================================")
    print("AMAZON BROWSER CONFIGURATION")
    print("========================================")
    print(f"Render environment : {IS_RENDER}")
    print(f"Headless mode      : {IS_RENDER}")
    print(f"User data directory: {user_data_dir}")
    print("========================================")

    browser = playwright.chromium.launch_persistent_context(
        user_data_dir=user_data_dir,
        headless=IS_RENDER,
        viewport={
            "width": BROWSER_WIDTH,
            "height": BROWSER_HEIGHT
        },
        args=[
            "--disable-blink-features=AutomationControlled",
            "--no-sandbox",
            "--disable-dev-shm-usage"
        ]
    )

    return browser


# ============================================================
# STEALTH
# ============================================================

def apply_stealth(page):
    """
    Apply Playwright stealth configuration.
    """

    try:
        stealth = Stealth()
        stealth.apply_stealth_sync(page)

        print("Playwright stealth applied.")

    except Exception as e:

        print(
            f"Warning: Could not apply stealth: "
            f"{type(e).__name__}: {e}"
        )


# ============================================================
# CATEGORY / MULTIPLE PRODUCT SCRAPER
# ============================================================

def advanced_amazon_scraper(
    search_keyword,
    target_count=20
):

    results = []

    with sync_playwright() as p:

        print("\nLaunching Amazon category browser...")

        browser = launch_amazon_browser(p)

        page = (
            browser.pages[0]
            if browser.pages
            else browser.new_page()
        )

        apply_stealth(page)

        search_url = (
            f"{AMAZON_URL}/s?k="
            + search_keyword.replace(" ", "+")
        )

        while len(results) < target_count:

            print("\n----------------------------------------")
            print("Loading Amazon search page")
            print("----------------------------------------")
            print(f"Keyword: {search_keyword}")
            print(f"URL: {search_url}")

            try:

                page.goto(
                    search_url,
                    wait_until="domcontentloaded",
                    timeout=PAGE_TIMEOUT
                )

                human_delay(2, 3)

            except Exception as e:

                print("\nAMAZON SEARCH PAGE ERROR")
                print(f"Error type   : {type(e).__name__}")
                print(f"Error message: {e}")

                continue

            print(f"Loaded URL: {page.url}")

            # CAPTCHA / block
            if page_is_blocked(page):

                print("\n========================================")
                print("AMAZON CAPTCHA / BLOCK DETECTED")
                print("========================================")

                if IS_RENDER:

                    print(
                        "Running on Render."
                    )

                    print(
                        "Manual CAPTCHA solving is "
                        "not available."
                    )

                    browser.close()

                    return results

                else:

                    input(
                        "\nSolve the CAPTCHA in the browser "
                        "and press ENTER to continue..."
                    )

                    continue

            # ------------------------------------------------
            # SCROLLING
            # ------------------------------------------------

            print(
                "Scrolling to trigger lazy loading..."
            )

            for _ in range(4):

                page.mouse.wheel(0, 800)

                human_delay(0.5, 1.5)

            # ------------------------------------------------
            # PRODUCT LINKS
            # ------------------------------------------------

            print(
                "Extracting product URLs..."
            )

            try:

                product_links = page.evaluate(
                    """
                    () => {

                        const links = [];

                        document
                            .querySelectorAll('div[data-asin]')
                            .forEach(item => {

                                const asin =
                                    item.getAttribute('data-asin');

                                if (!asin) {
                                    return;
                                }

                                const aTag =
                                    item.querySelector(
                                        'a.a-link-normal'
                                    );

                                if (
                                    aTag &&
                                    aTag.href &&
                                    !aTag.href.includes(
                                        'javascript:'
                                    )
                                ) {

                                    links.push(aTag.href);

                                }

                            });

                        return [...new Set(links)];

                    }
                    """
                )

            except Exception as e:

                print(
                    "\nERROR EXTRACTING PRODUCT LINKS"
                )

                print(
                    f"Error type   : {type(e).__name__}"
                )

                print(
                    f"Error message: {e}"
                )

                continue

            print(
                f"Successfully found "
                f"{len(product_links)} unique product links."
            )

            if len(product_links) == 0:

                print(
                    "\nNo product links found."
                )

                if IS_RENDER:

                    print(
                        "Render environment: "
                        "cannot manually inspect browser."
                    )

                    browser.close()

                    return results

                input(
                    "Inspect the browser and press ENTER "
                    "to retry..."
                )

                continue

            # ------------------------------------------------
            # VISIT INDIVIDUAL PRODUCTS
            # ------------------------------------------------

            for link in product_links:

                if len(results) >= target_count:
                    break

                print("\n----------------------------------------")
                print("Opening product")
                print("----------------------------------------")
                print(link)

                try:

                    page.goto(
                        link,
                        wait_until="domcontentloaded",
                        timeout=PAGE_TIMEOUT
                    )

                    human_delay(2, 4)

                    if page_is_blocked(page):

                        print(
                            "CAPTCHA / block detected "
                            "on product page."
                        )

                        if IS_RENDER:

                            print(
                                "Cannot manually solve CAPTCHA "
                                "on Render."
                            )

                            browser.close()

                            return results

                        input(
                            "Solve CAPTCHA and press ENTER..."
                        )

                    # ------------------------------------------------
                    # TITLE
                    # ------------------------------------------------

                    title = "N/A"

                    title_locator = page.locator(
                        "#productTitle"
                    )

                    if title_locator.count() > 0:

                        title = (
                            title_locator
                            .first
                            .inner_text()
                            .strip()
                        )

                    # ------------------------------------------------
                    # PRICE
                    # ------------------------------------------------

                    price = "N/A"

                    visible_selectors = [

                        ".priceToPay .a-price-whole",

                        "#corePriceDisplay_desktop_feature_div "
                        ".a-price-whole",

                        "#apex_desktop .a-price-whole"

                    ]

                    for selector in visible_selectors:

                        locator = page.locator(
                            selector
                        )

                        if locator.count() > 0:

                            extracted = (
                                locator
                                .first
                                .inner_text()
                                .strip()
                            )

                            if extracted:

                                price = f"₹{extracted}"

                                break

                    # ------------------------------------------------
                    # FALLBACK PRICE
                    # ------------------------------------------------

                    if price == "N/A":

                        hidden_selectors = [

                            "#corePriceDisplay_desktop_feature_div "
                            ".a-offscreen",

                            ".a-price .a-offscreen"

                        ]

                        for selector in hidden_selectors:

                            locator = page.locator(
                                selector
                            )

                            if locator.count() > 0:

                                extracted = (
                                    locator
                                    .first
                                    .text_content()
                                )

                                if extracted:

                                    extracted = (
                                        extracted.strip()
                                    )

                                    if extracted:

                                        price = extracted

                                        break

                    # ------------------------------------------------
                    # SAVE
                    # ------------------------------------------------

                    results.append(
                        {
                            "Title": title,
                            "Price": price
                        }
                    )

                    print(
                        f"[{len(results)}/"
                        f"{target_count}] "
                        f"Saved:"
                    )

                    print(
                        f"Title : {title}"
                    )

                    print(
                        f"Price : {price}"
                    )

                except Exception as e:

                    print(
                        "\nERROR SCRAPING AMAZON PRODUCT"
                    )

                    print(
                        f"Error type   : {type(e).__name__}"
                    )

                    print(
                        f"Error message: {e}"
                    )

                    continue

            # ------------------------------------------------
            # PAGINATION
            # ------------------------------------------------

            if len(results) < target_count:

                try:

                    next_button = page.locator(
                        ".s-pagination-next"
                    )

                    if next_button.count() == 0:

                        print(
                            "\nNo next page found."
                        )

                        break

                    button_class = (
                        next_button
                        .first
                        .get_attribute("class")
                        or ""
                    )

                    if (
                        "s-pagination-disabled"
                        in button_class
                    ):

                        print(
                            "\nReached the end "
                            "of Amazon search results."
                        )

                        break

                    next_path = (
                        next_button
                        .first
                        .get_attribute("href")
                    )

                    if not next_path:

                        print(
                            "\nNext page has no URL."
                        )

                        break

                    if next_path.startswith("http"):

                        search_url = next_path

                    else:

                        search_url = (
                            AMAZON_URL
                            + next_path
                        )

                    print(
                        "\nMoving to next Amazon page..."
                    )

                except Exception as e:

                    print(
                        "\nPAGINATION ERROR"
                    )

                    print(
                        f"Error type   : {type(e).__name__}"
                    )

                    print(
                        f"Error message: {e}"
                    )

                    break

        browser.close()

    return results


# ============================================================
# SPECIFIC PRODUCT / COMPETITOR PRICE SCRAPER
# ============================================================

def scrape_competitor_price(product_name):

    """
    Search Amazon for a specific product.

    Current deployment version intentionally uses
    the first Amazon search result.

    Exact product matching can be improved separately
    after Playwright deployment is confirmed.
    """

    result = {
        "Requested Product": product_name,
        "Amazon Product": "N/A",
        "Price": "N/A"
    }

    with sync_playwright() as p:

        print("\n========================================")
        print("AMAZON COMPETITOR SCRAPER")
        print("========================================")

        browser = None

        try:

            browser = launch_amazon_browser(p)

            page = (
                browser.pages[0]
                if browser.pages
                else browser.new_page()
            )

            apply_stealth(page)

            # ------------------------------------------------
            # OPEN AMAZON
            # ------------------------------------------------

            print("\nOpening Amazon India...")

            page.goto(
                AMAZON_URL,
                wait_until="domcontentloaded",
                timeout=PAGE_TIMEOUT
            )

            human_delay(2, 3)

            print(
                f"Amazon URL after opening: {page.url}"
            )

            # ------------------------------------------------
            # CAPTCHA / BLOCK
            # ------------------------------------------------

            if page_is_blocked(page):

                print("\n========================================")
                print("AMAZON CAPTCHA / BLOCK DETECTED")
                print("========================================")

                if IS_RENDER:

                    print(
                        "Render environment detected."
                    )

                    print(
                        "Returning N/A because CAPTCHA "
                        "cannot be manually solved."
                    )

                    return result

                input(
                    "Solve the CAPTCHA in the browser "
                    "and press ENTER..."
                )

            # ------------------------------------------------
            # SEARCH
            # ------------------------------------------------

            print(
                f"\nSearching Amazon for:"
            )

            print(
                f"{product_name}"
            )

            search_box = page.locator(
                "#twotabsearchtextbox"
            )

            if search_box.count() == 0:

                print(
                    "\nAmazon search box was not found."
                )

                print(
                    f"Current URL: {page.url}"
                )

                return result

            search_box.fill(
                product_name
            )

            search_box.press(
                "Enter"
            )

            page.wait_for_load_state(
                "domcontentloaded",
                timeout=PAGE_TIMEOUT
            )

            human_delay(2, 3)

            print(
                f"\nAmazon search URL:"
            )

            print(
                page.url
            )

            # ------------------------------------------------
            # CAPTCHA AFTER SEARCH
            # ------------------------------------------------

            if page_is_blocked(page):

                print("\n========================================")
                print("CAPTCHA / BLOCK AFTER AMAZON SEARCH")
                print("========================================")

                if IS_RENDER:

                    print(
                        "Render environment detected."
                    )

                    print(
                        "Cannot manually solve CAPTCHA."
                    )

                    return result

                input(
                    "Solve the CAPTCHA and press ENTER..."
                )

            # ------------------------------------------------
            # FIND SEARCH RESULTS
            # ------------------------------------------------

            print(
                "\nSearching for Amazon product cards..."
            )

            products = page.locator(
                'div[data-component-type="s-search-result"]'
            )

            product_count = products.count()

            print(
                f"Amazon result cards found: "
                f"{product_count}"
            )

            if product_count == 0:

                print(
                    "\nNo Amazon search results found."
                )

                print(
                    f"Current URL: {page.url}"
                )

                return result

            # ------------------------------------------------
            # FIRST RESULT
            # ------------------------------------------------

            first_product = products.first

            # ------------------------------------------------
            # PRODUCT TITLE
            # ------------------------------------------------

            title_locator = first_product.locator(
                "h2 span"
            )

            if title_locator.count() > 0:

                title = (
                    title_locator
                    .last
                    .inner_text()
                    .strip()
                )

                result["Amazon Product"] = title

            else:

                print(
                    "\nAmazon product title selector "
                    "did not find a title."
                )

            # ------------------------------------------------
            # PRICE
            # ------------------------------------------------

            price_locator = first_product.locator(
                ".a-price .a-offscreen"
            ).first

            if price_locator.count() > 0:

                price = (
                    price_locator
                    .inner_text()
                    .strip()
                )

                if price:

                    result["Price"] = price

            else:

                whole_price = first_product.locator(
                    ".a-price-whole"
                ).first

                if whole_price.count() > 0:

                    price = (
                        whole_price
                        .inner_text()
                        .strip()
                    )

                    if price:

                        result["Price"] = (
                            f"₹{price}"
                        )

            # ------------------------------------------------
            # FINAL RESULT
            # ------------------------------------------------

            print("\n========================================")
            print("AMAZON COMPETITOR RESULT")
            print("========================================")

            print(
                f"Requested Product : "
                f"{result['Requested Product']}"
            )

            print(
                f"Amazon Product    : "
                f"{result['Amazon Product']}"
            )

            print(
                f"Competitor Price  : "
                f"{result['Price']}"
            )

            print(
                "========================================"
            )

            return result

        except Exception as e:

            print("\n========================================")
            print("AMAZON SCRAPER ERROR")
            print("========================================")

            print(
                f"Requested product: {product_name}"
            )

            print(
                f"Error type: {type(e).__name__}"
            )

            print(
                f"Error message: {e}"
            )

            print(
                "========================================"
            )

            return result

        finally:

            if browser is not None:

                try:
                    browser.close()
                except Exception:
                    pass


# ============================================================
# SAVE CATEGORY RESULTS TO CSV
# ============================================================

def save_category_results(data, filename):

    """
    Save category scraper results to CSV.
    """

    if not filename.endswith(".csv"):

        filename += ".csv"

    with open(
        filename,
        "w",
        newline="",
        encoding="utf-8"
    ) as f:

        writer = csv.DictWriter(
            f,
            fieldnames=[
                "Title",
                "Price"
            ]
        )

        writer.writeheader()

        writer.writerows(data)

    print(
        f"\nSuccessfully saved "
        f"{len(data)} items to {filename}"
    )


# ============================================================
# MAIN PROGRAM
# ============================================================

if __name__ == "__main__":

    print(
        "\n======================================"
    )

    print(
        "       AMAZON TERMINAL SCRAPER"
    )

    print(
        "======================================"
    )

    print(
        f"\nRender environment: {IS_RENDER}"
    )

    print(
        "\nChoose scraping mode:"
    )

    print(
        "1. Category / Multiple Products"
    )

    print(
        "2. Specific Product / Competitor Price"
    )

    choice = input(
        "\nEnter your choice (1 or 2): "
    ).strip()

    # ========================================================
    # MODE 1
    # ========================================================

    if choice == "1":

        print(
            "\n=== Category Scraping Mode ==="
        )

        keyword = input(
            "Enter the product keyword "
            "(e.g., laptops, tv, rings): "
        ).strip()

        if not keyword:

            print(
                "No keyword provided. "
                "Defaulting to 'laptops'."
            )

            keyword = "laptops"

        raw_count = input(
            "Enter the number of products "
            "(e.g., 20): "
        ).strip()

        try:

            target_count = int(
                raw_count
            )

            if target_count <= 0:
                raise ValueError

        except ValueError:

            print(
                "Invalid number. "
                "Defaulting to 20."
            )

            target_count = 20

        filename = input(
            "Enter CSV filename "
            "(e.g., data.csv): "
        ).strip()

        if not filename:

            filename = "amazon_data.csv"

        elif not filename.endswith(".csv"):

            filename += ".csv"

        print(
            f"\nStarting extraction for: "
            f"'{keyword}'"
        )

        print(
            f"Targeting {target_count} items."
        )

        print(
            f"Output file: {filename}\n"
        )

        data = advanced_amazon_scraper(
            keyword,
            target_count=target_count
        )

        if data:

            save_category_results(
                data,
                filename
            )

        else:

            print(
                "\nScraper finished, "
                "but no data was collected."
            )

    # ========================================================
    # MODE 2
    # ========================================================

    elif choice == "2":

        print(
            "\n=== Specific Product Mode ==="
        )

        product_name = input(
            "Enter the product name "
            "(e.g., Oppo Reno 13 5G): "
        ).strip()

        if not product_name:

            print(
                "\nNo product name provided."
            )

        else:

            scrape_competitor_price(
                product_name
            )

    # ========================================================
    # INVALID
    # ========================================================

    else:

        print(
            "\nInvalid option."
        )

        print(
            "Please run the scraper again "
            "and select 1 or 2."
        )