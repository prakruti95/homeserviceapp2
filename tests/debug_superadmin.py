from playwright.sync_api import sync_playwright

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page()

    console_logs = []
    page.on("console", lambda msg: console_logs.append(f"[{msg.type}] {msg.text}"))
    page.on("pageerror", lambda err: console_logs.append(f"[PAGE_ERROR] {err}"))

    page.goto('https://homeserviceapp2-lzer.vercel.app/login', wait_until='networkidle')
    page.locator("button:has-text('Super Admin')").click()
    page.wait_for_url('**/admin/dashboard', timeout=10000)

    import time; time.sleep(3)
    print("URL:", page.url)
    print("Logs:")
    for l in console_logs:
        print(" ", l)
    print("Body text:")
    print(page.locator("body").inner_text()[:600])

    browser.close()
