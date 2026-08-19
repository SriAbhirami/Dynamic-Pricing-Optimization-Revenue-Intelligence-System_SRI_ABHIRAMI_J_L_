from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
import time
import csv
import random
import os


# ============================================================
# HELPER FUNCTION
# ============================================================

def human_delay(min_sec=2, max_sec=4):
    """Mimic human reading delays."""
    time.sleep(random.uniform(min_sec, max_sec))


# ============================================================
# CAPTCHA DETECTION
# ============================================================

def captcha_detected(page):
    """Check whether Amazon is displaying a CAPTCHA."""
    return page.locator(
        "form[action='/errors/validateCaptcha']"
    ).count() > 0


# ============================================================
# CATEGORY / MULTIPLE PRODUCT SCRAPER
# ============================================================

def advanced_amazon_scraper(search_keyword, target_count=20):

    results = []

    # Persistent browser session
    user_data_dir = os.path.join(
        os.getcwd(),
        "amazon_session"
    )

    with sync_playwright() as p:

        print("\nLaunching persistent browser session...")

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

        # Apply stealth
        stealth = Stealth()

        page = (
            browser.pages[0]
            if browser.pages
            else browser.new_page()
        )

        stealth.apply_stealth_sync(page)

        # Initial search URL
        search_url = (
            "https://www.amazon.in/s?k="
            + search_keyword.replace(" ", "+")
        )

        while len(results) < target_count:

            print("\n--- Loading Search Page ---")

            try:

                page.goto(
                    search_url,
                    wait_until="domcontentloaded",
                    timeout=60000
                )

                human_delay(2, 3)

            except Exception as e:

                print(
                    f"Error loading search page: "
                    f"{str(e)[:100]}"
                )

                continue

            # CAPTCHA detection
            if captcha_detected(page):

                print("\nCAPTCHA DETECTED!")

                input(
                    "Solve the CAPTCHA in the browser "
                    "and press ENTER..."
                )

                continue

            # ------------------------------------------------
            # SCROLLING
            # ------------------------------------------------

            print(
                "Scrolling to trigger lazy-loading..."
            )

            for _ in range(4):

                page.mouse.wheel(0, 800)

                human_delay(0.5, 1.5)

            # ------------------------------------------------
            # EXTRACT PRODUCT LINKS
            # ------------------------------------------------

            print(
                "Extracting product URLs..."
            )

            product_links = page.evaluate(
                """
                () => {

                    let links = [];

                    document
                        .querySelectorAll('div[data-asin]')
                        .forEach(item => {

                            let asin =
                                item.getAttribute('data-asin');

                            if (asin) {

                                let aTag =
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

                            }

                        });

                    return [...new Set(links)];
                }
                """
            )

            print(
                f"Successfully found "
                f"{len(product_links)} unique "
                f"product links."
            )

            if len(product_links) == 0:

                print(
                    "\nNo product links found."
                )

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

                print(
                    f"\nNavigating to: "
                    f"{link[-50:]}..."
                )

                try:

                    page.goto(
                        link,
                        wait_until="domcontentloaded",
                        timeout=60000
                    )

                    human_delay(2, 4)

                    if captcha_detected(page):

                        print(
                            "CAPTCHA DETECTED "
                            "on product page!"
                        )

                        input(
                            "Solve CAPTCHA and "
                            "press ENTER..."
                        )

                    # ------------------------------------------------
                    # PRODUCT TITLE
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
                    # PRODUCT PRICE
                    # ------------------------------------------------

                    price = "N/A"

                    visible_selectors = [

                        ".priceToPay .a-price-whole",

                        "#corePriceDisplay_desktop_feature_div "
                        ".a-price-whole",

                        "#apex_desktop .a-price-whole"

                    ]

                    for selector in visible_selectors:

                        loc = page.locator(
                            selector
                        )

                        if loc.count() > 0:

                            extracted = (
                                loc.first
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

                            loc = page.locator(
                                selector
                            )

                            if loc.count() > 0:

                                extracted = (
                                    loc.first
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
                    # SAVE RESULT
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
                        f"Saved: "
                        f"{title[:45]}... | "
                        f"{price}"
                    )

                except Exception as e:

                    print(
                        f"Error scraping product: "
                        f"{str(e)[:100]}..."
                    )

                    continue

            # ------------------------------------------------
            # PAGINATION
            # ------------------------------------------------

            if len(results) < target_count:

                next_button = page.locator(
                    ".s-pagination-next"
                )

                button_class = ""

                if next_button.count() > 0:

                    button_class = (
                        next_button
                        .first
                        .get_attribute("class")
                        or ""
                    )

                if (
                    next_button.count() > 0
                    and
                    "s-pagination-disabled"
                    not in button_class
                ):

                    next_path = (
                        next_button
                        .first
                        .get_attribute("href")
                    )

                    if next_path:

                        if next_path.startswith("http"):

                            search_url = next_path

                        else:

                            search_url = (
                                "https://www.amazon.in"
                                + next_path
                            )

                        print(
                            "\nMoving to next page..."
                        )

                    else:

                        print(
                            "\nNo next page found."
                        )

                        break

                else:

                    print(
                        "\nReached the end "
                        "of search results."
                    )

                    break

        browser.close()

    return results


# ============================================================
# SPECIFIC PRODUCT / COMPETITOR PRICE SCRAPER
# ============================================================

def scrape_competitor_price(product_name):

    """
    Search Amazon for a specific product and return
    the first related product and its current price.
    """

    result = {
        "Requested Product": product_name,
        "Amazon Product": "N/A",
        "Price": "N/A"
    }

    # Persistent browser session
    user_data_dir = os.path.join(
        os.getcwd(),
        "amazon_session"
    )

    with sync_playwright() as p:

        print(
            "\nLaunching Amazon browser..."
        )

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

        # Apply stealth
        stealth = Stealth()

        page = (
            browser.pages[0]
            if browser.pages
            else browser.new_page()
        )

        stealth.apply_stealth_sync(page)

        try:

            # ------------------------------------------------
            # OPEN AMAZON
            # ------------------------------------------------

            print(
                "\nOpening Amazon India..."
            )

            page.goto(
                "https://www.amazon.in",
                wait_until="domcontentloaded",
                timeout=60000
            )

            human_delay(2, 3)

            # CAPTCHA
            if captcha_detected(page):

                print(
                    "\nCAPTCHA DETECTED!"
                )

                input(
                    "Solve the CAPTCHA in the browser "
                    "and press ENTER..."
                )

            # ------------------------------------------------
            # SEARCH PRODUCT
            # ------------------------------------------------

            print(
                f"\nSearching Amazon for: "
                f"{product_name}"
            )

            search_box = page.locator(
                "#twotabsearchtextbox"
            )

            search_box.fill(
                product_name
            )

            search_box.press(
                "Enter"
            )

            page.wait_for_load_state(
                "domcontentloaded",
                timeout=60000
            )

            human_delay(2, 3)

            # CAPTCHA after search
            if captcha_detected(page):

                print(
                    "\nCAPTCHA DETECTED "
                    "after searching!"
                )

                input(
                    "Solve the CAPTCHA and "
                    "press ENTER..."
                )

            # ------------------------------------------------
            # FIND SEARCH RESULTS
            # ------------------------------------------------

            products = page.locator(
                'div[data-component-type="s-search-result"]'
            )

            if products.count() == 0:

                print(
                    "\nNo Amazon search results found."
                )

                return result

            # Take the first related product
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

            # ------------------------------------------------
            # PRODUCT PRICE
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

                # Fallback to visible whole price
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
            # DISPLAY RESULT
            # ------------------------------------------------

            print(
                "\n-----------------------------"
            )

            print(
                "Amazon Competitor Price"
            )

            print(
                "-----------------------------"
            )

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
                "-----------------------------"
            )

            return result

        except Exception as e:

            print(
                "\nError while searching "
                "for product:"
            )

            print(
                str(e)
            )

            return result

        finally:

            browser.close()


