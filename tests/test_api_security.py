import time
import urllib.parse
from datetime import date, timedelta
import pytest
from tests.conftest import api_request


class TestInputValidationAndSanitization:
    """Test suite for input validation, boundary constraints, and injection protection."""

    def test_missing_required_fields_in_booking(self, customer_token):
        """Verify that omitting required fields returns HTTP 422 Unprocessable Entity."""
        payload = {
            "provider_id": 2
            # Missing service_id, scheduled_date, scheduled_time, address
        }
        status, res = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 422, f"Expected 422 for missing fields, got {status}: {res}"

    def test_invalid_data_types_in_booking(self, customer_token):
        """Verify that passing incorrect data types returns HTTP 422."""
        payload = {
            "provider_id": "NOT_AN_INT",
            "service_id": 1,
            "scheduled_date": "invalid-date",
            "scheduled_time": "10:00:00",
            "duration_minutes": "SIXTY",
            "address": "123 Main St",
            "total_price": "FREE"
        }
        status, res = api_request("/bookings", method="POST", data=payload, token=customer_token)
        assert status == 422, f"Expected 422 for invalid data types, got {status}: {res}"

    @pytest.mark.parametrize("malicious_input", [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "1' UNION SELECT 1,2,3,4,5--",
        "<script>alert('XSS')</script>",
        "../../etc/passwd",
    ])
    def test_sql_injection_resilience_in_search(self, malicious_input):
        """Verify that malicious search inputs do not cause SQL injection or server crashes."""
        # Test services search
        status, res = api_request(f"/search/services?q={urllib.parse.quote(malicious_input)}", method="GET")
        assert status == 200, f"Search crashed on input {malicious_input}: {res}"
        assert isinstance(res, list), "Expected list response"

        # Test providers search
        p_status, p_res = api_request(f"/search/providers?q={urllib.parse.quote(malicious_input)}", method="GET")
        assert p_status == 200, f"Provider search crashed on input {malicious_input}: {p_res}"
        assert isinstance(p_res, list), "Expected list response"


