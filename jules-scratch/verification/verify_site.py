import os
from playwright.sync_api import sync_playwright, Page, expect

def test_site_verification(page: Page):
    """
    This test verifies the static site generation and theme switching.
    """
    base_url = "http://localhost:8080"

    # 1. Verify homepage loads in dark mode
    page.goto(base_url)
    expect(page).to_have_title("UDLex")
    page.screenshot(path="jules-scratch/verification/01-homepage-dark.png")

    # 2. Verify theme switching to light mode
    theme_toggle = page.get_by_role("button", name="Light Mode")
    theme_toggle.click()
    expect(page.locator("html")).to_have_attribute("data-theme", "light")
    page.screenshot(path="jules-scratch/verification/02-homepage-light.png")

    # 3. Verify articles page
    page.goto(f"{base_url}/articles/index.html")
    expect(page).to_have_title("Articles - UDLex")
    # Check for a specific article to ensure content is rendered
    expect(page.get_by_role("heading", name="RDC25 & #FreeSchlep: A Turning Point for Roblox's Community and Safety")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/03-articles-page.png")

    # 4. Verify a single article page
    article_link = page.get_by_role("link", name="RDC25 & #FreeSchlep: A Turning Point for Roblox's Community and Safety")
    article_link.click()
    expect(page.locator("h1", has_text="RDC25 & #FreeSchlep")).to_be_visible()
    page.screenshot(path="jules-scratch/verification/04-single-article-page.png")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()
    try:
        test_site_verification(page)
    finally:
        browser.close()
