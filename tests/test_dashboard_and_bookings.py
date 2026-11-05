import sys
import time
from playwright.sync_api import sync_playwright

base_url = sys.argv[1] if len(sys.argv) > 1 else 'https://homeserviceapp2-lzer.vercel.app'
email = 'live_verify_1793883481@example.com'
password = 'Password123!'

print(f"Testing Dashboard Navigation and Live Booking on {base_url}...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Login as Customer
    print(f"1. Logging in as {email}...")
    page.goto(f"{base_url}/login")
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    page.click('button[type="submit"]')
    page.wait_for_selector('text=My Bookings', timeout=10000)
    print("   [PASS] Customer logged in successfully!")

    # 2. Test Dashboard Link from Home Page
    print("2. Navigating to Home page (/). Checking Dashboard button...")
    page.goto(f"{base_url}/")
    page.wait_for_selector('text=My Dashboard', timeout=10000)
    print("   [PASS] 'My Dashboard' banner and navbar button visible on Home page!")

    # Click Dashboard button from Home page
    page.locator('a:has-text("My Dashboard")').first.click()
    page.wait_for_selector('h1:has-text("Welcome Back")', timeout=10000)
    print("   [PASS] Successfully opened Dashboard from Home page!")

    # 3. Test Dashboard Link from About Page
    print("3. Navigating to About page (/about)...")
    page.goto(f"{base_url}/about")
    page.wait_for_selector('a:has-text("Dashboard")', timeout=10000)
    page.locator('a:has-text("Dashboard")').first.click()
    page.wait_for_selector('h1:has-text("Welcome Back")', timeout=10000)
    print("   [PASS] Successfully opened Dashboard from About page!")

    # 4. Book a service
    print("4. Booking a service via /customer/book...")
    page.goto(f"{base_url}/customer/book")
    page.wait_for_selector('button[type="submit"]:has-text("Confirm & Schedule Booking")', timeout=10000)

    page.fill('input[name="address"]', '789 Market Street, Suite 500')
    page.fill('input[name="city"]', 'San Francisco')
    page.fill('input[name="zipCode"]', '94103')
    page.click('button[type="submit"]:has-text("Confirm & Schedule Booking")')

    page.wait_for_selector('text=Your reservation is confirmed!', timeout=10000)
    print("   [PASS] Service booked successfully on live cloud database!")

    # 5. Open My Bookings and verify booking displays
    print("5. Navigating to My Bookings (/customer/bookings)...")
    page.goto(f"{base_url}/customer/bookings")
    page.wait_for_selector('text=My Service Bookings', timeout=10000)
    page.wait_for_timeout(2000)

    content = page.content()
    assert 'No bookings found' not in content, "Bookings should be displayed!"
    print("   [PASS] My Bookings successfully displays reservations from the cloud database!")

    browser.close()
    print("\n=======================================================")
    print("ALL TESTS PASSED: Dashboard Navigation & Bookings 100% Operational!")
    print("=======================================================")
