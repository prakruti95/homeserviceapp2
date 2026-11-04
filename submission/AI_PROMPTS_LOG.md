# HomeServe Technologies – AI Prompts & Engineering Trajectory Log

This document records the prompt progression, architectural objectives, and concrete engineering milestones executed during the 3-hour autonomous Vibe Coding competition.

---

## Prompt 0: Environment Inspection & Foundational Architecture
- **Objective**: Inspect the host runtime environment, verify tooling (Node.js, npm, Python, MySQL, Git), configure initial project folder structures, draft initial `REQUIREMENTS.md` and `IMPLEMENTATION_PLAN.md`, and bootstrap the mandatory stack (React + Vite + Tailwind CSS, FastAPI, SQLAlchemy, MySQL, JWT).
- **Key Deliverables**:
  - Environment confirmed: Node.js v26.13 LTS, Python 3.14, MySQL Server 8.4, Git 2.45.
  - Project directory scaffolding: `backend/` and `frontend/`.
  - Database schema initialized with MySQL running on `localhost:3306`.
  - Initial `PROGRESS.md` checklist created.

---

## Prompt 1: Frontend Architecture & Design System
- **Objective**: Build the user interface with premium navy (`#0A192F`), white, and electric blue (`#2563EB`) palette. Deliver responsive landing page, 8 categories, public pages, separate dashboards for 4 roles, booking management, invoices, notifications, reviews, and profile settings without using fake mock workflows.
- **Key Deliverables**:
  - Responsive landing page with Hero search, Category pills, Guarantees, Testimonials, and Footer.
  - 8 core categories: Electrical, Plumbing, AC Repair, Home Cleaning, Painting, Carpentry, Appliance Repair, Pest Control.
  - Role-specific dashboard layouts: Admin, Provider, Technician, Customer.
  - Reusable React components, React Router v7, Lucide Icons, and centralized Axios client.

---

## Prompt 2: Real Visual Assets & Functional Verification
- **Objective**: Enrich the frontend with realistic home service photography, ensure all 8 categories exist, add functional charts, search, filters, tables, forms, and empty states. Ensure every button performs a meaningful action.
- **Key Deliverables**:
  - High-resolution Unsplash photography across categories and services.
  - 6-Month interactive Revenue & Bookings Velocity chart on Admin dashboard.
  - Provider weekly payouts breakdown chart.
  - Functional search, category filter pills, and query param synchronization.
  - Clean `npm run build` verification.

---

## Prompt 3: Backend Architecture & All 20 Normalized Entities
- **Objective**: Complete the FastAPI backend architecture using SQLAlchemy, Pydantic v2, and MySQL. Verify and implement all 20 normalized entities, JWT authentication, server-side RBAC across 4 roles (`SUPER_ADMIN`/`ADMIN`, `PROVIDER`, `TECHNICIAN`, `CUSTOMER`), concurrency overlap prevention, coupon engine, 10% platform commission calculation, demo payments, invoices, and reviews.
- **Key Deliverables**:
  - All 20 normalized entities implemented with foreign keys, indexes, and constraints.
  - Concurrency overlap protection returning HTTP 409 Conflict.
  - Booking status state machine with valid status transitions.
  - Token blacklisting cache (`REVOKED_TOKENS`) on logout.
  - Client payment tamper prevention (clients forbidden from patching status).

---

## Prompt 4: Full-Stack Integration & Competition Demo Readiness
- **Objective**: Connect the React frontend to the FastAPI backend with zero mock data. Ensure safe, idempotent database seeding (8 categories, 33 services, 4 providers, 3 field technicians, 21 bookings, payments, invoices, reviews, complaints, notifications). Build 1-click evaluator quick-logins and dynamic dashboards with CSV exports.
- **Key Deliverables**:
  - Safe, idempotent database seeder `backend/app/db/seed_demo_data.py`.
  - 1-Click evaluator login buttons on `/login` screen.
  - Admin controls: provider partner verification toggle (`PATCH /api/admin/providers/{id}/verify`) and CSV data exports (`/admin/export/bookings`, `/admin/export/revenue`).
  - Provider incoming order queue (Accept/Decline) and net earnings calculations.
  - Technician mobile hub with turn-by-turn Google Maps link and photo log modal.
  - Customer active dispatches banner and printable invoice receipt modal.

---

## Prompt 5: Complete QA, API Security Audit & Playwright Browser Automation
- **Objective**: Perform a comprehensive quality assurance and security audit. Implement Pytest suites covering authentication, business logic, API security, and integration. Execute Playwright automated browser tests. Create `TEST_CASES.md`, `TEST_REPORT.md`, `SECURITY_CHECKLIST.md`, and `BUG_REPORT.md`.
- **Key Deliverables**:
  - 50 Pytest test cases passed with 100% success in 18.45s.
  - 3 Playwright headless Chromium automated browser tests passed in 8.35s.
  - 2 legacy integration suites passed with 100% success.
  - Total test count: 52 tests executed, 52 passed, 0 failed, 0 skipped.
  - Complete security audit matrix confirming OWASP compliance.

---

## Prompt 6: GitHub Preparation & Production Cloud Deployment
- **Objective**: Prepare the repository for secure GitHub hosting and production deployment to Vercel (Frontend), Render (FastAPI Backend), and Cloud MySQL. Update `.gitignore`, create `.env.example`, configure SPA rewrites in `vercel.json`, specify `render.yaml` blueprint, enhance `/health` probe with database connectivity check, and draft `DEPLOYMENT_GUIDE.md`.
- **Key Deliverables**:
  - `.gitignore` strictly excluding secrets, `.env`, `DEMO_CREDENTIALS.md`, and build artifacts.
  - Clean `.env.example` templates with placeholders only.
  - `vercel.json` with SPA routing rewrite rules.
  - `render.yaml` with dynamic `$PORT` start command and environment specs.
  - Production health check `GET /health` verifying MySQL connection via `SELECT 1`.
  - Comprehensive `DEPLOYMENT_GUIDE.md`.
