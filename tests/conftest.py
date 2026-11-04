import os
import sys
import json
import urllib.request
import urllib.error
import pytest

# Ensure backend directory is in python sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

BASE_URL = "http://127.0.0.1:8000/api"
FRONTEND_URL = "http://127.0.0.1:5173"


def api_request(endpoint: str, method: str = "GET", data: dict = None, token: str = None) -> tuple[int, dict | list | str]:
    """Helper function to execute HTTP requests against the FastAPI backend."""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    body = json.dumps(data).encode("utf-8") if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as response:
            resp_bytes = response.read()
            resp_text = resp_bytes.decode("utf-8")
            try:
                return response.status, json.loads(resp_text) if resp_text else {}
            except Exception:
                return response.status, resp_text
    except urllib.error.HTTPError as e:
        err_bytes = e.read()
        err_text = err_bytes.decode("utf-8")
        try:
            return e.code, json.loads(err_text)
        except Exception:
            return e.code, {"detail": err_text}


@pytest.fixture
def superadmin_token():
    status, res = api_request("/auth/login", method="POST", data={"email": "superadmin@homeserve.com", "password": "superadmin123"})
    assert status == 200, f"SuperAdmin login failed: {res}"
    return res["access_token"]


@pytest.fixture
def admin_token():
    status, res = api_request("/auth/login", method="POST", data={"email": "admin@homeserve.com", "password": "admin123"})
    assert status == 200, f"Admin login failed: {res}"
    return res["access_token"]


@pytest.fixture
def provider_token():
    status, res = api_request("/auth/login", method="POST", data={"email": "provider@homeserve.com", "password": "provider123"})
    assert status == 200, f"Provider login failed: {res}"
    return res["access_token"]


@pytest.fixture
def customer_token():
    status, res = api_request("/auth/login", method="POST", data={"email": "customer@homeserve.com", "password": "customer123"})
    assert status == 200, f"Customer login failed: {res}"
    return res["access_token"]


@pytest.fixture
def technician_token():
    status, res = api_request("/auth/login", method="POST", data={"email": "technician@homeserve.com", "password": "tech123"})
    assert status == 200, f"Technician login failed: {res}"
    return res["access_token"]
