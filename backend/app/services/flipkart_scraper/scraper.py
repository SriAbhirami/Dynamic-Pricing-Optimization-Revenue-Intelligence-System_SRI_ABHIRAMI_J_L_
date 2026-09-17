from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
import time
import random
import os
import re


# ============================================================
# CONFIGURATION
# ============================================================

FLIPKART_URL = "https://www.flipkart.com"

PAGE_TIMEOUT = 60000

IS_RENDER = os.getenv("RENDER") is not None


# ============================================================
# HELPER
# ============================================================

def human_delay(min_sec=2, max_sec=4):
    """Mimic human-like delays."""
    time.sleep(
        random.uniform(
            min_sec,
            max_sec
        )
    )


# ============================================================
# PRICE EXTRACTION
# ============================================================

def extract_price_from_text(text):
    """
    Extract an Indian Rupee price from visible page text.

    Examples:
        ₹80,900
        ₹79,999
        Rs. 80,900
        INR 80,900
    """

    patterns = [
        r"₹\s*[\d,]+",
        r"Rs\.?\s*[\d,]+",
        r"INR\s*[\d,]+"
    ]

    for pattern in patterns:

        matches = re.findall(
            pattern,
            text,
            flags=re.IGNORECASE
        )

        if matches:

            return matches[0].strip()

    return "N/A"


# ============================================================
# BROWSER LAUNCH
# ============================================================

def launch_flipkart_browser(playwright):

    user_data_dir = os.path.join(
        os.getcwd(),
        "flipkart_session"
    )

    print("\n========================================")
    print("FLIPKART BROWSER CONFIGURATION")
    print("========================================")
    print(
        f"Render environment : {IS_RENDER}"
    )
    print(
        f"Headless mode      : {IS_RENDER}"
    )
    print(
        f"User data directory: {user_data_dir}"
    )
    print("========================================")

    browser = (
        playwright.chromium
        .launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=IS_RENDER,
            viewport={
                "width": 1366,
                "height": 768
            },
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-dev-shm-usage"
            ]
        )
    )

    return browser


# ============================================================
# STEALTH
# ============================================================

def apply_stealth(page):

    try:

        stealth = Stealth()

        stealth.apply_stealth_sync(
            page
        )

        print(
            "Playwright stealth applied."
        )

    except Exception as e:

        print(
            "Warning: Could not apply "
            f"stealth: {type(e).__name__}: {e}"
        )


# ============================================================
# FLIPKART COMPETITOR PRICE SCRAPER
# ============================================================

