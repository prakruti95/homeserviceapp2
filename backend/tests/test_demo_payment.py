import json
import urllib.request
import urllib.error
import pytest
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


import time
import uuid

def _get_unique_slot():
    # Use timestamp offset to ensure dynamic unique booking slot across repeat runs
    offset = int(time.time()) % 10000 + 100
    test_date = (date.today() + timedelta(days=offset)).strftime("%Y-%m-%d")
    return test_date

def test_demo_payment_flow():
    """Verify complete Demo Payment flow:
    1. Authenticate customer and provider
    2. Create a pending booking
    3. Test unauthorized payment attempt (security rule)
    4. Test successful Demo Payment via Credit Card
    5. Verify booking payment status updated to PAID/CONFIRMED
    6. Verify invoice generated with matching amount
    7. Test another booking with UPI Demo payment
    8. Test idempotent payment processing
    """
    # 1. Login customer
    c_status, c_res = make_request("/auth/login", method="POST", data={"email": "customer@homeserve.com", "password": "customer123"})
    assert c_status == 200, f"Customer login failed: {c_res}"
    customer_token = c_res["access_token"]
    customer_id = c_res["user"]["id"]

    # Login provider
    p_status, p_res = make_request("/auth/login", method="POST", data={"email": "provider@homeserve.com", "password": "provider123"})
    assert p_status == 200, f"Provider login failed: {p_res}"
    provider_token = p_res["access_token"]
    provider_id = p_res["user"]["id"]

    # 2. Create pending booking for testing Demo Card Payment
    unique_date = _get_unique_slot()
    status, booking = make_request("/bookings", method="POST", token=customer_token, data={
        "provider_id": provider_id,
        "service_id": 1,
        "scheduled_date": unique_date,
        "scheduled_time": "09:00:00",
        "duration_minutes": 60,
        "total_price": 85.0,
        "address": "456 Market St, Apt 10A",
    })
    assert status == 201, f"Booking creation failed: {booking}"
    b_id = booking["id"]
    assert booking["status"] == "pending"

    # 3. Security test: Another user/provider cannot pay for customer's booking
    status, err_res = make_request("/payments/process-demo", method="POST", token=provider_token, data={
        "booking_id": b_id,
        "payment_method": "credit_card",
        "card_last4": "4242",
        "cardholder_name": "ProFix Solutions",
    })
    assert status == 403, f"Expected 403 forbidden for unauthorized user payment, got {status}: {err_res}"

    # 4. Successful Demo Payment via Demo Credit Card
    status, pay_res = make_request("/payments/process-demo", method="POST", token=customer_token, data={
        "booking_id": b_id,
        "payment_method": "credit_card",
        "card_last4": "4242",
        "cardholder_name": "Emily Watson",
    })
    assert status == 200, f"Demo payment failed: {pay_res}"
    assert pay_res["is_demo"] is True
    assert pay_res["status"] in ("completed", "paid")
    assert pay_res["transaction_id"].startswith("TXN-DEMO-")
    assert pay_res["amount"] == 85.0
    assert pay_res["platform_fee"] == 8.50  # 10%
    assert pay_res["provider_amount"] == 76.50

    # 5. Verify booking was updated to CONFIRMED with payment_status
    status, b_check = make_request(f"/bookings/{b_id}", method="GET", token=customer_token)
    assert status == 200
    assert b_check["status"] == "confirmed"
    assert b_check["payment_status"] in ("completed", "paid")
    assert b_check["transaction_id"] == pay_res["transaction_id"]

    # 6. Verify invoice exists
    status, inv_res = make_request(f"/invoices/booking/{b_id}", method="GET", token=customer_token)
    assert status == 200
    assert inv_res["total_amount"] == 85.0
    assert inv_res["invoice_number"].startswith("INV-")

    # 7. Create another booking for Demo UPI Payment
    unique_date_upi = (date.today() + timedelta(days=int(time.time()) % 10000 + 1000)).strftime("%Y-%m-%d")
    status, booking_upi = make_request("/bookings", method="POST", token=customer_token, data={
        "provider_id": provider_id,
        "service_id": 1,
        "scheduled_date": unique_date_upi,
        "scheduled_time": "10:00:00",
        "duration_minutes": 60,
        "total_price": 120.0,
        "address": "456 Market St, Apt 10A",
    })
    assert status == 201, f"UPI Booking creation failed: {booking_upi}"
    b_upi_id = booking_upi["id"]

    # Successful Demo Payment via UPI Demo
    status, upi_pay_res = make_request("/payments/process-demo", method="POST", token=customer_token, data={
        "booking_id": b_upi_id,
        "payment_method": "wallet",
        "upi_id": "emily@okhdfcbank",
        "card_last4": "UPI",
    })
    assert status == 200, f"UPI demo payment failed: {upi_pay_res}"
    assert upi_pay_res["is_demo"] is True
    assert upi_pay_res["payment_method"] == "wallet"
    assert upi_pay_res["status"] in ("completed", "paid")
    assert upi_pay_res["transaction_id"].startswith("TXN-DEMO-")

    # 8. Idempotency test: Re-calling process-demo on paid booking returns existing payment
    status, re_pay = make_request("/payments/process-demo", method="POST", token=customer_token, data={
        "booking_id": b_upi_id,
        "payment_method": "wallet",
    })
    assert status == 200
    assert re_pay["transaction_id"] == upi_pay_res["transaction_id"]
    print("All demo payment scenarios verified successfully!")
