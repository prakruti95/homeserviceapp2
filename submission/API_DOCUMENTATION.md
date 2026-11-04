# HomeServe Technologies – Comprehensive REST API Documentation

**Base API URL:** `/api`  
**Interactive Swagger UI:** `http://localhost:8000/docs`  
**ReDoc Specification:** `http://localhost:8000/redoc`  
**Authentication Scheme:** `Bearer <JWT_ACCESS_TOKEN>`

---

## 1. Authentication & Identity (`/api/auth`)

| Method | Endpoint | Access | Request Body | Success Response | Status | Error Codes |
|:---|:---|:---:|:---|:---|:---:|:---:|
| `POST` | `/auth/register` | Public | `{"email", "password", "full_name", "role", ...}` | `{"access_token", "user": {...}}` | 201 | 409, 422 |
| `POST` | `/auth/login` | Public | `{"email", "password"}` | `{"access_token", "user": {...}}` | 200 | 401, 403 |
| `POST` | `/auth/logout` | Authenticated | None | `{"message": "Logged out successfully"}` | 200 | 401 |
| `POST` | `/auth/refresh` | Authenticated | None | `{"access_token", "user": {...}}` | 200 | 401 |
| `GET` | `/auth/me` | Authenticated | None | `{"id", "email", "full_name", "role", ...}` | 200 | 401 |
| `PUT` | `/auth/me` | Authenticated | `{"old_password", "new_password"}` | `{"id", "email", ...}` | 200 | 400, 401 |

---

## 2. Service Catalog (`/api/services`)

| Method | Endpoint | Access | Parameters / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/services/categories` | Public | None | List all 8 active categories with icons & images | 200 |
| `POST` | `/services/categories` | Admin | `{"name", "description", "icon", "image_url"}` | Create a new service category | 201 |
| `GET` | `/services` | Public | `?skip=0&limit=20&category_id=X` | List catalog services with category joins | 200 |
| `POST` | `/services` | Admin | `{"category_id", "name", "base_price", "duration_minutes"}` | Add new service to platform | 201 |
| `GET` | `/services/{id}` | Public | None | Get service details, policies, and pricing | 200 |
| `PUT` | `/services/{id}` | Admin | `{"name", "base_price", "is_active", ...}` | Update service details or pricing | 200 |
| `DELETE`| `/services/{id}` | Admin | None | Soft-delete / deactivate service | 200 |

---

## 3. Providers & Availability (`/api/providers`)

| Method | Endpoint | Access | Parameters / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/providers` | Public | `?skip=0&limit=20&verified_only=true` | List certified providers and ratings | 200 |
| `GET` | `/providers/{id}` | Public | None | Get contractor profile, bio, and hourly rate | 200 |
| `GET` | `/providers/{id}/availability` | Public | None | Get provider weekly operating hours | 200 |
| `PUT` | `/providers/me/availability` | Provider | `{"slots": [{"day_of_week", "start_time", "end_time"}]}` | Set 7-day working schedule | 200 |
| `GET` | `/providers/me/earnings` | Provider | None | Gross revenue, 10% platform fee, net earnings | 200 |

---

## 4. Bookings Engine (`/api/bookings`)

