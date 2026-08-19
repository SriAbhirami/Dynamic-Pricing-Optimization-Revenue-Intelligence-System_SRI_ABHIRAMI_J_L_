from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
import time
import random
import os
import re


# ============================================================
# HELPER
# ============================================================

def human_delay(min_sec=2, max_sec=4):
    time.sleep(random.uniform(min_sec, max_sec))


# ============================================================
# FIND PRICE FROM PAGE TEXT
# ============================================================

def extract_price_from_text(text):
    """
    Find an Indian Rupee price from visible page text.

    Examples:
        ₹79,999
        ₹79,999
        ₹ 79,999
        Rs. 79,999
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
# FLIPKART SCRAPER
# ============================================================

def scrape_flipkart_product(product_name):

    result = {
        "Requested Product": product_name,
        "Flipkart Product": "N/A",
        "Price": "N/A"
    }

    user_data_dir = os.path.join(
        os.getcwd(),
        "flipkart_session"
    )

    with sync_playwright() as p:

        print("\nLaunching Flipkart browser...")

        browser = p.chromium.launch_persistent_context(
            user_data_dir=user_data_dir,
            headless=False,
            viewport={
                "width": 1366,
                "height": 768
            },
            args=[
                "--disable-blink-features=AutomationControlled"
            ]
        )

        stealth = Stealth()

        page = (
            browser.pages[0]
            if browser.pages
            else browser.new_page()
        )

        stealth.apply_stealth_sync(page)

        try:

            # =================================================
            # OPEN FLIPKART
            # =================================================

            print("\nOpening Flipkart...")

            page.goto(
                "https://www.flipkart.com",
                wait_until="domcontentloaded",
                timeout=60000
            )

            human_delay(3, 4)

            print(
                f"\nCurrent URL: {page.url}"
            )

            # =================================================
            # CLOSE LOGIN POPUP
            # =================================================

            close_buttons = [

                "button._2KpZ6l._2doB4z",

                "button[aria-label='Close']",

                "span[role='button']"

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

                        human_delay(1, 2)

                        break

                    except Exception:
                        pass

            # =================================================
            # SEARCH
            # =================================================

            print(
                f"\nSearching Flipkart for: "
                f"{product_name}"
            )

            search_box = page.locator(
                "input[name='q']"
            )

            if search_box.count() == 0:

                print(
                    "\nCould not find Flipkart "
                    "search box."
                )

                return result

            search_box.first.fill(
                product_name
            )

            search_box.first.press(
                "Enter"
            )

            page.wait_for_load_state(
                "domcontentloaded",
                timeout=60000
            )

            human_delay(3, 5)

            print(
                f"\nSearch URL: {page.url}"
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

            print(
                f"Found {products.count()} "
                f"product containers."
            )

            if products.count() == 0:

                print(
                    "\nNo Flipkart products found."
                )

                return result

            # =================================================
            # FIND FIRST PRODUCT LINK
            # =================================================

            links = page.locator(
                "a[href*='/p/']"
            )

            product_link = None

            for i in range(
                min(links.count(), 20)
            ):

                href = links.nth(i).get_attribute(
                    "href"
                )

                if href and "/p/" in href:

                    product_link = href

                    break

            if not product_link:

                print(
                    "\nCould not find a product link."
                )

                return result

            if product_link.startswith("http"):

                full_url = product_link

            else:

                full_url = (
                    "https://www.flipkart.com"
                    + product_link
                )

            # =================================================
            # OPEN PRODUCT PAGE
            # =================================================

            print(
                "\nOpening first Flipkart product..."
            )

            page.goto(
                full_url,
                wait_until="domcontentloaded",
                timeout=60000
            )

            human_delay(4, 5)

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

                if locator.count() > 0:

                    for i in range(
                        min(locator.count(), 5)
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
                    result["Flipkart Product"]
                    != "N/A"
                ):
                    break

            # =================================================
            # METHOD 1:
            # TRY COMMON PRICE SELECTORS
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
                    min(locator.count(), 20)
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

                            result["Price"] = text

                            break

                    except Exception:
                        continue

                if result["Price"] != "N/A":
                    break

            # =================================================
            # METHOD 2:
            # SEARCH ENTIRE VISIBLE PAGE TEXT
            # =================================================

            if result["Price"] == "N/A":

                print(
                    "\nPrice selector did not "
                    "find the price."
                )

                print(
                    "Searching visible page "
                    "text for ₹ price..."
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

                        result["Price"] = (
                            extracted_price
                        )

                except Exception as e:

                    print(
                        "Could not read "
                        f"page text: {e}"
                    )

            # =================================================
            # DISPLAY RESULT
            # =================================================

            print(
                "\n-----------------------------"
            )

            print(
                "Flipkart Competitor Price"
            )

            print(
                "-----------------------------"
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
                "-----------------------------"
            )

            return result

        except Exception as e:

            print(
                "\nError while scraping Flipkart:"
            )

            print(
                str(e)
            )

            return result

        finally:

            browser.close()


# ============================================================
# MAIN
# ============================================================

if __name__ == "__main__":

    print(
        "\n======================================"
    )

    print(
        "       FLIPKART TEST SCRAPER"
    )

    print(
        "======================================"
    )

    product_name = input(
        "\nEnter the product name "
        "(e.g., Iphone 17): "
    ).strip()

    if not product_name:

        print(
            "\nNo product name provided."
        )

    else:

        scrape_flipkart_product(
            product_name
        )