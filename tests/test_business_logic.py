import time
from datetime import date, timedelta
import pytest
from tests.conftest import api_request


def _get_unique_test_date():
    """Generate a unique future date for test bookings to avoid collisions with prior test runs."""
    offset = 120 + (int(time.time() * 1000) % 10000)
    return (date.today() + timedelta(days=offset)).isoformat()


class TestCouponsAndPricing:
    """Test suite for service pricing, coupon validation, discounts, and commission."""

    def test_coupon_percentage_discount(self):
        """Verify percentage discount calculation with WELCOME20 (20% off)."""
        payload = {"code": "WELCOME20", "subtotal": 100.0}
        status, res = api_request("/coupons/validate", method="POST", data=payload)
        assert status == 200, f"Validation failed: {res}"
        assert res["is_valid"] is True
        assert res["discount_amount"] == 20.0
        assert res["final_amount"] == 80.0

    def test_coupon_flat_discount(self):
        """Verify flat dollar discount calculation with SAVE10 ($10 off)."""
        payload = {"code": "SAVE10", "subtotal": 100.0}
        status, res = api_request("/coupons/validate", method="POST", data=payload)
        assert status == 200, f"Validation failed: {res}"
        assert res["is_valid"] is True
        assert res["discount_amount"] == 10.0
        assert res["final_amount"] == 90.0

    def test_coupon_below_minimum_order(self):
        """Verify coupon is rejected if order subtotal is below minimum order amount."""
        payload = {"code": "WELCOME20", "subtotal": 20.0}  # min_order_amount is 40.0
        status, res = api_request("/coupons/validate", method="POST", data=payload)
        assert status == 200
        assert res["is_valid"] is False
        assert "minimum order" in res["message"].lower()

    def test_coupon_invalid_code(self):
        """Verify non-existent coupon code is rejected."""
        payload = {"code": "FAKECODE999", "subtotal": 100.0}
        status, res = api_request("/coupons/validate", method="POST", data=payload)
        assert status == 200
        assert res["is_valid"] is False
        assert "invalid" in res["message"].lower()

    def test_platform_commission_calculation(self, customer_token, admin_token):
        """Verify 10% platform commission calculation and 90% provider net payout."""
        target_date = _get_unique_test_date()
        b_payload = {
            "provider_id": 2,
            "service_id": 19,  # AC Deep Foam Cleaning ($79.0)
            "scheduled_date": target_date,
            "scheduled_time": "11:00:00",
            "duration_minutes": 60,
            "address": "456 Test Blvd, Apt 4B",
            "city": "San Francisco",
            "total_price": 79.0
        }
        b_status, booking = api_request("/bookings", method="POST", data=b_payload, token=customer_token)
        assert b_status == 201, f"Booking creation failed: {booking}"
        booking_id = booking["id"]

        # Process demo payment
        p_payload = {"booking_id": booking_id, "payment_method": "credit_card"}
        p_status, payment = api_request("/payments/process-demo", method="POST", data=p_payload, token=customer_token)
        assert p_status == 200, f"Payment failed: {payment}"

        gross = payment["amount"]
        platform_fee = payment["platform_fee"]
        provider_net = payment["provider_amount"]

        assert gross == 79.0
        assert platform_fee == round(gross * 0.10, 2)  # 10% commission = $7.90
        assert provider_net == round(gross - platform_fee, 2)  # 90% net = $71.10
        assert payment["is_demo"] is True


