import time
import pytest
from tests.conftest import api_request
from app.core.security import hash_password, verify_password, create_access_token, decode_access_token


class TestAuthentication:
    """Test suite for authentication, password hashing, and token lifecycles."""

    def test_password_hashing_and_verification(self):
        """Verify that bcrypt correctly hashes and verifies passwords."""
        plain = "MySecretPassword123!"
        hashed = hash_password(plain)
        assert hashed != plain, "Hashed password must not match plain text"
        assert hashed.startswith("$2b$") or hashed.startswith("$2a$"), "Must use bcrypt format"
        assert verify_password(plain, hashed) is True, "Password verification failed"
        assert verify_password("WrongPassword!", hashed) is False, "Verification must fail on incorrect password"

    def test_registration_valid_user(self):
        """Verify that a new customer can register and receives a JWT token."""
        unique_email = f"test.qa.user.{int(time.time()*1000)}@homeserve-qa.com"
        payload = {
            "email": unique_email,
            "password": "SecurePassword123!",
            "full_name": "QA Test Customer",
            "phone": "+1-555-0199",
            "role": "customer",
            "city": "San Francisco",
            "state": "CA"
        }
        status, res = api_request("/auth/register", method="POST", data=payload)
        assert status == 201, f"Expected 201 Created, got {status}: {res}"
        assert "access_token" in res, "Missing access_token in registration response"
        assert res["user"]["email"] == unique_email
        assert res["user"]["role"] == "customer"
        assert "password" not in res["user"], "Password must never be returned in user response"

    def test_registration_duplicate_email(self):
        """Verify that registering with an existing email returns HTTP 409 Conflict."""
        payload = {
            "email": "customer@homeserve.com",
            "password": "Password123!",
            "full_name": "Duplicate Tester"
        }
        status, res = api_request("/auth/register", method="POST", data=payload)
        assert status == 409, f"Expected 409 Conflict, got {status}: {res}"
        assert "already exists" in str(res).lower()

    def test_registration_invalid_email(self):
        """Verify that registering with an invalid email returns HTTP 422 Unprocessable Entity."""
        payload = {
            "email": "not-an-email",
            "password": "Password123!",
            "full_name": "Invalid Email"
        }
        status, res = api_request("/auth/register", method="POST", data=payload)
        assert status == 422, f"Expected 422 for invalid email, got {status}: {res}"

    def test_registration_short_password(self):
        """Verify that passwords shorter than 6 characters are rejected with HTTP 422."""
        payload = {
            "email": f"shortpass.{int(time.time())}@homeserve-qa.com",
            "password": "123",
            "full_name": "Short Pass User"
        }
        status, res = api_request("/auth/register", method="POST", data=payload)
        assert status == 422, f"Expected 422 for short password, got {status}: {res}"

    @pytest.mark.parametrize("email,password,expected_role", [
        ("superadmin@homeserve.com", "superadmin123", "super_admin"),
        ("admin@homeserve.com", "admin123", "admin"),
        ("provider@homeserve.com", "provider123", "provider"),
        ("technician@homeserve.com", "tech123", "technician"),
        ("customer@homeserve.com", "customer123", "customer"),
    ])
    def test_multi_role_login(self, email, password, expected_role):
        """Verify successful login and correct role assignment for all platform roles."""
        status, res = api_request("/auth/login", method="POST", data={"email": email, "password": password})
        assert status == 200, f"Login failed for {email}: {res}"
        assert "access_token" in res
        assert res["user"]["role"] == expected_role

    def test_login_invalid_password(self):
        """Verify that incorrect password returns HTTP 401 Unauthorized."""
        status, res = api_request("/auth/login", method="POST", data={"email": "customer@homeserve.com", "password": "WrongPassword999!"})
        assert status == 401, f"Expected 401 Unauthorized, got {status}: {res}"

    def test_login_nonexistent_user(self):
        """Verify that non-existent email returns HTTP 401 Unauthorized."""
        status, res = api_request("/auth/login", method="POST", data={"email": "does.not.exist@homeserve.com", "password": "AnyPassword123!"})
        assert status == 401, f"Expected 401 Unauthorized, got {status}: {res}"

    def test_jwt_validation_and_tampering(self):
        """Verify that tampered JWT tokens are rejected with HTTP 401."""
        tampered_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature"
        status, res = api_request("/auth/me", method="GET", token=tampered_token)
        assert status == 401, f"Expected 401 for tampered token, got {status}: {res}"

    def test_token_revocation_logout(self):
        """Verify that logged-out tokens are added to revocation blacklist and rejected."""
        # 1. Login with a distinct customer account to test logout
        status, res = api_request("/auth/login", method="POST", data={"email": "jason.customer@homeserve.com", "password": "customer123"})
        assert status == 200, f"Login failed: {res}"
        token = res["access_token"]

        # 2. Verify token works
        status, _ = api_request("/auth/me", method="GET", token=token)
        assert status == 200, "Token should be valid before logout"

        # 3. Logout
        status, logout_res = api_request("/auth/logout", method="POST", token=token)
        assert status == 200, f"Logout failed: {logout_res}"

        # 4. Attempt to access protected endpoint with the revoked token
        status, after_res = api_request("/auth/me", method="GET", token=token)
        assert status == 401, f"Expected 401 for revoked token, got {status}: {after_res}"


