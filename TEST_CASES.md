# HomeServe Technologies – Comprehensive Test Cases Specification

**Document Version:** 1.0.0  
**Application:** HomeServe Technologies (React + Vite + FastAPI + MySQL 8.4)  
**Test Suite Engine:** Pytest 9.2.0 & Playwright 1.64.1  
**Status Legend:** `PASS` (Verified Execution) | `FAIL` (Defect Found) | `SKIP` (Not Applicable)

---

## 1. Authentication & Role-Based Access Control (RBAC)

| Test Case ID | Test Category | Description & Preconditions | Execution Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| `TC-AUTH-01` | Password Security | Verify plain password hashing using bcrypt directly with salted hash | Hash password; check hash string format; verify correct & incorrect passwords | Salted bcrypt hash (`$2b$`); verify returns `True` for match, `False` for incorrect | Correct format generated; match returns `True`, mismatch returns `False` | **PASS** |
| `TC-AUTH-02` | User Registration | Valid customer registration with unique email and full address | `POST /api/auth/register` with valid customer payload | HTTP 201 Created; returns JWT `access_token` and user record without password | HTTP 201 Created; JWT token issued; password excluded | **PASS** |
| `TC-AUTH-03` | User Registration | Duplicate email registration rejection | `POST /api/auth/register` with already registered email address | HTTP 409 Conflict; message indicating email already exists | HTTP 409 Conflict; detail: "A user with this email already exists" | **PASS** |
| `TC-AUTH-04` | Input Validation | Registration with invalid email format | `POST /api/auth/register` with `email="not-an-email"` | HTTP 422 Unprocessable Entity | HTTP 422 Unprocessable Entity with Pydantic validation error | **PASS** |
| `TC-AUTH-05` | Input Validation | Registration with short password (< 6 chars) | `POST /api/auth/register` with `password="123"` | HTTP 422 Unprocessable Entity | HTTP 422 Unprocessable Entity (`min_length=6` violation) | **PASS** |
| `TC-AUTH-06` | Authentication | Super Admin login verification | `POST /api/auth/login` (`superadmin@homeserve.com`) | HTTP 200 OK; access token issued; role = `super_admin` | HTTP 200 OK; role verified | **PASS** |
| `TC-AUTH-07` | Authentication | System Admin login verification | `POST /api/auth/login` (`admin@homeserve.com`) | HTTP 200 OK; access token issued; role = `admin` | HTTP 200 OK; role verified | **PASS** |
| `TC-AUTH-08` | Authentication | Service Provider login verification | `POST /api/auth/login` (`provider@homeserve.com`) | HTTP 200 OK; access token issued; role = `provider` | HTTP 200 OK; role verified | **PASS** |
| `TC-AUTH-09` | Authentication | Field Technician login verification | `POST /api/auth/login` (`technician@homeserve.com`) | HTTP 200 OK; access token issued; role = `technician` | HTTP 200 OK; role verified | **PASS** |
| `TC-AUTH-10` | Authentication | Customer login verification | `POST /api/auth/login` (`customer@homeserve.com`) | HTTP 200 OK; access token issued; role = `customer` | HTTP 200 OK; role verified | **PASS** |
| `TC-AUTH-11` | Authentication | Login with incorrect password | `POST /api/auth/login` with invalid password | HTTP 401 Unauthorized; generic error message | HTTP 401 Unauthorized; detail: "Invalid email or password" | **PASS** |
| `TC-AUTH-12` | Authentication | Login with non-existent user email | `POST /api/auth/login` with unregistered email | HTTP 401 Unauthorized; generic error message | HTTP 401 Unauthorized; detail: "Invalid email or password" | **PASS** |
| `TC-AUTH-13` | JWT Security | Tampered/malformed JWT token | `GET /api/auth/me` with corrupted token string | HTTP 401 Unauthorized | HTTP 401 Unauthorized; credentials rejection | **PASS** |
| `TC-AUTH-14` | Session Revocation | Token blacklist revocation on user logout | `POST /api/auth/logout`, then access `/api/auth/me` with revoked token | HTTP 200 on logout; HTTP 401 on subsequent request | Logged out token rejected with "Session has been logged out/revoked" | **PASS** |
| `TC-RBAC-01` | Role Authorization | Customer accessing admin metrics endpoint | Customer token calling `GET /api/admin/stats` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Insufficient permissions" | **PASS** |
| `TC-RBAC-02` | Role Authorization | Provider accessing admin metrics endpoint | Provider token calling `GET /api/admin/stats` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Insufficient permissions" | **PASS** |
| `TC-RBAC-03` | Role Authorization | Technician accessing admin metrics endpoint | Technician token calling `GET /api/admin/stats` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Insufficient permissions" | **PASS** |
| `TC-RBAC-04` | Role Authorization | Admin accessing admin metrics endpoint | Admin token calling `GET /api/admin/stats` | HTTP 200 OK with analytics data | HTTP 200 OK with full platform stats | **PASS** |
| `TC-RBAC-05` | Role Authorization | Super Admin accessing admin metrics endpoint | SuperAdmin token calling `GET /api/admin/stats` | HTTP 200 OK with analytics data | HTTP 200 OK with full platform stats | **PASS** |
| `TC-RBAC-06` | Security Boundary | Unauthenticated request to protected API | Calling `GET /api/admin/stats` with no token | HTTP 401 Unauthorized | HTTP 401 Unauthorized | **PASS** |
| `TC-RBAC-07` | Role Enforcement | Technician attempting customer booking creation | Technician token calling `POST /api/bookings` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Only customers can create bookings" | **PASS** |

