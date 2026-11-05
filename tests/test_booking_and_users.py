import sys
import time
from playwright.sync_api import sync_playwright

def test_booking_and_admin_governance(base_url):
    print(f"Testing Booking & Admin Governance on {base_url}...")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Step 1: Customer Login
        print("1. Logging in as Customer (customer@homeserve.com)...")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', "customer@homeserve.com")
        page.fill('input[type="password"]', "customer123")
        page.click('button[type="submit"]')
        page.wait_for_selector('text=Welcome back', timeout=10000)
        print("   [PASS] Customer logged in.")

        # Step 2: Book Service ($79.00 AC Deep Foam Cleaning)
        print("2. Navigating to Book Service #9 ($79.00 AC Deep Foam Cleaning)...")
        page.goto(f"{base_url}/customer/book/9")
        page.wait_for_selector('h1:has-text("Schedule a Service")', timeout=10000)
        page.wait_for_selector('div.font-semibold:has-text("AC Deep Foam Cleaning")', timeout=10000)
        
        # Verify pricing shows $79.00 and NOT $99.00
        content = page.content()
        assert "$79.00" in content, f"Expected $79.00 on the booking page, but content didn't have it."
        print("   [PASS] Booking page correctly calculated $79.00 rate!")

        # Select 'Pay on Service Completion' to book without payment gateway prompt
        page.click('input[value="cash"]')
        page.click('button:has-text("Confirm & Schedule Booking")')
        page.wait_for_selector('text=Your reservation is confirmed!', timeout=10000)
        print("   [PASS] Booking confirmed successfully!")

        # Step 3: Check Customer My Bookings
        print("3. Checking Customer My Bookings...")
        page.goto(f"{base_url}/customer/bookings")
        page.wait_for_selector('text=AC Deep Foam Cleaning', timeout=10000)
        content = page.content()
        assert "$79.00" in content, "Expected $79.00 in customer booking history"
        assert "AC Deep Foam Cleaning" in content, "Expected AC Deep Foam Cleaning in booking history"
        print("   [PASS] Customer booking history displays exact $79.00 AC Deep Foam Cleaning!")

        # Step 4: Admin Login to verify Admin Bookings & Supervise Users
        print("4. Logging in as Admin (admin@homeserve.com)...")
        page.evaluate("() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); }")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', "admin@homeserve.com")
        page.fill('input[type="password"]', "admin123")
        page.click('button[type="submit"]')
        page.wait_for_selector('h1:has-text("Platform Master Console")', timeout=10000)
        print("   [PASS] Admin logged in.")

        # Check Admin Bookings Supervision
        print("5. Checking Admin Bookings Supervision...")
        page.goto(f"{base_url}/admin/bookings")
        page.wait_for_selector('text=AC Deep Foam Cleaning', timeout=10000)
        content = page.content()
        assert "$79.00" in content, "Expected $79.00 in admin booking supervision"
        print("   [PASS] Admin bookings supervision shows exact $79.00 booking entry!")

        # Step 5: Test Real User Registration & Cross-Device Database Governance
        test_email = f"user_{int(time.time())}@example.com"
        print(f"6. Registering a new customer ({test_email}) in the live database...")
        page.evaluate("() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); }")
        page.goto(f"{base_url}/register")
        page.wait_for_selector('input[name="full_name"]', timeout=10000)
        page.fill('input[name="full_name"]', "Live Database User")
        page.fill('input[name="email"]', test_email)
        page.fill('input[name="password"]', "password123")
        page.fill('input[name="phone"]', "+1-800-555-4321")
        page.fill('input[name="city"]', "San Francisco")
        page.fill('input[name="address"]', "123 Market St")
        page.click('button[type="submit"]')
        page.wait_for_selector('text=Sign in to your account', timeout=10000)
        print("   [PASS] User successfully created in live database.")

        # Step 6: Log in as Admin to manage new user
        print(f"7. Admin locating {test_email} in database directory...")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', "admin@homeserve.com")
        page.fill('input[type="password"]', "admin123")
        page.click('button[type="submit"]')
        page.wait_for_selector('h1:has-text("Platform Master Console")', timeout=10000)

        page.goto(f"{base_url}/admin/users")
        page.wait_for_selector(f'text={test_email}', timeout=10000)
        print(f"   [PASS] Found newly registered user {test_email} in live database directory!")

        # Deactivate user
        page.on("dialog", lambda dialog: dialog.accept())
        row = page.locator(f'tr:has-text("{test_email}")')
        row.locator('button:has-text("Deactivate")').click()
        time.sleep(1)
        row = page.locator(f'tr:has-text("{test_email}")')
        assert "Deactivated" in row.inner_text(), "Expected status to show Deactivated"
        print("   [PASS] User successfully deactivated in live database!")

        # Verify deactivated user cannot log in
        print("8. Verifying deactivated user blocked from logging in...")
        page.evaluate("() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); }")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', test_email)
        page.fill('input[type="password"]', "password123")
        page.click('button[type="submit"]')
        page.wait_for_selector('text=deactivated', timeout=5000)
        print("   [PASS] Deactivated user blocked from login with account deactivated message!")

        # Delete user
        print("9. Admin permanently deleting user from live database...")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', "admin@homeserve.com")
        page.fill('input[type="password"]', "admin123")
        page.click('button[type="submit"]')
        page.wait_for_selector('h1:has-text("Platform Master Console")', timeout=10000)

        page.goto(f"{base_url}/admin/users")
        page.wait_for_selector(f'text={test_email}', timeout=10000)
        row = page.locator(f'tr:has-text("{test_email}")')
        row.locator('button[title="Delete user"]').click()
        time.sleep(1)

        page.reload()
        page.wait_for_selector('text=User Directory', timeout=10000)
        assert test_email not in page.content(), "Deleted user should not appear in directory"
        print("   [PASS] User permanently deleted from database directory!")

        # Verify deleted user cannot log in
        print("10. Verifying deleted user cannot log in...")
        page.evaluate("() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); }")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', test_email)
        page.fill('input[type="password"]', "password123")
        page.click('button[type="submit"]')
        page.wait_for_selector('text=Invalid email or password', timeout=5000)
        print("   [PASS] Deleted user blocked from login!")

        browser.close()
        print("\n=======================================================")
        print("ALL TESTS PASSED: Live Database Registration, $79 Booking, and Admin Governance 100% Verified!")
        print("=======================================================")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
    test_booking_and_admin_governance(url)
