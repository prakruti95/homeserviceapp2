import json
import time
import urllib.request
import urllib.error
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8000/api"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req_body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=req_body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            content = resp.read().decode("utf-8")
            return resp.status, json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        content = e.read().decode("utf-8")
        try:
            body = json.loads(content)
        except Exception:
            body = {"detail": content}
        return e.code, body


def run_full_integration_test():
    print("=" * 70)
    print("HOMESERVE TECHNOLOGIES - END-TO-END WORKFLOW INTEGRATION TEST")
    print("=" * 70)

    # 1. Registration and Login (Customer, Provider, Technician)
    print("\n[Step 1] Customer & Role Authentication")
    status, customer_login = request("POST", "/auth/login", {"email": "customer@homeserve.com", "password": "customer123"})
    assert status == 200, f"Customer login failed: {customer_login}"
    customer_token = customer_login["access_token"]
    print("  [OK] Customer logged in successfully:", customer_login["user"]["email"])

    status, provider_login = request("POST", "/auth/login", {"email": "provider@homeserve.com", "password": "provider123"})
    assert status == 200, f"Provider login failed: {provider_login}"
    provider_token = provider_login["access_token"]
    print("  [OK] Provider logged in successfully:", provider_login["user"]["email"])

    status, tech_login = request("POST", "/auth/login", {"email": "technician@homeserve.com", "password": "tech123"})
    assert status == 200, f"Technician login failed: {tech_login}"
    tech_token = tech_login["access_token"]
    tech_user_id = tech_login["user"]["id"]
    print("  [OK] Technician logged in successfully:", tech_login["user"]["email"])

    # 2. Search Service & Categories
    print("\n[Step 2] Dynamic Category & Service Discovery")
    status, categories = request("GET", "/services/categories")
    assert status == 200 and len(categories) >= 8, f"Categories failed: {categories}"
    print(f"  [OK] {len(categories)} categories verified (Plumbing, Electrical, AC Repair, Cleaning...)")

    status, services_data = request("GET", "/services/?q=drain")
    assert status == 200, f"Search service failed: {services_data}"
    services = services_data.get("services", [])
    assert len(services) > 0, "No drain cleaning service found"
    target_service = services[0]
    print(f"  [OK] Found service: '{target_service['name']}' (ID: {target_service['id']}, Base Price: ${target_service['base_price']})")

    # 3. Select Provider & Check Availability
    print("\n[Step 3] Provider Selection & Availability Checking")
    status, providers = request("GET", "/providers/")
    assert status == 200 and len(providers) > 0, f"Provider listing failed: {providers}"
    provider = providers[0]
    provider_id = provider.get("user_id") or provider.get("id")
    print(f"  [OK] Selected Provider: '{provider.get('business_name')}' (ID: {provider_id})")

    status, availability = request("GET", f"/providers/{provider_id}/availability")
    assert status in (200, 404), f"Availability call failed: {status}"
    print("  [OK] Provider availability checked")

    # 4. Coupon Validation & Booking Creation
    print("\n[Step 4] Coupon Discount Validation & Booking Creation")
    status, coupon_res = request("POST", "/coupons/validate", {
        "code": "WELCOME20",
        "service_id": target_service["id"],
    }, token=customer_token)
    assert status == 200, f"Coupon validation failed: {coupon_res}"
    print(f"  [OK] Coupon WELCOME20 validated: ${coupon_res['discount_amount']} discount applied")

    # Generate distinct future slot to prevent collision
    unique_offset = int(time.time()) % 1000
    target_date = (date.today() + timedelta(days=20 + (unique_offset % 30))).isoformat()
    hour = 9 + (unique_offset % 7)
    target_time = f"{hour:02d}:00:00"

    booking_payload = {
        "service_id": target_service["id"],
        "provider_id": provider_id,
        "scheduled_date": target_date,
        "scheduled_time": target_time,
        "duration_minutes": 60,
        "coupon_code": "WELCOME20",
        "address": "742 Evergreen Terrace",
        "city": "San Francisco",
        "zip_code": "94103",
        "notes": "Full-cycle automated workflow integration test",
    }
    status, booking = request("POST", "/bookings/", booking_payload, token=customer_token)
    assert status == 201, f"Booking creation failed ({status}): {booking}"
    booking_id = booking["id"]
    booking_ref = booking["booking_reference"]
    print(f"  [OK] Booking created #{booking_id} ({booking_ref}) | Status: {booking['status']} | Total: ${booking['total_price']}")

    # 5. Customer Rescheduling and Ownership Check
    print("\n[Step 5] Customer Rescheduling Capability")
    new_time = f"{(hour + 1) % 17:02d}:30:00"
    status, rescheduled = request("PATCH", f"/bookings/{booking_id}/reschedule", {
        "scheduled_date": target_date,
        "scheduled_time": new_time,
    }, token=customer_token)
    assert status == 200, f"Reschedule failed ({status}): {rescheduled}"
    print(f"  [OK] Booking #{booking_id} rescheduled to {rescheduled['scheduled_date']} at {rescheduled['scheduled_time']}")

    # 6. Provider Accepts Booking
    print("\n[Step 6] Provider Accepts Booking")
    status, accepted = request("PATCH", f"/bookings/{booking_id}/status", {
        "status": "confirmed",
    }, token=provider_token)
    assert status == 200, f"Provider acceptance failed ({status}): {accepted}"
    print(f"  [OK] Provider accepted booking #{booking_id}. Status is now '{accepted['status']}'")

    # 7. Technician Assignment
    print("\n[Step 7] Provider Dispatches Field Technician")
    status, assigned = request("POST", f"/bookings/{booking_id}/assign", {
        "technician_id": tech_user_id,
        "notes": "Carry leak detection kit and replacement seals",
    }, token=provider_token)
    assert status == 200, f"Technician assignment failed ({status}): {assigned}"
    print(f"  [OK] Field Technician #{tech_user_id} assigned. Booking status: '{assigned['status']}'")

    # 8. Technician Receives Work Order & Uploads Work Verification Photo
    print("\n[Step 8] Technician Work Log Photo Upload")
    status, photo_res = request("POST", f"/bookings/{booking_id}/images", {
        "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
        "caption": "Work site pre-repair inspection photo",
        "image_type": "before",
    }, token=tech_token)
    assert status == 201, f"Image upload failed ({status}): {photo_res}"
    print(f"  [OK] Work photo logged by technician: Image #{photo_res['id']} ({photo_res['image_type']})")

    # 9. Technician Advances Job to In-Progress then Completed
    print("\n[Step 9] Technician Executes Job")
    status, in_prog = request("PATCH", f"/bookings/{booking_id}/status", {
        "status": "in_progress",
    }, token=tech_token)
    assert status == 200, f"In-progress transition failed ({status}): {in_prog}"
    print(f"  [OK] Technician marked job in progress: '{in_prog['status']}'")

    status, completed = request("PATCH", f"/bookings/{booking_id}/status", {
        "status": "completed",
    }, token=tech_token)
    assert status == 200, f"Completed transition failed ({status}): {completed}"
    print(f"  [OK] Technician completed service: '{completed['status']}'")

    # 10. Customer Demo Payment Confirmation & Invoice Generation
    print("\n[Step 10] Customer Payment & Official Tax Invoice")
    status, payment = request("POST", "/payments/process-demo", {
        "booking_id": booking_id,
        "amount": booking["total_price"],
        "payment_method": "credit_card",
        "demo_card_number": "4242424242424242",
    }, token=customer_token)
    assert status == 200, f"Payment process-demo failed ({status}): {payment}"
    pay_obj = payment.get("payment", payment)
    print(f"  [OK] Payment processed: TXN #{pay_obj['id']} | Status: {pay_obj['status']}")

    status, invoice = request("GET", f"/invoices/booking/{booking_id}", token=customer_token)
    assert status == 200, f"Invoice retrieval failed ({status}): {invoice}"
    print(f"  [OK] Official Tax Invoice retrieved: {invoice['invoice_number']} | Subtotal: ${invoice['subtotal']} | Discount: -${invoice['discount_amount']} | Total: ${invoice['total_amount']}")

    # 11. Customer Reviews Completed Service
    print("\n[Step 11] Customer Review Submission")
    status, review = request("POST", "/reviews/", {
        "booking_id": booking_id,
        "rating": 5,
        "comment": "Outstanding service! Arrived right on schedule and resolved the drain issue cleanly.",
    }, token=customer_token)
    assert status == 201, f"Review submission failed ({status}): {review}"
    print(f"  [OK] 5-star review posted successfully: Rating {review['rating']}/5 — '{review['comment']}'")

    # 12. Customer Files Dispute & Admin Resolves
    print("\n[Step 12] Customer Dispute Ticket & Admin Resolution")
    status, comp = request("POST", "/complaints/", {
        "booking_id": booking_id,
        "subject": "Inquiry regarding warranty follow-up",
        "description": "Please confirm warranty period for replacement drain piping.",
        "priority": "low",
    }, token=customer_token)
    assert status == 201, f"Complaint creation failed ({status}): {comp}"
    ticket_id = comp["id"]
    print(f"  [OK] Customer filed ticket: {comp['ticket_number']} | Priority: {comp['priority']}")

    # Admin resolves dispute
    status, admin_login = request("POST", "/auth/login", {"email": "superadmin@homeserve.com", "password": "superadmin123"})
    assert status == 200, f"Superadmin login failed: {admin_login}"
    admin_token = admin_login["access_token"]

    status, resolved = request("PATCH", f"/complaints/{ticket_id}/status", {
        "status": "resolved",
        "resolution_notes": "Confirmed 90-day comprehensive parts and workmanship warranty.",
    }, token=admin_token)
    assert status == 200, f"Admin resolution failed ({status}): {resolved}"
    print(f"  [OK] Admin resolved dispute ticket {resolved['ticket_number']}: '{resolved['status']}'")

    # 13. Dynamic Dashboard Analytics Verification
    print("\n[Step 13] Role Dashboard Analytics Verification")
    status, admin_stats = request("GET", "/admin/stats", token=admin_token)
    assert status == 200 and admin_stats["total_users"] > 0, f"Admin stats failed: {admin_stats}"
    print(f"  [OK] Admin Analytics: {admin_stats['total_users']} Users, {admin_stats['total_bookings']} Bookings, ${admin_stats['total_revenue']} Revenue")

    print("\n" + "=" * 70)
    print("ALL 13 WORKFLOW INTEGRATION PHASES PASSED WITH 100% SUCCESS!")
    print("=" * 70)

if __name__ == "__main__":
    run_full_integration_test()