---

## 2. Business Logic, Pricing & Invoicing

| Test Case ID | Test Category | Description & Preconditions | Execution Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| `TC-BUS-01` | Promotion Engine | Percentage coupon validation (`WELCOME20`) | `POST /api/coupons/validate` with code `WELCOME20`, subtotal `$100.00` | 20% discount applied: -$20.00; final = $80.00 | `is_valid: true`, discount = $20.00, final = $80.00 | **PASS** |
| `TC-BUS-02` | Promotion Engine | Flat coupon validation (`SAVE10`) | `POST /api/coupons/validate` with code `SAVE10`, subtotal `$100.00` | $10 flat discount applied: -$10.00; final = $90.00 | `is_valid: true`, discount = $10.00, final = $90.00 | **PASS** |
| `TC-BUS-03` | Promotion Engine | Minimum order constraint on coupon | `POST /api/coupons/validate` with subtotal ($20.00) < min order ($40.00) | `is_valid: false`, informative requirement message | `is_valid: false`, message specifies $40.00 minimum | **PASS** |
| `TC-BUS-04` | Promotion Engine | Non-existent coupon validation | `POST /api/coupons/validate` with code `FAKECODE999` | `is_valid: false`, invalid code message | `is_valid: false`, message: "Invalid or expired coupon code" | **PASS** |
| `TC-BUS-05` | Financial Engine | Platform commission (10%) and provider payout (90%) | Book service ($79.00) and process demo payment | Platform commission = $7.90 (10%); Provider net = $71.10 (90%) | Gross = $79.00, platform fee = $7.90, provider amount = $71.10 | **PASS** |
| `TC-BUS-06` | Booking Validation | Booking with past scheduled date | `POST /api/bookings` with `scheduled_date` in past | HTTP 400 Bad Request | HTTP 400 Bad Request: "Appointment date cannot be in the past" | **PASS** |
| `TC-BUS-07` | Concurrency Control | Double-booking / overlapping appointment prevention | Create booking 14:00-15:00; attempt second booking at 14:30 | HTTP 409 Conflict on second booking | HTTP 409 Conflict: "Provider already has a scheduled appointment overlapping..." | **PASS** |
| `TC-BUS-08` | Scheduling Engine | Customer booking rescheduling | `PATCH /api/bookings/{id}/reschedule` to valid future date/time | HTTP 200 OK; scheduled date/time updated | HTTP 200 OK; new date/time persisted in database | **PASS** |
| `TC-BUS-09` | Booking Lifecycle | Customer booking cancellation | `PATCH /api/bookings/{id}/cancel` with cancellation reason | HTTP 200 OK; status = `cancelled`; second cancel returns HTTP 400 | Cancelled status set; redundant cancel returns HTTP 400 | **PASS** |
| `TC-BUS-10` | State Machine | Invalid status transition rejection | Attempt `pending` -> `completed` transition directly | HTTP 400 Bad Request | HTTP 400 Bad Request: "Cannot transition from 'pending' to 'completed'" | **PASS** |
| `TC-BUS-11` | Financial Security | Client attempting direct payment status mutation | Customer token calling `PATCH /api/payments/{id}` | HTTP 403 Forbidden | HTTP 403 Forbidden: AdminUser dependency strictly required | **PASS** |
| `TC-BUS-12` | Invoicing Engine | Automated invoice generation upon payment | Pay booking via demo processor; fetch `/api/invoices/booking/{id}` | HTTP 200 OK; invoice with `INV-` prefix, status `paid`, matched totals | Auto-generated invoice retrieved; status = `paid`, total = booking amount | **PASS** |
| `TC-BUS-13` | Review System | Review submission restricted to completed bookings | Attempt review on booking in `pending` status | HTTP 400 Bad Request | HTTP 400 Bad Request: "Can only review completed bookings" | **PASS** |

---

## 3. API Security, Input Sanitization & Tenant Isolation