def scrape_flipkart_product(product_name):

    """
    Search Flipkart for a product and return
    the first related product and its current price.

    Current deployment version intentionally
    keeps first-result matching.

    Returns:

        {
            "Requested Product": "...",
            "Flipkart Product": "...",
            "Price": "₹..."
        }
    """

    result = {
        "Requested Product": product_name,
        "Flipkart Product": "N/A",
        "Price": "N/A"
    }

    browser = None

    with sync_playwright() as p:

        print("\n========================================")
        print("FLIPKART COMPETITOR SCRAPER")
        print("========================================")

        try:

            # =================================================
            # LAUNCH BROWSER
            # =================================================

            browser = launch_flipkart_browser(
                p
            )

            page = (
                browser.pages[0]
                if browser.pages
                else browser.new_page()
            )

            apply_stealth(
                page
            )

            # =================================================
            # OPEN FLIPKART
            # =================================================

            print(
                "\nOpening Flipkart..."
            )

            page.goto(
                FLIPKART_URL,
                wait_until="domcontentloaded",
                timeout=PAGE_TIMEOUT
            )

            human_delay(
                3,
                4
            )

            print(
                f"Current URL: {page.url}"
            )

            # =================================================
            # CLOSE LOGIN POPUP
            # =================================================

            close_buttons = [

                "button._2KpZ6l._2doB4z",

                "button[aria-label='Close']",

                "button[title='✕']"

            ]

            for selector in close_buttons:

                locator = page.locator(
                    selector
                )

                if locator.count() > 0:

                    try:

                        locator.first.click(
                            timeout=2000
                        )

                        human_delay(
                            1,
                            2
                        )

                        print(
                            "Flipkart popup closed."
                        )

                        break

                    except Exception:
                        pass

            # =================================================
            # SEARCH
            # =================================================

            print(
                f"\nSearching Flipkart for:"
            )

            print(
                product_name
            )

            search_box = page.locator(
                "input[name='q']"
            )

            if search_box.count() == 0:

                print(
                    "\n================================"
                )

                print(
                    "FLIPKART SEARCH BOX NOT FOUND"
                )

                print(
                    "================================"
                )

                print(
                    f"Current URL: {page.url}"
                )

                return result

            search_box.first.fill(
                product_name
            )

            human_delay(
                0.5,
                1
            )

            search_box.first.press(
                "Enter"
            )

            page.wait_for_load_state(
                "domcontentloaded",
                timeout=PAGE_TIMEOUT
            )

            human_delay(
                3,
                5
            )

            print(
                f"\nSearch URL:"
            )

            print(
                page.url
            )

            # =================================================
            # SEARCH RESULTS
            # =================================================

            print(
                "\nLooking for Flipkart products..."
            )

            products = page.locator(
                "div[data-id]"
            )

            product_count = products.count()

            print(
                f"Found {product_count} "
                f"product containers."
            )

            if product_count == 0:

                print(
                    "\nNo Flipkart products found."
                )

                print(
                    f"Current URL: {page.url}"
                )

                return result

            # =================================================
            # PRODUCT LINKS
            # =================================================

            print(
                "\nFinding Flipkart product links..."
            )

            links = page.locator(
                "a[href*='/p/']"
            )

            link_count = links.count()

            print(
                f"Found {link_count} "
                f"possible product links."
            )

            product_link = None

            for i in range(
                min(
                    link_count,
                    20
                )
            ):

                try:

                    href = (
                        links
                        .nth(i)
                        .get_attribute(
                            "href"
                        )
                    )

                    if (
                        href
                        and
                        "/p/" in href
                    ):

                        product_link = href

                        break

                except Exception:
                    continue

            if not product_link:

                print(
                    "\nCould not find a "
                    "Flipkart product link."
                )

                return result

            # =================================================
            # BUILD FULL URL
            # =================================================

            if product_link.startswith(
                "http"
            ):

                full_url = product_link

            else:

                full_url = (
                    FLIPKART_URL
                    + product_link
                )

            print(
                f"\nSelected product URL:"
            )

            print(
                full_url
            )

            # =================================================
            # OPEN PRODUCT PAGE
            # =================================================

            print(
                "\nOpening Flipkart product..."
            )

            page.goto(
                full_url,
                wait_until="domcontentloaded",
                timeout=PAGE_TIMEOUT
            )

            human_delay(
                4,
                5
            )

            print(
                f"Product URL: {page.url}"
            )

            # =================================================
            # PRODUCT TITLE
            # =================================================

            title_selectors = [

                "h1 span",

                "h1",

                "span.B_NuCI"

            ]

            for selector in title_selectors:

                locator = page.locator(
                    selector
                )

                if locator.count() == 0:
                    continue

                for i in range(
                    min(
                        locator.count(),
                        5
                    )
                ):

                    try:

                        title = (
                            locator
                            .nth(i)
                            .inner_text()
                            .strip()
                        )

                        if (
                            title
                            and
                            len(title) > 3
                        ):

                            result[
                                "Flipkart Product"
                            ] = title

                            break

                    except Exception:
                        continue

                if (
                    result[
                        "Flipkart Product"
                    ] != "N/A"
                ):

                    break

            # =================================================
            # PRICE SELECTORS
            # =================================================

            price_selectors = [

                "div.Nx9bqj",

                "div._30jeq3",

                "div._1_WHN1",

                "div[class*='Nx9']",

                "div[class*='price']",

                "span[class*='price']"

            ]

            for selector in price_selectors:

                locator = page.locator(
                    selector
                )

                if locator.count() == 0:
                    continue

                for i in range(
                    min(
                        locator.count(),
                        20
                    )
                ):

                    try:

                        text = (
                            locator
                            .nth(i)
                            .inner_text()
                            .strip()
                        )

                        if (
                            "₹" in text
                            and
                            re.search(
                                r"\d",
                                text
                            )
                        ):

                            result[
                                "Price"
                            ] = text

                            break

                    except Exception:
                        continue

                if (
                    result["Price"]
                    != "N/A"
                ):

                    break

            # =================================================
            # VISIBLE PAGE TEXT FALLBACK
            # =================================================

            if (
                result["Price"]
                == "N/A"
            ):

                print(
                    "\nPrice selectors did not "
                    "find the price."
                )

                print(
                    "Searching visible page text..."
                )

                try:

                    body_text = (
                        page.locator(
                            "body"
                        )
                        .inner_text()
                    )

                    extracted_price = (
                        extract_price_from_text(
                            body_text
                        )
                    )

                    if (
                        extracted_price
                        != "N/A"
                    ):

                        result[
                            "Price"
                        ] = extracted_price

                except Exception as e:

                    print(
                        "\nCould not read "
                        "Flipkart page text."
                    )

                    print(
                        f"Error type: "
                        f"{type(e).__name__}"
                    )

                    print(
                        f"Error message: {e}"
                    )

            # =================================================
            # FINAL RESULT
            # =================================================

            print(
                "\n========================================"
            )

            print(
                "FLIPKART COMPETITOR RESULT"
            )

            print(
                "========================================"
            )

            print(
                f"Requested Product : "
                f"{result['Requested Product']}"
            )

            print(
                f"Flipkart Product  : "
                f"{result['Flipkart Product']}"
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

            print(
                "\n========================================"
            )

            print(
                "FLIPKART SCRAPER ERROR"
            )

            print(
                "========================================"
            )

            print(
                f"Requested product: "
                f"{product_name}"
            )

            print(
                f"Error type: "
                f"{type(e).__name__}"
            )

            print(
                f"Error message: "
                f"{e}"
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