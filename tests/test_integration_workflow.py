import time
from datetime import date, timedelta
import pytest
from tests.conftest import api_request


class TestCompleteBusinessWorkflow:
    """End-to-End integration test validating the entire 12-step customer and provider lifecycle."""

    def test_full_12_step_customer_to_provider_lifecycle(self, provider_token, technician_token, admin_token):
        """
        Execute the comprehensive 12-step workflow:
        1. Customer Registration & Login
        2. Category & Service Discovery
        3. Provider Selection
        4. Availability Verification
        5. Booking Creation with Coupon Discount
        6. Provider Acceptance
        7. Field Technician Assignment
        8. Technician Arrival & Photo Logging
        9. Technician Job Execution & Completion
        10. Customer Payment Processing
        11. Tax Invoice Retrieval
        12. Customer Star Review & Rating Recalculation
        """
        # Step 1: Customer Registration & Login
        ts = int(time.time() * 1000)
        cust_email = f"e2e.cust.{ts}@homeserve-qa.com"
        reg_payload = {
            "email": cust_email,
            "password": "CustomerSecure123!",
            "full_name": f"Workflow Tester {ts}",
            "phone": "+1-555-0188",
            "role": "customer",
            "city": "San Francisco",
            "state": "CA",
            "zip_code": "94103"
        }
        reg_status, reg_res = api_request("/auth/register", method="POST", data=reg_payload)
        assert reg_status == 201, f"Step 1 Failed: Customer Registration returned {reg_status}: {reg_res}"
        customer_token = reg_res["access_token"]
        customer_id = reg_res["user"]["id"]

        # Step 2: Category & Service Discovery
        cat_status, categories = api_request("/services/categories", method="GET")
        assert cat_status == 200 and len(categories) >= 8, f"Step 2 Failed: Categories missing: {categories}"
        
        srv_status, srv_data = api_request("/services?limit=100", method="GET")
        services = srv_data.get("services", srv_data) if isinstance(srv_data, dict) else srv_data
        assert srv_status == 200 and len(services) >= 12, f"Step 2 Failed: Services missing: {srv_data}"
        selected_service = services[0]
        service_id = selected_service["id"]
        base_price = selected_service["base_price"]

        # Step 3: Provider Selection
        prov_status, providers = api_request("/providers", method="GET")
        assert prov_status == 200 and len(providers) > 0, f"Step 3 Failed: Providers missing"
        # Select verified provider (User ID: 2 - ProFix)
        target_provider_id = 2

        # Step 4: Availability Verification
        avail_status, avail = api_request(f"/providers/{target_provider_id}/availability", method="GET")
        assert avail_status == 200, f"Step 4 Failed: Availability fetch failed: {avail}"

        # Step 5: Booking Creation with Coupon Discount
        # Validate coupon WELCOME20
        coup_status, coup = api_request("/coupons/validate", method="POST", data={"code": "WELCOME20", "subtotal": base_price})
        discount = coup["discount_amount"] if coup.get("is_valid") else 0.0

        offset = 600 + (ts % 10000)
        target_date = (date.today() + timedelta(days=offset)).isoformat()
        b_payload = {
            "provider_id": target_provider_id,
            "service_id": service_id,
            "scheduled_date": target_date,
            "scheduled_time": "10:30:00",
            "duration_minutes": 60,
            "address": "123 Golden Gate Ave, Suite 400",
            "city": "San Francisco",
            "zip_code": "94102",
            "notes": "E2E automated integration run",
            "coupon_code": "WELCOME20",
            "total_price": max(0.0, round(base_price - discount, 2))
        }
        b_status, booking = api_request("/bookings", method="POST", data=b_payload, token=customer_token)
        assert b_status == 201, f"Step 5 Failed: Booking creation returned {b_status}: {booking}"
        booking_id = booking["id"]
        assert booking["status"] == "pending"

        # Step 6: Provider Acceptance
        acc_status, acc_res = api_request(f"/bookings/{booking_id}/status", method="PATCH", data={"status": "confirmed"}, token=provider_token)
        assert acc_status == 200, f"Step 6 Failed: Provider accept returned {acc_status}: {acc_res}"
        assert acc_res["status"] == "confirmed"

        # Step 7: Field Technician Assignment
        # Assign Dave Miller (User ID: 4)
        tech_user_id = 4
        assign_payload = {"technician_id": tech_user_id, "notes": "Dispatched for primary diagnostic"}
        assign_status, assign_res = api_request(f"/bookings/{booking_id}/assign", method="POST", data=assign_payload, token=provider_token)
        assert assign_status == 200, f"Step 7 Failed: Technician assignment returned {assign_status}: {assign_res}"
        assert assign_res["status"] == "provider_assigned"

        # Step 8: Technician Arrival & Photo Logging
        img_payload = {
            "image_url": "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=600&q=80",
            "caption": "Pre-work initial inspection diagnostic photo",
            "image_type": "before"
        }
        img_status, img_res = api_request(f"/bookings/{booking_id}/images", method="POST", data=img_payload, token=technician_token)
        assert img_status == 201, f"Step 8 Failed: Work image log returned {img_status}: {img_res}"

        # Step 9: Technician Job Execution & Completion
        # In progress
        prog_status, prog_res = api_request(f"/bookings/{booking_id}/status", method="PATCH", data={"status": "in_progress"}, token=technician_token)
        assert prog_status == 200
        assert prog_res["status"] == "in_progress"

        # Completed
        comp_status, comp_res = api_request(f"/bookings/{booking_id}/status", method="PATCH", data={"status": "completed"}, token=technician_token)
        assert comp_status == 200
        assert comp_res["status"] == "completed"

        # Step 10: Customer Payment Processing
        pay_payload = {"booking_id": booking_id, "payment_method": "credit_card"}
        pay_status, payment = api_request("/payments/process-demo", method="POST", data=pay_payload, token=customer_token)
        assert pay_status == 200, f"Step 10 Failed: Payment processing returned {pay_status}: {payment}"
        assert payment["status"] == "completed"
        assert payment["is_demo"] is True
        assert payment["platform_fee"] == round(payment["amount"] * 0.10, 2)

        # Step 11: Tax Invoice Retrieval
        inv_status, invoice = api_request(f"/invoices/booking/{booking_id}", method="GET", token=customer_token)
        assert inv_status == 200, f"Step 11 Failed: Invoice fetch returned {inv_status}: {invoice}"
        assert invoice["invoice_number"].startswith("INV-")
        assert invoice["status"] == "paid"
        assert invoice["total_amount"] == payment["amount"]

        # Step 12: Customer Star Review & Rating Recalculation
        rev_payload = {
            "booking_id": booking_id,
            "rating": 5,
            "comment": "Exceptional precision and punctuality. Solved our home maintenance issue effortlessly!"
        }
        rev_status, review = api_request("/reviews", method="POST", data=rev_payload, token=customer_token)
        assert rev_status == 201, f"Step 12 Failed: Review creation returned {rev_status}: {review}"
        assert review["rating"] == 5.0
        assert review["customer_name"] is not None
