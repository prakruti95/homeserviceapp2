import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://homeserviceapp2-lzer.vercel.app"

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: console_logs.append(f"[PAGE_ERROR] {err}"))

    # Login
    page.goto(f"{BASE_URL}/login", wait_until="networkidle")
    page.locator("button:has-text('Customer')").click()
    page.wait_for_url("**/customer/dashboard", timeout=10000)
    time.sleep(3)

    print("URL:", page.url)
    print("Logs:")
    for l in console_logs:
        print(l)

    # Check for ErrorBoundary text
    content = page.content()
    if "Something went wrong loading this view" in content:
        print("FOUND ERROR BOUNDARY!")
        # Find the inner error details if any
        print(page.locator("body").inner_text())
    else:
        print("DASHBOARD LOADED PROPERLY!")

    browser.close()