class TestBookingLifecycleAndValidation:
    """Test suite for booking validations, state transitions, overlaps, and cancellations."""

    def test_booking_past_date_rejected(self, customer_token):
        """Verify bookings with past scheduled dates are rejected with HTTP 400."""
        past_date = (date.today() - timedelta(days=1)).isoformat()
        payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": past_date,
            "scheduled_time": "10:00:00",
            "duration_minutes": 60,
            "address": "123 Past Way",
            "total_price": 50.0
        }
        status, res = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 400, f"Expected 400 for past date, got {status}: {res}"
        assert "past" in str(res).lower()

    def test_booking_double_booking_overlap_prevention(self, customer_token):
        """Verify that conflicting overlapping provider appointments return HTTP 409 Conflict."""
        conflict_date = _get_unique_test_date()
        payload1 = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": conflict_date,
            "scheduled_time": "14:00:00",
            "duration_minutes": 60,
            "address": "100 Main St",
            "total_price": 60.0
        }
        status1, b1 = api_request("/bookings", method="POST", data=payload1, token=customer_token)
        assert status1 == 201, f"Initial booking failed: {b1}"

        # Overlapping booking attempt (14:30 falls inside 14:00 - 15:00 window)
        payload2 = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": conflict_date,
            "scheduled_time": "14:30:00",
            "duration_minutes": 60,
            "address": "200 Main St",
            "total_price": 60.0
        }
        status2, b2 = api_request("/bookings", method="POST", data=payload2, token=customer_token)
        assert status2 == 409, f"Expected 409 Conflict for overlapping slot, got {status2}: {b2}"
        assert "overlapping" in str(b2).lower()

    def test_booking_reschedule_workflow(self, customer_token):
        """Verify customer can reschedule a booking to an available future time slot."""
        orig_date = _get_unique_test_date()
        payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": orig_date,
            "scheduled_time": "09:00:00",
            "duration_minutes": 60,
            "address": "300 Reschedule Ave",
            "total_price": 60.0
        }
        status, b = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 201

        # Reschedule to 16:00
        new_date = (date.today() + timedelta(days=200 + (int(time.time() * 1000) % 5000))).isoformat()
        r_payload = {"scheduled_date": new_date, "scheduled_time": "16:00:00"}
        r_status, r_res = api_request(f"/bookings/{b['id']}/reschedule", method="PATCH", data=r_payload, token=customer_token)
        assert r_status == 200, f"Reschedule failed: {r_res}"
        assert r_res["scheduled_date"] == new_date
        assert r_res["scheduled_time"] == "16:00:00"

    def test_booking_cancel_workflow(self, customer_token):
        """Verify customer can cancel an active booking with a cancellation reason."""
        target_date = _get_unique_test_date()
        payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": target_date,
            "scheduled_time": "13:00:00",
            "duration_minutes": 60,
            "address": "400 Cancel Blvd",
            "total_price": 60.0
        }
        status, b = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 201

        c_payload = {"cancellation_reason": "Customer travel plans changed"}
        c_status, c_res = api_request(f"/bookings/{b['id']}/cancel", method="PATCH", data=c_payload, token=customer_token)
        assert c_status == 200, f"Cancel failed: {c_res}"
        assert c_res["status"] == "cancelled"

        # Attempt to cancel again (must return 400 Bad Request)
        c2_status, c2_res = api_request(f"/bookings/{b['id']}/cancel", method="PATCH", data=c_payload, token=customer_token)
        assert c2_status == 400, f"Expected 400 for already cancelled booking, got {c2_status}: {c2_res}"

    def test_invalid_status_transition_rejected(self, customer_token):
        """Verify that skipping the workflow (e.g. pending directly to completed) is rejected."""
        target_date = _get_unique_test_date()
        payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": target_date,
            "scheduled_time": "15:00:00",
            "duration_minutes": 60,
            "address": "500 Skip St",
            "total_price": 60.0
        }
        status, b = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 201

        # Attempt illegal transition: pending -> completed
        t_payload = {"status": "completed"}
        t_status, t_res = api_request(f"/bookings/{b['id']}/status", method="PATCH", data=t_payload, token=customer_token)
        assert t_status == 400, f"Expected 400 for invalid state transition, got {t_status}: {t_res}"
        assert "cannot transition" in str(t_res).lower()


class TestPaymentAndInvoiceSecurity:
    """Test suite for payment integrity, invoice generation, and security boundaries."""

    def test_client_cannot_directly_mark_payment_paid(self, customer_token):
        """Verify customers cannot alter payment records via PATCH /payments/{id} (HTTP 403)."""
        payload = {"status": "completed"}
        status, res = api_request("/payments/1", method="PATCH", data=payload, token=customer_token)
        assert status == 403, f"Expected 403 Forbidden for non-admin payment patch, got {status}: {res}"

    def test_invoice_generation_and_retrieval(self, customer_token):
        """Verify that completed demo payments automatically generate accessible invoices."""
        target_date = _get_unique_test_date()
        payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": target_date,
            "scheduled_time": "10:00:00",
            "duration_minutes": 60,
            "address": "600 Invoice Way",
            "total_price": 65.0
        }
        status, b = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 201

        # Pay
        p_status, payment = api_request("/payments/process-demo", method="POST", data={"booking_id": b["id"]}, token=customer_token)
        assert p_status == 200

        # Retrieve invoice
        inv_status, inv = api_request(f"/invoices/booking/{b['id']}", method="GET", token=customer_token)
        assert inv_status == 200, f"Invoice fetch failed: {inv}"
        assert inv["booking_id"] == b["id"]
        assert inv["invoice_number"].startswith("INV-")
        assert inv["total_amount"] == 65.0
        assert inv["status"] == "paid"

    def test_review_permission_restrictions(self, customer_token):
        """Verify that customers cannot review bookings that are not in COMPLETED status."""
        target_date = _get_unique_test_date()
        payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": target_date,
            "scheduled_time": "11:00:00",
            "duration_minutes": 60,
            "address": "700 Review Test",
            "total_price": 65.0
        }
        status, b = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 201

        # Attempt to review pending booking
        r_payload = {
            "booking_id": b["id"],
            "rating": 5,
            "comment": "Too early review"
        }
        r_status, r_res = api_request("/reviews", method="POST", data=r_payload, token=customer_token)
        assert r_status == 400, f"Expected 400 for reviewing incomplete booking, got {r_status}: {r_res}"
        assert "completed" in str(r_res).lower()