| Method | Endpoint | Access | Request / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/bookings` | Authenticated | `?skip=0&limit=20&status_filter=X` | List visible bookings (Role-filtered) | 200 |
| `GET` | `/bookings/{id}` | Authenticated | None | Get booking details (Ownership verified) | 200 |
| `POST` | `/bookings` | Customer | `{"provider_id", "service_id", "scheduled_date", "scheduled_time", "address", "coupon_code"}` | Create booking with overlap check | 201 |
| `PATCH` | `/bookings/{id}/status` | Authenticated | `{"status": "confirmed"}` | Validated status transition | 200 |
| `PATCH` | `/bookings/{id}/reschedule` | Customer/Admin | `{"scheduled_date", "scheduled_time"}` | Reschedule with concurrency check | 200 |
| `PATCH` | `/bookings/{id}/cancel` | Customer/Admin | `{"cancellation_reason": "..."}` | Cancel booking with reason | 200 |
| `POST` | `/bookings/{id}/assign` | Provider/Admin | `{"technician_id": 4, "notes": "..."}` | Dispatch field technician | 200 |
| `POST` | `/bookings/{id}/images` | Technician | `{"image_url", "caption", "image_type": "before"}` | Attach work inspection photo | 201 |
| `GET` | `/bookings/{id}/images` | Authenticated | None | Retrieve attached work log photos | 200 |

---

## 5. Payments & Invoicing (`/api/payments`, `/api/invoices`)

| Method | Endpoint | Access | Request / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `POST` | `/payments/process-demo` | Customer | `{"booking_id": 1, "payment_method": "credit_card"}` | Sandbox demo checkout, 10% fee & invoice | 200 |
| `GET` | `/payments` | Authenticated | `?skip=0&limit=20` | List payment transactions (Role-isolated) | 200 |
| `GET` | `/payments/{id}` | Authenticated | None | Get transaction reference details | 200 |
| `PATCH` | `/payments/{id}` | Admin Only | `{"status": "completed"}` | Admin status override (Client forbidden) | 200 |
| `GET` | `/invoices` | Authenticated | None | List customer tax receipts | 200 |
| `GET` | `/invoices/{id}` | Authenticated | None | Fetch single tax receipt | 200 |
| `GET` | `/invoices/booking/{id}` | Authenticated | None | Fetch invoice generated for booking | 200 |

---

## 6. Coupons & Discounts (`/api/coupons`)

| Method | Endpoint | Access | Request / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/coupons` | Public | None | List active public promotions (`WELCOME20`, `SAVE10`) | 200 |
| `POST` | `/coupons/validate` | Public | `{"code": "WELCOME20", "subtotal": 100.0}` | Validate discount & compute final amount | 200 |
| `POST` | `/coupons` | Admin | `{"code", "discount_type", "discount_value", "min_order_amount"}` | Create promotional coupon | 201 |

---

## 7. Technicians Dispatch (`/api/technicians`)

| Method | Endpoint | Access | Parameters / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/technicians` | Authenticated | None | List registered field staff | 200 |
| `GET` | `/technicians/me/assignments` | Technician | None | List jobs assigned to logged-in tech | 200 |
| `PATCH`| `/technicians/assignments/{id}/status` | Technician | `{"status": "in_progress", "notes": "..."}` | Update assigned job status | 200 |

---

## 8. Customer Reviews & Disputes (`/api/reviews`, `/api/complaints`)

| Method | Endpoint | Access | Request / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/reviews` | Public | `?provider_id=X` | List reviews & aggregate star average | 200 |
| `POST` | `/reviews` | Customer | `{"booking_id", "rating": 5, "comment": "..."}` | Submit star review for completed job | 201 |
| `POST` | `/complaints` | Customer | `{"booking_id", "subject", "description", "priority"}` | File ticket under 100% Satisfaction Guarantee | 201 |
| `GET` | `/complaints` | Authenticated | None | List customer or admin dispute tickets | 200 |
| `PATCH` | `/complaints/{id}/status` | Admin | `{"status": "resolved", "resolution": "..."}` | Admin dispute resolution remark | 200 |

---

## 9. Admin Operations & Analytics (`/api/admin`)

| Method | Endpoint | Access | Query / Body | Description | Status |
|:---|:---|:---:|:---|:---|:---:|
| `GET` | `/admin/stats` | Admin | None | Users, providers, techs, bookings, revenue, commission | 200 |
| `GET` | `/admin/popular-services` | Admin | None | Top booked services ranked by revenue | 200 |
| `PATCH` | `/admin/providers/{id}/verify`| Admin | `{"is_verified": true}` | Approve or revoke contractor credentials | 200 |
| `GET` | `/admin/export/bookings` | Admin | None | Download full platform bookings CSV | 200 |
| `GET` | `/admin/export/revenue` | Admin | None | Download financial revenue & fee breakdown CSV | 200 |

---

## 10. Notifications & Platform Health (`/api/notifications`, `/health`)

| Method | Endpoint | Access | Description | Status |
|:---|:---|:---:|:---|:---:|
| `GET` | `/notifications` | Authenticated | List user notifications with unread counter | 200 |
| `PATCH`| `/notifications/{id}/read`| Authenticated | Mark alert as read | 200 |
| `PATCH`| `/notifications/read-all` | Authenticated | Mark all user alerts as read | 200 |
| `GET` | `/health` | Public | Production health check probe verifying API & MySQL connection | 200 |