| Test Case ID | Test Category | Description & Preconditions | Execution Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| `TC-SEC-01` | Input Validation | Missing mandatory fields in booking payload | `POST /api/bookings` with empty body / missing service | HTTP 422 Unprocessable Entity | HTTP 422 Unprocessable Entity | **PASS** |
| `TC-SEC-02` | Type Safety | Invalid field types in booking payload | `POST /api/bookings` with strings for integer IDs | HTTP 422 Unprocessable Entity | HTTP 422 Unprocessable Entity | **PASS** |
| `TC-SEC-03` | SQL Injection | SQL injection via OR condition in search | `GET /api/search/services?q=' OR '1'='1` | HTTP 200 OK; sanitized parameterized query | HTTP 200 OK; no syntax error; returns list | **PASS** |
| `TC-SEC-04` | SQL Injection | SQL injection via statement stacked query | `GET /api/search/services?q='; DROP TABLE users; --` | HTTP 200 OK; escaped; tables preserved | HTTP 200 OK; zero corruption; database intact | **PASS** |
| `TC-SEC-05` | SQL Injection | SQL injection via UNION SELECT in search | `GET /api/search/services?q=1' UNION SELECT 1,2,3--` | HTTP 200 OK; escaped | HTTP 200 OK; parameter binding enforced | **PASS** |
| `TC-SEC-06` | XSS Sanitization | Cross-Site Scripting probe in search query | `GET /api/search/services?q=<script>alert('XSS')</script>` | HTTP 200 OK; harmless literal search | HTTP 200 OK; returned empty list safely | **PASS** |
| `TC-SEC-07` | Path Traversal | Directory traversal probe in search query | `GET /api/search/services?q=../../etc/passwd` | HTTP 200 OK; harmless literal search | HTTP 200 OK; returned empty list safely | **PASS** |
| `TC-SEC-08` | Tenant Isolation | Customer A viewing Customer B's booking | Customer A token calling `GET /api/bookings/{cust_b_id}` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Not your booking" | **PASS** |
| `TC-SEC-09` | Tenant Isolation | Customer A cancelling Customer B's booking | Customer A token calling `PATCH /api/bookings/{cust_b_id}/cancel` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Not authorized to cancel this booking" | **PASS** |
| `TC-SEC-10` | Tenant Isolation | Provider A viewing/altering Provider B's booking | Provider 1 token calling `GET/PATCH /api/bookings/{prov_2_booking}` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Not your booking" | **PASS** |
| `TC-SEC-11` | Dispatch Isolation | Technician A modifying Technician B's assignment | Tech 1 token calling `PATCH /api/technicians/assignments/{tech_2_id}/status` | HTTP 403 Forbidden | HTTP 403 Forbidden: "Not your assigned work order" | **PASS** |
| `TC-SEC-12` | Data Leakage | Verify passwords/hashes never exposed in responses | Inspect `GET /api/auth/me` and `GET /api/users` | No `password` or `hashed_password` keys | Verified: zero credential leakage in JSON payloads | **PASS** |

---

## 4. End-to-End Business Integration

| Test Case ID | Test Category | Description | Phases Verified | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| `TC-E2E-01` | Full Business Cycle | Complete 12-step customer-to-provider journey | 1. Customer Registration<br>2. Service Discovery<br>3. Provider Selection<br>4. Availability Check<br>5. Booking + Coupon<br>6. Provider Accept<br>7. Technician Assign<br>8. Photo Logging<br>9. Job Execution<br>10. Demo Payment<br>11. Tax Invoice<br>12. 5-Star Review | All 12 phases execute sequentially with correct DB state transitions | All 12 steps executed and passed in 1.09s | **PASS** |

---

## 5. Playwright Browser Automation

| Test Case ID | Test Category | Viewport & Browser | Execution Steps | Expected Result | Actual Result | Status |
|:---|:---|:---|:---|:---|:---|:---:|
| `TC-UI-01` | UI Rendering | Desktop Chromium (1280x720) | Navigate to `http://127.0.0.1:5173`; verify hero search, categories, and testimonials | Header, search input, 8 categories, and testimonials render | Page loaded, search input located, categories rendered | **PASS** |
| `TC-UI-02` | UI Authentication | Desktop Chromium (1280x720) | Click quick-login buttons on `/login` for Customer, Admin, Provider, Technician | Each role navigates to its dashboard and loads role-specific data | All 4 role dashboards loaded with real live metrics | **PASS** |
| `TC-UI-03` | Responsive UI | Mobile Chromium (375x812 - iPhone 13) | Emulate mobile screen; check layout and mobile hamburger menu | Navbar renders mobile menu toggle; no horizontal layout overflow | Responsive layout adapted cleanly; mobile controls functional | **PASS** |
