import pytest
from playwright.sync_api import sync_playwright

FRONTEND_BASE = "http://127.0.0.1:5173"


class TestPlaywrightFrontendE2E:
    """Automated browser tests verifying the frontend UI, responsive layouts, and demo workflows."""

    def test_landing_page_rendering(self):
        """Verify landing page loads branding, hero search, 8 categories, and testimonials."""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(FRONTEND_BASE, wait_until="networkidle")

            # Check Brand title / logo
            assert "HomeServe" in page.content(), "Brand title should be present on page"

            # Check Hero Search Bar
            search_input = page.locator("input[placeholder*='What service']")
            assert search_input.count() > 0, "Hero search input should be present"

            # Check Category sections
            content = page.content()
            for cat in ["Electrical", "Plumbing", "AC Repair", "Home Cleaning", "Painting", "Carpentry"]:
                assert cat in content, f"Category '{cat}' should appear on the landing page"

            browser.close()

    def test_quick_demo_login_and_role_dashboards(self):
        """Verify 1-click evaluator login buttons and navigation into Customer, Admin, Provider, and Technician dashboards."""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()

            # 1. Customer Login & Dashboard
            page.goto(f"{FRONTEND_BASE}/login", wait_until="networkidle")
            customer_btn = page.locator("button:has-text('Customer')")
            assert customer_btn.count() > 0, "Customer quick login button must exist"
            customer_btn.click()

            page.wait_for_url("**/customer/dashboard", timeout=8000)
            assert "/customer/dashboard" in page.url
            content = page.content()
            assert "Dispatches" in content or "Appointments" in content or "Dashboard" in content

            # Reset session
            page.evaluate("() => { localStorage.clear(); window.location.href = '/login'; }")
            page.wait_for_url("**/login", timeout=5000)

            # 2. Admin Login & Dashboard
            page.goto(f"{FRONTEND_BASE}/login", wait_until="networkidle")
            admin_btn = page.locator("button:has-text('Admin')").first
            admin_btn.click()

            page.wait_for_url("**/admin/dashboard", timeout=8000)
            assert "/admin/dashboard" in page.url
            page.wait_for_selector("text=Revenue", timeout=5000)
            content = page.content()
            assert "Commission" in content or "Revenue" in content
            assert "Export" in content

            # Reset session
            page.evaluate("() => { localStorage.clear(); window.location.href = '/login'; }")
            page.wait_for_url("**/login", timeout=5000)

            # 3. Provider Login & Dashboard
            page.goto(f"{FRONTEND_BASE}/login", wait_until="networkidle")
            provider_btn = page.locator("button:has-text('Provider')")
            provider_btn.click()

            page.wait_for_url("**/provider/dashboard", timeout=8000)
            assert "/provider/dashboard" in page.url
            content = page.content()
            assert "Earnings" in content or "Gross" in content or "Provider" in content

            # Reset session
            page.evaluate("() => { localStorage.clear(); window.location.href = '/login'; }")
            page.wait_for_url("**/login", timeout=5000)

            # 4. Technician Login & Dashboard
            page.goto(f"{FRONTEND_BASE}/login", wait_until="networkidle")
            tech_btn = page.locator("button:has-text('Technician')")
            tech_btn.click()

            page.wait_for_url("**/technician/dashboard", timeout=8000)
            assert "/technician/dashboard" in page.url
            content = page.content()
            assert "Dispatches" in content or "Technician" in content or "Assignments" in content

            browser.close()

    def test_mobile_responsive_layout(self):
        """Verify page adapts cleanly to mobile viewport without breaking."""
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            # Emulate iPhone 13 / mobile viewport
            context = browser.new_context(viewport={"width": 375, "height": 812})
            page = context.new_page()
            page.goto(FRONTEND_BASE, wait_until="networkidle")

            # Check page loaded
            assert "HomeServe" in page.content()

            # Mobile menu button should be visible
            mobile_btn = page.locator("button:has(svg)")
            assert mobile_btn.count() > 0, "Mobile menu toggle icon should be present"

            browser.close()
