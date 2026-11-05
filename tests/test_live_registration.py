import sys
import time
from playwright.sync_api import sync_playwright

base_url = sys.argv[1] if len(sys.argv) > 1 else 'https://homeserviceapp2-lzer.vercel.app'
email = f'user_{int(time.time())}@example.com'
password = 'Password123!'

print(f"Testing live registration and login on {base_url}...")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Register new user
    print(f"1. Registering user: {email}...")
    page.goto(f"{base_url}/register")
    page.wait_for_selector('input[name="full_name"]', timeout=10000)
    page.fill('input[name="full_name"]', 'Live Verified User')
    page.fill('input[name="email"]', email)
    page.fill('input[name="password"]', password)
    page.fill('input[name="phone"]', '+1-800-555-7777')
    page.fill('input[name="city"]', 'San Francisco')
    page.fill('input[name="address"]', '777 Market St')
    page.click('button[type="submit"]')

    # Wait for either customer dashboard or login page
    page.wait_for_timeout(3000)
    print(f"   Current URL after registration: {page.url}")

    # If redirected to /customer/dashboard or /login
    if '/login' in page.url:
        print("2. Logging in with credentials...")
        page.fill('input[type="email"]', email)
        page.fill('input[type="password"]', password)
        page.click('button[type="submit"]')
        page.wait_for_selector('text=My Bookings', timeout=10000)
        print("   [PASS] Successfully logged in!")
    else:
        page.wait_for_selector('text=My Bookings', timeout=10000)
        print("   [PASS] Auto-logged in into Customer Dashboard!")

    # 3. Verify session stays alive on reload
    print("3. Reloading Customer Dashboard to verify persistent session...")
    page.reload()
    page.wait_for_selector('text=My Bookings', timeout=10000)
    print("   [PASS] Customer session verified!")

    # 4. Log out
    print("4. Logging out...")
    page.evaluate("() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); }")
    page.goto(f"{base_url}/login")
    page.wait_for_selector('input[type="email"]', timeout=10000)

    # 5. Log in with registered account again
    print("5. Logging in with registered user again...")
    page.fill('input[type="email"]', email)
    page.fill('input[type="password"]', password)
    page.click('button[type="submit"]')
    page.wait_for_selector('text=My Bookings', timeout=10000)
    print("   [PASS] User can log in reliably at any time!")

    # 6. Log in as Admin and verify account is visible in Manage Users
    print("6. Logging in as Admin to check User Directory...")
    page.evaluate("() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); }")
    page.goto(f"{base_url}/login")
    page.fill('input[type="email"]', 'admin@homeserve.com')
    page.fill('input[type="password"]', 'admin123')
    page.click('button[type="submit"]')
    page.wait_for_selector('text=Platform Master Console', timeout=10000)

    page.goto(f"{base_url}/admin/users")
    page.wait_for_selector(f"text={email}", timeout=10000)
    print(f"   [PASS] Registered account {email} is visible in Admin User Directory!")

    browser.close()
    print("\n=======================================================")
    print("ALL VERIFICATIONS PASSED: Registration, Login & Admin Directory 100% Working!")
    print("=======================================================")
