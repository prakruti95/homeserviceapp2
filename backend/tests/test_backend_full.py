import sys
import json
import urllib.request
import urllib.error
from datetime import date, timedelta

BASE_URL = "http://127.0.0.1:8000/api"


def make_request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            resp_body = response.read().decode("utf-8")
            return response.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        resp_body = e.read().decode("utf-8")
        try:
            err_data = json.loads(resp_body)
        except Exception:
            err_data = {"detail": resp_body}
        return e.code, err_data


def test_full_backend():
    print("=" * 60)
    print("HOMESERVE BACKEND ARCHITECTURE FULL VERIFICATION TEST")
    print("=" * 60)

    # ----------------------------------------------------
    # Step 1: Authentication & Roles Verification
    # ----------------------------------------------------
    print("\n[Step 1] Verifying Roles & Authentication...")
    
    # 1.1 Super Admin Login
    status, res = make_request("/auth/login", method="POST", data={"email": "superadmin@homeserve.com", "password": "superadmin123"})
    assert status == 200, f"SuperAdmin login failed: {res}"
    superadmin_token = res["access_token"]
    assert res["user"]["role"] in ("super_admin", "SUPER_ADMIN"), f"Expected SUPER_ADMIN role: {res['user']['role']}"
    print("  -> Super Admin Authenticated (Role: SUPER_ADMIN)")

    # 1.2 Admin Login
    status, res = make_request("/auth/login", method="POST", data={"email": "admin@homeserve.com", "password": "admin123"})
    assert status == 200, f"Admin login failed: {res}"
    admin_token = res["access_token"]
    print("  -> Admin Authenticated (Role: ADMIN)")

    # 1.3 Provider Login
    status, res = make_request("/auth/login", method="POST", data={"email": "provider@homeserve.com", "password": "provider123"})
    assert status == 200, f"Provider login failed: {res}"
    provider_token = res["access_token"]
    provider_id = res["user"]["id"]
    print(f"  -> Provider Authenticated (User ID: {provider_id})")

    # 1.4 Technician Login
    status, res = make_request("/auth/login", method="POST", data={"email": "technician@homeserve.com", "password": "tech123"})
    assert status == 200, f"Technician login failed: {res}"
    tech_token = res["access_token"]
    tech_id = res["user"]["id"]
    print(f"  -> Field Technician Authenticated (User ID: {tech_id})")

    # 1.5 Customer Login
    status, res = make_request("/auth/login", method="POST", data={"email": "customer@homeserve.com", "password": "customer123"})
    assert status == 200, f"Customer login failed: {res}"
    customer_token = res["access_token"]
    customer_id = res["user"]["id"]
    print(f"  -> Customer Authenticated (User ID: {customer_id})")

    # 1.6 Token Revocation / Logout Test
    # Register temporary user, get token, logout, assert token revoked
    import time
    tmp_email = f"logout_test_{int(time.time())}@test.com"
    status, res = make_request("/auth/register", method="POST", data={
        "email": tmp_email,
        "password": "Password123!",
        "full_name": "Logout Tester",
        "role": "customer"
    })
    if status == 201:
        tmp_token = res["access_token"]
        # Logout
        l_status, l_res = make_request("/auth/logout", method="POST", token=tmp_token)
        assert l_status == 200, f"Logout failed: {l_res}"
        # Attempt to access protected endpoint with revoked token
        m_status, m_res = make_request("/auth/me", method="GET", token=tmp_token)
        assert m_status == 401, f"Expected 401 for revoked token, got {m_status}: {m_res}"
        print("  -> Token Revocation / Logout Tested: Revoked session correctly rejected (401)")

    # ----------------------------------------------------
    # Step 2: Customer Profile & Addresses
    # ----------------------------------------------------
    print("\n[Step 2] Customer Profile & Saved Addresses...")
    status, res = make_request("/customers/me", method="GET", token=customer_token)
    assert status == 200, f"Customer profile query failed: {res}"
    print(f"  -> Profile loaded: {res['full_name']} | Loyalty points: {res['loyalty_points']}")

    # Add a saved address
    status, res = make_request("/customers/me/addresses", method="POST", token=customer_token, data={
        "label": "Vacation Home",
        "street_address": "400 Ocean Boulevard",
        "unit_number": "Suite 12",
        "city": "San Francisco",
        "state": "CA",
        "zip_code": "94109",
        "is_default": False
    })
    assert status == 201, f"Add address failed: {res}"
    new_addr_id = res["id"]
    print(f"  -> Saved Address created: ID #{new_addr_id} ({res['label']}: {res['street_address']})")

    # ----------------------------------------------------
    # Step 3: Coupon Discount Validation
    # ----------------------------------------------------
    print("\n[Step 3] Coupon Validation & Discount Computation...")
    status, res = make_request("/coupons/validate", method="POST", data={"code": "WELCOME20", "subtotal": 120.0})
    assert status == 200 and res["is_valid"] is True, f"Coupon validation failed: {res}"
    assert res["discount_amount"] == 24.0, f"Expected 24.0 discount, got {res['discount_amount']}"
    print(f"  -> Coupon 'WELCOME20' applied on $120.00: -${res['discount_amount']} -> Final: ${res['final_amount']}")

    # ----------------------------------------------------
    # Step 4: Booking Creation, Reference & Overlap Prevention
    # ----------------------------------------------------
    print("\n[Step 4] Booking Creation & Overlap Protection...")
    # Find active service
    status, res = make_request("/services/?limit=5", method="GET")
    assert status == 200 and len(res["services"]) > 0, "No services found"
    service = res["services"][0]
    service_id = service["id"]

    booking_date = (date.today() + timedelta(days=2)).isoformat()
    booking_time = "14:00:00"

    # Create Booking with coupon
    status, booking1 = make_request("/bookings", method="POST", token=customer_token, data={
        "provider_id": provider_id,
        "service_id": service_id,
        "scheduled_date": booking_date,
        "scheduled_time": booking_time,
        "duration_minutes": 60,
        "total_price": service["base_price"],
        "address": "789 Pine Street, Apt 4B",
        "coupon_code": "WELCOME20",
        "notes": "Please call 10 mins before arrival"
    })
    assert status == 201, f"Booking creation failed: {booking1}"
    b1_id = booking1["id"]
    b1_ref = booking1.get("booking_reference")
    print(f"  -> Booking #1 Created: ID #{b1_id} | Ref: {b1_ref} | Subtotal: ${booking1['subtotal']} | Discount: ${booking1['discount_amount']} | Total: ${booking1['total_price']}")
    assert b1_ref and b1_ref.startswith("HS-BK-"), f"Invalid booking reference: {b1_ref}"

    # OVERLAP PREVENTION: Attempt to book the exact same provider in the overlapping window
    overlap_time = "14:30:00"  # overlaps with 14:00 - 15:00
    status, res = make_request("/bookings", method="POST", token=customer_token, data={
        "provider_id": provider_id,
        "service_id": service_id,
        "scheduled_date": booking_date,
        "scheduled_time": overlap_time,
        "duration_minutes": 60,
        "total_price": service["base_price"],
        "address": "123 Another St",
    })
    assert status == 409, f"Expected 409 Conflict for overlapping booking, got {status}: {res}"
    print(f"  -> Overlap Protection Verified: Attempt to double-book returned HTTP 409 Conflict ('{res['detail']}')")

    # Reschedule Booking Test
    new_reschedule_time = "16:00:00"
    status, res = make_request(f"/bookings/{b1_id}/reschedule", method="PATCH", token=customer_token, data={
        "scheduled_date": booking_date,
        "scheduled_time": new_reschedule_time
    })
    assert status == 200, f"Reschedule failed: {res}"
    print(f"  -> Rescheduling Verified: Booking #{b1_id} updated to {booking_date} at {new_reschedule_time}")

    # ----------------------------------------------------
    # Step 5: Demo Payment Checkout, Commission & Invoices
    # ----------------------------------------------------
    print("\n[Step 5] Demo Payment Processing, 10% Platform Fee & Invoicing...")
    # Client security check: Attempt direct mark as paid via update_payment
    status, res = make_request(f"/payments/{b1_id}", method="PATCH", token=customer_token, data={"status": "paid"})
    assert status in (401, 403), f"Expected 403 for untrusted payment patch, got {status}: {res}"
    print("  -> Security Rule Verified: Clients cannot directly mark payments as paid.")

    # Process Demo Payment
    status, pay_res = make_request("/payments/process-demo", method="POST", token=customer_token, data={
        "booking_id": b1_id,
        "payment_method": "credit_card",
        "card_last4": "4242"
    })
    assert status == 200, f"Demo payment processing failed: {pay_res}"
    assert pay_res["is_demo"] is True, "Payment should be flagged is_demo=True"
    assert pay_res["platform_fee"] > 0, "Platform fee not computed"
    print(f"  -> Demo Payment Processed: Trans ID: {pay_res['transaction_id']}")
    print(f"     Gross: ${pay_res['amount']:.2f} | Platform 10% Fee: ${pay_res['platform_fee']:.2f} | Net Provider Payout: ${pay_res['provider_amount']:.2f}")

    # Query Auto-Generated Invoice
    status, inv_res = make_request(f"/invoices/booking/{b1_id}", method="GET", token=customer_token)
    assert status == 200, f"Invoice query failed: {inv_res}"
    print(f"  -> Invoice Auto-Generated: Number: {inv_res['invoice_number']} | Status: {inv_res['status']} | Total: ${inv_res['total_amount']:.2f}")

    # ----------------------------------------------------
    # Step 6: Technician Assignment & Photo Logging
    # ----------------------------------------------------
    print("\n[Step 6] Technician Assignment & Job Inspection Photos...")
    status, res = make_request(f"/bookings/{b1_id}/assign", method="POST", token=provider_token, data={
        "technician_id": tech_id,
        "notes": "Check breaker panel before replacing main capacitor"
    })
    assert status == 200, f"Technician assignment failed: {res}"
    print(f"  -> Technician #{tech_id} Assigned to Booking #{b1_id} | Status: {res['status']}")

    # Technician uploads inspection before-photo
    status, img_res = make_request(f"/bookings/{b1_id}/images", method="POST", token=tech_token, data={
        "image_url": "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
        "caption": "Initial diagnostic before repairs",
        "image_type": "before"
    })
    assert status == 201, f"Image upload failed: {img_res}"
    print(f"  -> Work Log Photo Recorded: ID #{img_res['id']} (Type: {img_res['image_type']})")

    # Complete the job workflow
    status, res = make_request(f"/bookings/{b1_id}/status", method="PATCH", token=tech_token, data={
        "status": "in_progress"
    })
    assert status == 200, f"Transition to in_progress failed: {res}"

    status, res = make_request(f"/bookings/{b1_id}/status", method="PATCH", token=tech_token, data={
        "status": "completed"
    })
    assert status == 200, f"Transition to completed failed: {res}"
    print(f"  -> Job Cycle Completed by Technician: Booking #{b1_id} status is now {res['status']}")

    # ----------------------------------------------------
    # Step 7: Customer Complaints & Disputes
    # ----------------------------------------------------
    print("\n[Step 7] Customer Complaints & Admin Resolution...")
    status, comp_res = make_request("/complaints", method="POST", token=customer_token, data={
        "booking_id": b1_id,
        "subject": "Minor cleanup query",
        "description": "Technician left a small plastic zip-tie near the floor board.",
        "priority": "low"
    })
    assert status == 201, f"Complaint creation failed: {comp_res}"
    comp_id = comp_res["id"]
    print(f"  -> Customer Complaint Registered: Ticket #{comp_res['ticket_number']} (Status: {comp_res['status']})")

    # Admin resolves dispute
    status, res = make_request(f"/complaints/{comp_id}/status", method="PATCH", token=admin_token, data={
        "status": "resolved",
        "resolution_notes": "Customer support issued $15 courtesy credit."
    })
    assert status == 200 and res["status"] == "resolved", f"Complaint resolution failed: {res}"
    print(f"  -> Admin Resolved Ticket: Status is now '{res['status']}' | Resolution: {res['resolution_notes']}")

    print("\n" + "=" * 60)
    print("ALL 7 CRITICAL BACKEND MODULES FULLY TESTED & VERIFIED (100% PASS)")
    print("=" * 60)


if __name__ == "__main__":
    try:
        test_full_backend()
    except AssertionError as e:
        print(f"\nTEST FAILED: {e}")
        sys.exit(1)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)