# ============================================================
# SAVE CATEGORY RESULTS TO CSV
# ============================================================

def save_category_results(data, filename):

    """
    Save category scraper results to CSV.

    This is retained because the original category
    scraper already used CSV output.
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
    # MODE 1: CATEGORY SCRAPING
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
            "to scrape (e.g., 20): "
        ).strip()

        try:

            target_count = int(
                raw_count
            )

            if target_count <= 0:

                raise ValueError

        except ValueError:

            print(
                "Invalid number entered. "
                "Defaulting to 20."
            )

            target_count = 20

        filename = input(
            "Enter the name of the output CSV "
            "file (e.g., data.csv): "
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
    # MODE 2: SPECIFIC PRODUCT
    # ========================================================

    elif choice == "2":

        print(
            "\n=== Specific Product Mode ==="
        )

        product_name = input(
            "Enter the product name "
            "(e.g., Nike Revolution 7): "
        ).strip()

        if not product_name:

            print(
                "\nNo product name provided."
            )

        else:

            # The function itself prints the result
            # and returns the data for future backend use.
            scrape_competitor_price(
                product_name
            )

    # ========================================================
    # INVALID OPTION
    # ========================================================

    else:

        print(
            "\nInvalid choice."
        )

        print(
            "Please run the scraper again "
            "and select 1 or 2."
        )