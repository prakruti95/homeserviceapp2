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
        print("2. Navigating to Book Service #2 ($79.00 AC Deep Foam Cleaning)...")
        page.goto(f"{base_url}/customer/book/2")
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

        # Step 5: Test Admin User Deactivation & Deletion
        print("6. Testing Admin User Directory Governance (/admin/users)...")
        page.goto(f"{base_url}/admin/users")
        page.wait_for_selector('text=User Directory', timeout=10000)
        
        # Accept dialogs automatically
        page.on("dialog", lambda dialog: dialog.accept())

        # Find David Reynolds
        page.wait_for_selector('text=David Reynolds', timeout=10000)
        print("   Found user David Reynolds in directory.")

        # Click Deactivate on David Reynolds' row
        row = page.locator('tr:has-text("David Reynolds")')
        deactivate_btn = row.locator('button:has-text("Deactivate")')
        deactivate_btn.click()
        time.sleep(1)

        # Verify button changed to Activate and status is Deactivated
        row = page.locator('tr:has-text("David Reynolds")')
        assert "Deactivated" in row.inner_text(), "Expected status to show Deactivated"
        print("   [PASS] User successfully deactivated by admin!")

        # Step 6: Test that Deactivated User CANNOT Log In
        print("7. Verifying deactivated user cannot log in...")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', "david.r@example.com")
        page.fill('input[type="password"]', "customer123")
        page.click('button[type="submit"]')
        page.wait_for_selector('text=Your account is deactivated', timeout=5000)
        print("   [PASS] Deactivated user blocked from login with account deactivated alert!")

        # Step 7: Reactivate user, then delete user
        print("8. Reactivating and deleting user as Admin...")
        page.evaluate("() => { localStorage.removeItem('access_token'); localStorage.removeItem('user'); }")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', "admin@homeserve.com")
        page.fill('input[type="password"]', "admin123")
        page.click('button[type="submit"]')
        page.wait_for_selector('h1:has-text("Platform Master Console")', timeout=10000)

        page.goto(f"{base_url}/admin/users")
        page.wait_for_selector('text=User Directory', timeout=10000)
        row = page.locator('tr:has-text("David Reynolds")')
        delete_btn = row.locator('button[title="Delete user"]')
        delete_btn.click()
        time.sleep(1)

        # Verify David Reynolds is completely gone from the table
        page.reload()
        page.wait_for_selector('text=User Directory', timeout=10000)
        content = page.content()
        assert "David Reynolds" not in content, "David Reynolds should be permanently deleted from user directory"
        print("   [PASS] User permanently deleted from directory!")

        # Verify Deleted User cannot log in
        print("9. Verifying deleted user cannot log in...")
        page.goto(f"{base_url}/login")
        page.fill('input[type="email"]', "david.r@example.com")
        page.fill('input[type="password"]', "customer123")
        page.click('button[type="submit"]')
        page.wait_for_selector('text=Invalid email or password', timeout=5000)
        print("   [PASS] Deleted user blocked from login!")

        browser.close()
        print("\n=======================================================")
        print("ALL TESTS PASSED: Dynamic $79 pricing & Admin Deactivate/Delete fully working!")
        print("=======================================================")

if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173"
    test_booking_and_admin_governance(url)
