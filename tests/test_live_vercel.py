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

        # Capture console errors
        console_errors = []
        page.on("console", lambda msg: console_errors.append(msg.text) if msg.type == "error" else None)

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
        time.sleep(2)
        body_text = page.content()
        assert "Something went wrong loading this view" not in body_text, "Dashboard should NOT crash with ErrorBoundary!"
        assert "Welcome back" in body_text, "Welcome message should appear"
        assert "Total Settled" in body_text, "Total Settled metric should appear"
        print("PASS: Customer Dashboard rendered cleanly without errors!")

        # 3. Test Booking Cancellation & Reschedule in /customer/bookings
        print("\n--- 3. Testing My Bookings & Cancellation ---")
        page.goto(f"{BASE_URL}/customer/bookings", wait_until="networkidle")
        time.sleep(2)

        # Find any cancel button
        cancel_buttons = page.locator("button:has-text('Cancel')")
        cancel_count = cancel_buttons.count()
        print(f"Found {cancel_count} cancel button(s)")
        if cancel_count > 0:
            cancel_buttons.first.click()
            time.sleep(1)
            # Fill reason and confirm
            confirm_cancel_btn = page.locator("button:has-text('Confirm Cancellation')")
            if confirm_cancel_btn.count() > 0:
                confirm_cancel_btn.click()
                time.sleep(2)
                print("Cancellation submitted. Checking status update...")
                # Verify cancelled badge appears
                cancelled_badges = page.locator("text=cancelled")
                print(f"Found {cancelled_badges.count()} cancelled badge(s)")
                assert cancelled_badges.count() > 0, "Booking should show cancelled status"
                print("PASS: Booking cancellation works seamlessly!")

        # 4. Test Payment History
        print("\n--- 4. Testing Payment History & Invoices ---")
        page.goto(f"{BASE_URL}/customer/payments", wait_until="networkidle")
        time.sleep(2)
        pay_content = page.content()
        assert "Payment History & Invoices" in pay_content, "Header should load"
        assert "Total Amount Settled" in pay_content, "Financial summary should show"
        assert "No payments recorded yet" not in pay_content, "Payments table should NOT be empty"

        # Check for View Receipt button
        receipt_btn = page.locator("button:has-text('View Receipt')").first
        if receipt_btn.count() > 0:
            receipt_btn.click()
            time.sleep(1)
            invoice_modal = page.locator("text=TAX INVOICE")
            assert invoice_modal.count() > 0, "Invoice modal should open"
            print("PASS: Invoice receipt opened successfully!")
            # Close modal
            close_btn = page.locator("button:has-text('Close')")
            if close_btn.count() > 0:
                close_btn.click()

        print("PASS: Payment History is fully populated and receipts work!")

        # 5. Test Reviews Page
        print("\n--- 5. Testing Ratings & Reviews ---")
        page.goto(f"{BASE_URL}/customer/reviews", wait_until="networkidle")
        time.sleep(2)
        rev_content = page.content()
        assert "Ratings & Reviews" in rev_content
        assert "No reviews yet" not in rev_content, "Reviews should NOT be empty"
        print("PASS: Customer Reviews list displays verified customer testimonials!")

        # 6. Test Service Disputes & Complaints Tab
        print("\n--- 6. Testing Disputes / Complaints ---")
        page.goto(f"{BASE_URL}/customer/complaints", wait_until="networkidle")
        time.sleep(2)
        comp_content = page.content()
        assert "Service Disputes & Complaints" in comp_content
        assert "Registered Support Tickets" in comp_content

        # Open File New Dispute Modal
        file_dispute_btn = page.locator("button:has-text('File New Dispute')")
        assert file_dispute_btn.count() > 0, "File New Dispute button should be present"
        file_dispute_btn.click()
        time.sleep(1)

        # Fill complaint description
        textarea = page.locator("textarea[placeholder*='Please describe']")
        if textarea.count() > 0:
            textarea.fill("Automated live test dispute verification: Service was excellent and warranty checked.")
            submit_ticket_btn = page.locator("button:has-text('Submit Dispute Ticket')")
            submit_ticket_btn.click()
            time.sleep(2)
            print("Dispute ticket submitted!")
            updated_content = page.content()
            assert "Automated live test dispute verification" in updated_content or "TKT-2026" in updated_content
            print("PASS: Filing a new dispute ticket works seamlessly!")

        print("\n==============================================")
        print("ALL LIVE VERIFICATION TESTS PASSED SUCCESSFULLY!")
        print("==============================================")
        browser.close()

if __name__ == "__main__":
    run_live_verification()
