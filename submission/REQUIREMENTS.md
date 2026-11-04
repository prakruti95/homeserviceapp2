# HomeServe Technologies – Comprehensive Requirements Specification

## 1. Project Overview & Scope
HomeServe Technologies is an on-demand, multi-tenant Home Services Booking SaaS platform built to connect homeowners with vetted independent service providers and field technicians. Designed with an electric-blue, deep navy, and clean white interface, it handles real-time service discovery, transparent pricing, schedule concurrency verification, field dispatching, platform commission fee calculations, sandbox payment verification, and automated invoicing.

---

## 2. Four Application Roles & Access Matrix

| Role | Access Tier | Primary Capabilities & Governance |
|:---|:---:|:---|
| **SUPER_ADMIN** | Tier 0 | Global system analytics, partner verification (`is_verified` toggle), database administration, user activation/deactivation, CSV data exports, and complaint arbitrations. |
| **ADMIN** | Tier 1 | Catalog curation (categories and services CRUD), booking status overrides, review moderation, customer support resolution, and platform operations. |
| **PROVIDER** | Tier 2 | Business profile management, 7-day working hours calendar, incoming order review (Accept/Decline), field technician assignment, gross/net earnings reports, and payout history. |
| **TECHNICIAN** | Tier 3 | Field dispatch hub, real-time assigned jobs queue, Google Maps navigation, work progression state updates (`en_route` -> `on_site` -> `in_progress` -> `completed`), and work photo logging. |
| **CUSTOMER** | Tier 4 | Service discovery, provider profile reviews, dynamic coupon application (`WELCOME20`, `SAVE10`), booking creation, rescheduling/cancellation, demo checkout, and post-service star reviews. |

---

## 3. Ten Functional Modules

1. **Authentication & Authorization**:
   - JWT access tokens with HMAC-SHA256 signatures (`HS256`).
   - Bcrypt password hashing with automatic salt generation (`$2b$`).
   - Server-side token blacklisting on logout (`REVOKED_TOKENS`).
   - Role-based route guards and FastAPI dependencies (`require_role`).
2. **User Management**:
   - User entity normalization across Customers, Providers, and Technicians.
   - Saved multiple customer addresses with default flags.
   - Profile update and password change capabilities.
3. **Service Catalog Management**:
   - 8 core categories: Electrical, Plumbing, AC Repair, Home Cleaning, Painting, Carpentry, Appliance Repair, Pest Control.
   - 33 catalog services with high-resolution photography, base pricing, and duration metrics.
4. **Provider & Contractor Management**:
   - Business profiles with bio, license numbers, hourly rates, ratings, and service areas.
   - 7-day working hours availability schedule (`AvailabilitySlot`).
   - Verification status controls (`is_verified`).
5. **Booking Engine & Concurrency Control**:
   - Unique reference generation: `HS-BK-YYYYMMDD-XXXXXX`.
   - Concurrency protection: detects and prevents overlapping appointments for the same provider time window (HTTP 409 Conflict).
   - Validated status transitions: `pending` -> `confirmed` -> `provider_assigned` -> `in_progress` -> `completed`, plus `cancelled` and `rejected`.
   - Customer rescheduling with conflict re-validation.
   - Customer cancellation with mandatory reason.
6. **Technician Dispatch System**:
   - Provider assigns technician to confirmed bookings.
   - Field technician dispatch queue (`/technician/dashboard`).
   - Work photo upload logging (`image_type`: `before`, `after`, `work_log`).
7. **Payment & Invoicing Engine**:
   - Automatic 10% platform commission calculation; 90% net provider earnings.
   - Coupon discount engine (`percentage` and `flat_amount` with minimum order constraints).
   - Clear demo payment simulator (`is_demo=True`).
   - Anti-tampering protection: clients forbidden from directly patching payment status (HTTP 403).
   - Automated tax invoice generation (`INV-YYYYMM-XXXXXX`) with subtotal, discounts, and printable modal receipt.
8. **Reviews & Quality Assurance**:
   - 1-to-5 star rating and comment submission restricted to completed bookings.
   - Prevention of duplicate reviews for the same booking (HTTP 409).
   - Automatic provider aggregate rating recalculation.
9. **Disputes & Complaints Center**:
   - Ticket generation: `CMP-YYYYMM-XXXXXX` with priority ratings (`low`, `medium`, `high`, `urgent`).
   - Admin investigation status tracking and dispute resolution.
10. **Analytics, Search & Notifications**:
    - Real-time KPI summaries and 7-month revenue/bookings velocity chart.
    - Full-text and filtered service/provider search with parameterized SQL queries.
    - Live notifications center with unread badge counter in navbar.

---

## 4. Nine SDLC Phases

1. **Requirement Analysis**: Comprehensive modeling of multi-role service SaaS workflows and entity relationships.
2. **System Architecture**: Separation of concerns between React SPA, stateless FastAPI REST services, and normalized MySQL 8.4 database.
3. **Database Engineering**: 20 normalized entities, foreign keys, cascade rules, composite indexes, and connection pooling.
4. **Backend Implementation**: Modular routers, Pydantic v2 schemas, server-side RBAC, and transaction safety.
5. **Frontend Implementation**: Tailwind CSS v4 styling, reusable components, role-specific layouts, and centralized Axios interceptors.
6. **Integration & Idempotent Seeding**: 100% database-backed demo data with 0 mock frontend arrays and zero duplicates on re-runs.
7. **Quality Assurance & Security Audit**: 52 test cases covering unit, API, integration, and headless Chromium Playwright tests with 100% pass rate.
8. **GitHub & Production Readiness**: Zero exposed credentials, `.gitignore` verification, Vercel SPA rewrites, Render blueprint, and production health check.
9. **Documentation & Packaging**: Complete submission package with architecture diagrams, SQL dumps, and presentation scripts.

---

## 5. Official Deliverables Checklist

- [x] Full-Stack Application: React 19 + Vite 8 + FastAPI + MySQL 8.4.
- [x] 20 Normalized Database Entities with SQLAlchemy ORM.
- [x] JWT Authentication & Server-Side Role-Based Authorization.
- [x] 4 Role Dashboards: Admin, Provider, Technician, Customer.
- [x] Overlap Prevention & Booking State Machine.
- [x] 10% Platform Commission & Automated Invoicing.
- [x] Comprehensive Test Suite: 50 Pytest + 2 Integration + 3 Playwright tests (100% Pass).
- [x] Deployment Configurations: `vercel.json`, `render.yaml`, `requirements.txt`.
- [x] Production Health Probe: `GET /health` with safe DB connectivity check.
- [x] Complete Documentation Suite (Requirements, Flow, Schema, ER Diagram, API, Security, Presentation).