class TestOwnershipAndDataIsolation:
    """Test suite for horizontal privilege escalation prevention and tenant isolation."""

    def test_customer_cannot_access_other_customer_booking(self, customer_token):
        """Verify Customer A cannot view or manipulate Customer B's booking (HTTP 403)."""
        # Login as customer B (Jason Brooks, ID: 5)
        status, b_login = api_request("/auth/login", method="POST", data={"email": "jason.customer@homeserve.com", "password": "customer123"})
        assert status == 200
        customer_b_token = b_login["access_token"]
        customer_b_id = b_login["user"]["id"]

        # Customer B creates a booking
        offset = 300 + (int(time.time() * 1000) % 5000)
        target_date = (date.today() + timedelta(days=offset)).isoformat()
        b_payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": target_date,
            "scheduled_time": "12:00:00",
            "duration_minutes": 60,
            "address": "777 Customer B Ave",
            "total_price": 60.0
        }
        b_status, booking = api_request("/bookings", method="POST", data=b_payload, token=customer_b_token)
        assert b_status == 201
        booking_id = booking["id"]

        # Customer A (Emily Watson) attempts to view Customer B's booking
        v_status, v_res = api_request(f"/bookings/{booking_id}", method="GET", token=customer_token)
        assert v_status == 403, f"Expected 403 Forbidden for horizontal access, got {v_status}: {v_res}"

        # Customer A attempts to cancel Customer B's booking
        c_status, c_res = api_request(f"/bookings/{booking_id}/cancel", method="PATCH", data={"cancellation_reason": "Malicious cancel"}, token=customer_token)
        assert c_status == 403, f"Expected 403 Forbidden for cancelling other's booking, got {c_status}: {c_res}"

    def test_provider_cannot_tamper_with_other_provider_booking(self, customer_token):
        """Verify Provider A cannot manipulate Provider B's bookings (HTTP 403)."""
        # Login as Provider 1 (ProFix Home Solutions, User ID: 2)
        status, p1_login = api_request("/auth/login", method="POST", data={"email": "provider@homeserve.com", "password": "provider123"})
        p1_token = p1_login["access_token"]

        # Login as Provider 2 (SparkVolt Electrical, User ID: 5)
        status, p2_login = api_request("/auth/login", method="POST", data={"email": "spark@homeserve.com", "password": "provider123"})
        p2_token = p2_login["access_token"]
        p2_id = p2_login["user"]["id"]

        # Customer creates a booking specifically for Provider 2
        offset = 400 + (int(time.time() * 1000) % 5000)
        target_date = (date.today() + timedelta(days=offset)).isoformat()
        b_payload = {
            "provider_id": p2_id,
            "service_id": 2,  # Electrical
            "scheduled_date": target_date,
            "scheduled_time": "14:00:00",
            "duration_minutes": 60,
            "address": "888 Electric Ave",
            "total_price": 85.0
        }
        b_status, booking = api_request("/bookings", method="POST", data=b_payload, token=customer_token)
        assert b_status == 201
        booking_id = booking["id"]

        # Provider 1 attempts to view/accept Provider 2's booking
        status, res = api_request(f"/bookings/{booking_id}", method="GET", token=p1_token)
        assert status == 403, f"Expected 403 for cross-provider view, got {status}: {res}"

        t_status, t_res = api_request(f"/bookings/{booking_id}/status", method="PATCH", data={"status": "confirmed"}, token=p1_token)
        assert t_status == 403, f"Expected 403 for cross-provider status change, got {t_status}: {t_res}"

    def test_technician_cross_assignment_isolation(self, provider_token, customer_token):
        """Verify Technician A cannot modify or inspect Technician B's assigned jobs."""
        # 1. Login as Tech A (Dave Miller, ID: 4)
        status, t1_login = api_request("/auth/login", method="POST", data={"email": "technician@homeserve.com", "password": "tech123"})
        t1_token = t1_login["access_token"]
        t1_id = t1_login["user"]["id"]

        # 2. Login as Tech B (Marcus Vance, ID: 6)
        status, t2_login = api_request("/auth/login", method="POST", data={"email": "marcus.tech@homeserve.com", "password": "tech123"})
        t2_token = t2_login["access_token"]
        t2_id = t2_login["user"]["id"]

        # 3. Create confirmed booking
        offset = 500 + (int(time.time() * 1000) % 5000)
        target_date = (date.today() + timedelta(days=offset)).isoformat()
        b_payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": target_date,
            "scheduled_time": "15:00:00",
            "duration_minutes": 60,
            "address": "999 Tech Ave",
            "total_price": 70.0
        }
        b_status, booking = api_request("/bookings", method="POST", data=b_payload, token=customer_token)
        assert b_status == 201
        b_id = booking["id"]

        # Provider accepts
        api_request(f"/bookings/{b_id}/status", method="PATCH", data={"status": "confirmed"}, token=provider_token)

        # Provider assigns Tech B (Marcus Vance)
        a_status, a_res = api_request(f"/bookings/{b_id}/assign", method="POST", data={"technician_id": t2_id, "notes": "Marcus assigned"}, token=provider_token)
        assert a_status == 200

        # Tech B gets assignments
        t2_assign_status, t2_assignments = api_request("/technicians/me/assignments", method="GET", token=t2_token)
        assert t2_assign_status == 200
        matching = [a for a in t2_assignments if a["booking"] and a["booking"]["id"] == b_id]
        assert len(matching) > 0, "Tech B should have the assigned job"
        assignment_id = matching[0]["assignment_id"]

        # Tech A attempts to update Tech B's assignment status
        hack_status, hack_res = api_request(f"/technicians/assignments/{assignment_id}/status", method="PATCH", data={"status": "completed"}, token=t1_token)
        assert hack_status == 403, f"Expected 403 Forbidden for cross-technician update, got {hack_status}: {hack_res}"
        assert "not your" in str(hack_res).lower()


class TestDataLeakageAndResponseHygiene:
    """Test suite ensuring credentials, secrets, and raw internal traces are never exposed."""

    def test_passwords_never_exposed_in_api_responses(self, admin_token, customer_token):
        """Verify that hashed_password or plain passwords never appear in API responses."""
        # 1. /auth/me
        status, me = api_request("/auth/me", method="GET", token=customer_token)
        assert status == 200
        assert "password" not in me
        assert "hashed_password" not in me

        # 2. /admin/users
        u_status, users = api_request("/users", method="GET", token=admin_token)
        if u_status == 200 and isinstance(users, list):
            for u in users:
                assert "password" not in u
                assert "hashed_password" not in u

    def test_error_handling_sanitization(self):
        """Verify that error responses do not leak raw Python stack traces."""
        # Request a non-existent route with invalid characters
        status, res = api_request("/nonexistent/endpoint/test", method="GET")
        assert status == 404
        assert "traceback (most recent call last)" not in str(res).lower()
