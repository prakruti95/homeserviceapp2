import os
from playwright.sync_api import sync_playwright

os.makedirs('submission/screenshots', exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 1280, 'height': 800})
    
    # 1. Landing
    page.goto('http://127.0.0.1:5173', wait_until='networkidle')
    page.screenshot(path='submission/screenshots/01_landing_page.png')
    print('1. Landing screenshot captured')
    
    # 2. Services Catalog
    page.goto('http://127.0.0.1:5173/services', wait_until='networkidle')
    page.wait_for_timeout(1000)
    page.screenshot(path='submission/screenshots/02_services_catalog.png')
    print('2. Catalog screenshot captured')
    
    # 3. Customer Dashboard
    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.locator("button:has-text('Customer')").click()
    page.wait_for_url('**/customer/dashboard')
    page.wait_for_timeout(1500)
    page.screenshot(path='submission/screenshots/03_customer_dashboard.png')
    print('3. Customer Dashboard captured')
    
    # 4. Admin Dashboard
    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.locator("button:has-text('Admin')").first.click()
    page.wait_for_url('**/admin/dashboard')
    page.wait_for_timeout(1500)
    page.screenshot(path='submission/screenshots/04_admin_dashboard.png')
    print('4. Admin Dashboard captured')
    
    # 5. Provider Dashboard
    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.locator("button:has-text('Provider')").click()
    page.wait_for_url('**/provider/dashboard')
    page.wait_for_timeout(1500)
    page.screenshot(path='submission/screenshots/05_provider_dashboard.png')
    print('5. Provider Dashboard captured')
    
    # 6. Technician Dashboard
    page.goto('http://127.0.0.1:5173/login', wait_until='networkidle')
    page.locator("button:has-text('Technician')").click()
    page.wait_for_url('**/technician/dashboard')
    page.wait_for_timeout(1500)
    page.screenshot(path='submission/screenshots/06_technician_dashboard.png')
    print('6. Technician Dashboard captured')
    
    browser.close()
    print('ALL 6 SCREENSHOTS SUCCESSFULLY CAPTURED!')
