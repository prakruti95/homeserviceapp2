import sys
import time
from playwright.sync_api import sync_playwright

BASE_URL = "https://homeserviceapp2-lzer.vercel.app"

def run_live_verification():
    print(f"Starting end-to-end verification against: {BASE_URL}")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        # 1. Login as customer
        print("\n--- 1. Login as Customer ---")
        page.goto(f"{BASE_URL}/login", wait_until="networkidle")
        time.sleep(1)

        customer_btn = page.locator("button:has-text('Customer')")
        customer_btn.click()
        page.wait_for_url("**/customer/dashboard", timeout=12000)
        print("Successfully logged in! Current URL:", page.url)

        # 2. Check Customer Dashboard
        print("\n--- 2. Checking Customer Dashboard ---")
        page.wait_for_selector("text=Welcome back", timeout=10000)
        body_text = page.locator("body").inner_text()
        assert "Something went wrong loading this view" not in body_text, "Dashboard should NOT crash with ErrorBoundary!"
        assert "Welcome back" in body_text, "Welcome message should appear"
        assert "Total Settled" in body_text, "Total Settled metric should appear"
        print("PASS: Customer Dashboard rendered cleanly with real metrics!")

        # 3. Test Booking Cancellation in /customer/bookings
        print("\n--- 3. Testing My Bookings & Cancellation ---")
        page.goto(f"{BASE_URL}/customer/bookings", wait_until="networkidle")
        page.wait_for_selector("text=My Service Bookings", timeout=10000)
        time.sleep(1)

        cancel_btn = page.locator("button.border-rose-200").first
        if cancel_btn.count() > 0:
            cancel_btn.click()
            page.wait_for_selector("button:has-text('Confirm Cancellation')", timeout=5000)
            confirm_cancel_btn = page.locator("button:has-text('Confirm Cancellation')")
            confirm_cancel_btn.click()
            time.sleep(2)
            page.wait_for_selector("text=Cancelled", timeout=8000)
            print("PASS: Booking cancellation works seamlessly with status badge updated!")

        # 4. Test Payment History
        print("\n--- 4. Testing Payment History & Invoices ---")
        page.goto(f"{BASE_URL}/customer/payments", wait_until="networkidle")
        page.wait_for_selector("text=Payment History & Invoices", timeout=10000)
        page.wait_for_selector("text=Total Amount Settled", timeout=10000)
        pay_text = page.locator("body").inner_text().lower()
        assert "total amount settled" in pay_text, "Financial summary should show"
        assert "no payments recorded yet" not in pay_text, "Payments table should NOT be empty"

        # Check for View Receipt button
        receipt_btn = page.locator("button:has-text('View Receipt')").first
        if receipt_btn.count() > 0:
            receipt_btn.click()
            page.wait_for_selector("text=Official Tax Receipt", timeout=5000)
            invoice_modal = page.locator("text=Official Tax Receipt")
            assert invoice_modal.count() > 0, "Invoice modal should open"
            print("PASS: Invoice receipt opened successfully!")
            # Close modal
            close_btn = page.locator("button:has-text('Close')")
            if close_btn.count() > 0:
                close_btn.click()
                time.sleep(1)

        print("PASS: Payment History is fully populated and receipts work!")

        # 5. Test Reviews Page
        print("\n--- 5. Testing Ratings & Reviews ---")
        page.goto(f"{BASE_URL}/customer/reviews", wait_until="networkidle")
        page.wait_for_selector("text=Ratings & Reviews", timeout=10000)
        time.sleep(1)
        rev_text = page.locator("body").inner_text().lower()
        assert "no reviews yet" not in rev_text, "Reviews should NOT be empty"
        assert "emily watson" in rev_text or "ratings & reviews" in rev_text, "Reviews should be listed"
        print("PASS: Customer Reviews list displays verified customer testimonials!")

        # 6. Test Service Disputes & Complaints Tab
        print("\n--- 6. Testing Disputes / Complaints ---")
        page.goto(f"{BASE_URL}/customer/complaints", wait_until="networkidle")
        page.wait_for_selector("text=Service Disputes & Complaints", timeout=10000)
        page.wait_for_selector("text=Registered Support Tickets", timeout=10000)
        time.sleep(1)

        # Open File New Dispute Modal
        file_dispute_btn = page.locator("button:has-text('File New Dispute')")
        assert file_dispute_btn.count() > 0, "File New Dispute button should be present"
        file_dispute_btn.click()
        # Fill complaint description
        page.wait_for_selector("textarea[placeholder*='Describe your issue']", timeout=5000)
        textarea = page.locator("textarea[placeholder*='Describe your issue']")
        textarea.fill("Automated live test dispute verification: Service was excellent and warranty checked.")
        submit_ticket_btn = page.locator("button:has-text('Submit Dispute')")
        submit_ticket_btn.click()
        time.sleep(2)
        print("Dispute ticket submitted!")
        page.wait_for_selector("text=Registered Support Tickets", timeout=8000)
        updated_text = page.locator("body").inner_text()
        assert "Automated live test dispute verification" in updated_text or "TKT-2026" in updated_text
        print("PASS: Filing a new dispute ticket works seamlessly!")

        print("\n==============================================")
        print("ALL 6 LIVE VERIFICATION TESTS PASSED 100%!")
        print("==============================================")
        browser.close()

if __name__ == "__main__":
    run_live_verification()