class TestRoleBasedAccessControl:
    """Test suite for server-side role-based access control and privilege separation."""

    def test_customer_cannot_access_admin_stats(self, customer_token):
        """Verify customers receive HTTP 403 Forbidden when accessing Admin API."""
        status, res = api_request("/admin/stats", method="GET", token=customer_token)
        assert status == 403, f"Expected 403 Forbidden, got {status}: {res}"

    def test_provider_cannot_access_admin_stats(self, provider_token):
        """Verify providers receive HTTP 403 Forbidden when accessing Admin API."""
        status, res = api_request("/admin/stats", method="GET", token=provider_token)
        assert status == 403, f"Expected 403 Forbidden, got {status}: {res}"

    def test_technician_cannot_access_admin_stats(self, technician_token):
        """Verify technicians receive HTTP 403 Forbidden when accessing Admin API."""
        status, res = api_request("/admin/stats", method="GET", token=technician_token)
        assert status == 403, f"Expected 403 Forbidden, got {status}: {res}"

    def test_admin_can_access_admin_stats(self, admin_token):
        """Verify Admins can successfully access Admin API."""
        status, res = api_request("/admin/stats", method="GET", token=admin_token)
        assert status == 200, f"Admin should have access: {res}"
        assert "total_users" in res
        assert "total_revenue" in res

    def test_superadmin_can_access_admin_stats(self, superadmin_token):
        """Verify Super Admins have full access to Admin API."""
        status, res = api_request("/admin/stats", method="GET", token=superadmin_token)
        assert status == 200, f"SuperAdmin should have access: {res}"

    def test_unauthenticated_request_rejected(self):
        """Verify that requests missing Bearer tokens return HTTP 401 Unauthorized."""
        status, res = api_request("/admin/stats", method="GET", token=None)
        assert status == 401, f"Expected 401 for unauthenticated request, got {status}: {res}"

    def test_technician_cannot_create_booking(self, technician_token):
        """Verify that technicians cannot create customer bookings (HTTP 403)."""
        payload = {
            "provider_id": 2,
            "service_id": 1,
            "scheduled_date": "2026-12-15",
            "scheduled_time": "10:00:00",
            "duration_minutes": 60,
            "address": "123 Tech Lane",
            "total_price": 50.0
        }
        status, res = api_request("/bookings", method="POST", data=payload, token=technician_token)
        assert status == 403, f"Expected 403 for technician booking attempt, got {status}: {res}"
