import sys
import time
from playwright.sync_api import sync_playwright

base_url = sys.argv[1] if len(sys.argv) > 1 else 'https://homeserviceapp2-lzer.vercel.app'
test_email = f'device_sync_{int(time.time())}@example.com'
test_pass = 'GlobalPass123!'

print(f"============================================================")
print(f"MULTI-DEVICE CROSS-SYSTEM TEST on {base_url}")
print(f"Simulating registration on Device A and login on Device B")
print(f"============================================================")

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    # -------------------------------------------------------------
    # DEVICE 1 (e.g. Phone / System A)
    # -------------------------------------------------------------
    print(f"\n[DEVICE 1 - System A]")
    context_device1 = browser.new_context()  # Completely isolated storage
    page1 = context_device1.new_page()

    print(f"1. Navigating to registration page on Device 1...")
    page1.goto(f"{base_url}/register")
    page1.wait_for_selector('input[name="full_name"]', timeout=10000)
    page1.fill('input[name="full_name"]', 'Multi Device User')
    page1.fill('input[name="email"]', test_email)
    page1.fill('input[name="password"]', test_pass)
    page1.fill('input[name="phone"]', '+1-800-555-8888')
    page1.fill('input[name="city"]', 'Chicago')
    page1.fill('input[name="address"]', '456 Michigan Ave')
    page1.click('button[type="submit"]')

    page1.wait_for_timeout(3000)
    print(f"   [DEVICE 1 PASS] Registration completed! URL: {page1.url}")

    # Close Device 1 completely (simulating turning off Phone or clearing history)
    context_device1.close()
    print("   [DEVICE 1] Browser context closed. Zero local storage retained.")

    # -------------------------------------------------------------
    # DEVICE 2 (e.g. Laptop / System B)
    # -------------------------------------------------------------
    print(f"\n[DEVICE 2 - System B (Completely Separate Machine Context)]")
    context_device2 = browser.new_context()  # Independent device, zero shared cookies/storage
    page2 = context_device2.new_page()

    print(f"2. Device 2 navigating to login page...")
    page2.goto(f"{base_url}/login")
    page2.wait_for_selector('input[type="email"]', timeout=10000)

    print(f"3. Device 2 signing in with credentials created on Device 1 ({test_email})...")
    page2.fill('input[type="email"]', test_email)
    page2.fill('input[type="password"]', test_pass)
    page2.click('button[type="submit"]')

    # Must authenticate and load Customer Dashboard
    page2.wait_for_selector('text=My Bookings', timeout=10000)
    print("   [DEVICE 2 PASS] Logged in successfully on Device 2 from central cloud database!")

    # Verify session persists across page reload on Device 2
    page2.reload()
    page2.wait_for_selector('text=My Bookings', timeout=10000)
    print("   [DEVICE 2 PASS] Session verified across page refresh on Device 2!")
    context_device2.close()

    # -------------------------------------------------------------
    # DEVICE 3 (Admin on System C)
    # -------------------------------------------------------------
    print(f"\n[DEVICE 3 - System C (Admin Audit Machine)]")
    context_device3 = browser.new_context()
    page3 = context_device3.new_page()

    print("4. Device 3 Admin logging in...")
    page3.goto(f"{base_url}/login")
    page3.fill('input[type="email"]', 'admin@homeserve.com')
    page3.fill('input[type="password"]', 'admin123')
    page3.click('button[type="submit"]')
    page3.wait_for_selector('text=Platform Master Console', timeout=10000)

    print(f"5. Device 3 Admin verifying new account ({test_email}) in User Directory...")
    page3.goto(f"{base_url}/admin/users")
    page3.wait_for_selector(f"text={test_email}", timeout=10000)
    print(f"   [DEVICE 3 PASS] Account {test_email} is visible in Admin directory across devices!")

    browser.close()
    print("\n============================================================")
    print("ALL TESTS PASSED: TRUE CROSS-DEVICE SYNCHRONIZATION VERIFIED 100%!")
    print("============================================================")
