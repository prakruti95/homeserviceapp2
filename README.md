# HomeServe Technologies – Home Services Booking SaaS Platform

[![React](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208-blue.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-38BDF8.svg)](https://tailwindcss.com/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%200.110-009688.svg)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.12%20%7C%203.14-3776AB.svg)](https://python.org/)
[![Database](https://img.shields.io/badge/Database-MySQL%208.4%20%2B%20SQLAlchemy%202.0-4479A1.svg)](https://mysql.com/)
[![Test Coverage](https://img.shields.io/badge/Tests-52%2F52%20Passing%20(100%25)-brightgreen.svg)]()
[![Security](https://img.shields.io/badge/Security-OWASP%20Hardened%20%7C%20JWT%20%2B%20Bcrypt-darkgreen.svg)]()

HomeServe Technologies is a full-stack, enterprise-grade Home Services Booking SaaS platform. Designed with a luxury electric-blue and deep-navy aesthetic, it provides end-to-end service discovery, real-time availability scheduling, overlap prevention, field technician dispatching, automated 10% platform fee calculations, sandbox payment verification, and official tax invoicing.

---

## 1. Key Capabilities & Role Portals

### 👑 Super Admin & System Admin (`/admin/dashboard`)
- **Master Platform Analytics**: Real-time KPI summaries covering Total Users, Certified Contractors, Active Field Technicians, Total Bookings, and Settled Gross Revenue with 10% Platform Commission tracking.
- **Velocity Visualization**: 7-Month interactive dual-metric chart comparing Revenue Velocity ($) against Order Volume.
- **Provider Supervision**: 1-click contractor approval, background check verification, and suspension toggles (`PATCH /api/admin/providers/{id}/verify`).
- **Data Export Center**: Direct 1-click CSV downloads for platform bookings and financial revenue breakdowns.
- **Dispute Resolution**: Investigation management for customer complaints with priority ticketing.

### 💼 Certified Service Providers (`/provider/dashboard`)
- **Real-Time Request Queue**: Instant order dispatches with inline **Accept** and **Decline** actions.
- **Financial Earnings Dashboard**: Real-time calculation of gross revenue, 10% platform service fee, and net take-home earnings ($).
- **Working Hours & Availability**: 7-day schedule manager with slot toggling.
- **Contractor Business Identity**: Bio, license numbers, hourly rates, service radius, and verified reviews feed.

### 🔧 Field Technicians Hub (`/technician/dashboard`)
- **Active Dispatch Console**: Real-time work order queue sorted by priority.
- **Turn-by-Turn Navigation**: Direct Google Maps GPS navigation links to client addresses.
- **On-Site Field Workflow**: Sequential state triggers ("Mark Arrived on Site" -> "Start Work" -> "Sign Off").
- **Visual Work Verification**: Photo upload logging for pre-work diagnostics and post-completion proof of work.

### 🏡 Homeowner Customers (`/customer/dashboard`)
- **Curated Catalog Discovery**: 8 core categories with 33 catalog services and transparent upfront pricing.
- **Intelligent Booking Wizard**: Date pickers, time slot verification, and coupon engine (`WELCOME20`, `SAVE10`).
- **Concurrency Overlap Protection**: Strict server-side prevention of overlapping contractor bookings.
- **Printable Tax Invoices**: Auto-generated official PDF-ready tax receipts (`INV-YYYYMM-XXXXXX`).
- **Satisfaction Guarantee & Reviews**: Star rating feedback and dispute ticket registration.

---

## 2. Competition Evaluation Demo Accounts

Evaluators can click the **1-Click Quick Login** buttons on the `/login` screen or use the credentials below:

| Role | Email Address | Password | Key Testing Workflow |
|:---|:---|:---|:---|
| **Super Admin** | `superadmin@homeserve.com` | `superadmin123` | Master executive metrics, provider partner verification, CSV exports |
| **System Admin** | `admin@homeserve.com` | `admin123` | User directory management, service catalog CRUD, complaint disputes |
| **Service Provider** | `provider@homeserve.com` | `provider123` | Incoming orders queue, Accept/Decline, 10% fee & net payout breakdown |
| **Field Technician** | `technician@homeserve.com` | `tech123` | Assigned job dispatches, Google Maps GPS link, work log photo uploads |
| **Customer** | `customer@homeserve.com` | `customer123` | Browse 33 services, apply promo coupon (`WELCOME20`), pay & review |

---

## 3. Technology Stack

| Layer | Technologies | Key Libraries & Specifications |
|:---|:---|:---|
| **Frontend** | React 19, Vite 8.3, Tailwind CSS v4 | React Router v7, Lucide Icons, Axios, React Hot Toast |
| **Backend** | Python 3.12+, FastAPI, Uvicorn | Pydantic v2, Python-Jose (JWT), Passlib + Bcrypt |
| **Database** | MySQL Server 8.4 Community | SQLAlchemy 2.0 ORM, PyMySQL driver, Connection Pooling |
| **Testing** | Pytest 9.2, Playwright 1.64 (Chromium) | AnyIO, Pytest-Playwright, Headless Browser Runner |
| **Deployment** | Vercel (Frontend), Render (API) | Cloud MySQL (Aiven / AWS RDS / PlanetScale) |

---

## 3. Project Structure

```
homeserve/
├── .env.example                     # Production environment variable template
├── .gitignore                       # Strict production gitignore (secrets excluded)
├── DEPLOYMENT_GUIDE.md              # Complete cloud deployment manual (Vercel + Render)
├── README.md                        # Primary project documentation
├── render.yaml                      # Render Infrastructure-as-Code blueprint
├── requirements.txt                 # Root Python dependencies for cloud deployment
├── vercel.json                      # Vercel SPA routing rewrites & caching rules
├── TEST_CASES.md                    # 52 verified test case specifications
├── TEST_REPORT.md                   # Automated test run execution metrics (100% pass)
├── SECURITY_CHECKLIST.md            # Security audit matrix & vulnerability verification
├── BUG_REPORT.md                    # Defect tracking and resolution report
│
├── backend/                         # FastAPI Backend Application
│   ├── app/
│   │   ├── api/                     # REST API Routers
│   │   │   ├── routes/              # auth, bookings, payments, admin, search, etc.
│   │   │   └── deps.py              # JWT authentication & server-side RBAC dependencies
│   │   ├── core/                    # Security, bcrypt, and Pydantic application settings
│   │   ├── db/                      # SQLAlchemy session engine & schema initializers
│   │   ├── models/                  # 20 normalized SQLAlchemy database entities
│   │   ├── schemas/                 # Pydantic v2 request/response validation schemas
│   │   └── main.py                  # FastAPI app entry point, CORS, & health checks
│   └── requirements.txt             # Backend Python dependencies
│
├── frontend/                        # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/              # Navbar, Footer, NotificationBell, Modals, Guards
│   │   ├── context/                 # AuthContext (JWT session management)
│   │   ├── pages/                   # Public, Customer, Provider, Tech, Admin pages
│   │   └── services/                # Axios centralized API client with interceptors
│   ├── vercel.json                  # Frontend directory deployment rewrites
│   └── vite.config.js               # Vite build configuration with development proxy
│
└── tests/                           # Automated Test Suites (50 Pytest + Playwright)
    ├── conftest.py                  # Pytest fixtures and authentication helpers
    ├── test_auth_rbac.py            # 21 tests: Bcrypt, JWT, and multi-role RBAC
    ├── test_business_logic.py       # 13 tests: Commission, overlaps, coupons, status
    ├── test_api_security.py         # 12 tests: SQL injection, input validation, isolation
    ├── test_integration_workflow.py # Complete 12-step customer-to-provider lifecycle
    └── test_frontend_playwright.py  # 3 tests: Browser E2E, logins, responsive layouts
```

---

## 4. Local Installation & Development Setup

### Prerequisites
- **Python 3.12+** (tested through Python 3.14)
- **Node.js v20+** or **v26 LTS** with npm
- **MySQL Server 8.0+** running locally on port `3306`
- **Git 2.40+**

### Step 1: Database Setup
1. Start your local MySQL server.
2. Create the platform database:
   ```sql
   CREATE DATABASE IF NOT EXISTS homeserve CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

### Step 2: Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create virtual environment (optional but recommended)
python -m venv .venv
# Windows: .venv\Scripts\activate | Unix: source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI API will be accessible at `http://127.0.0.1:8000` with Swagger UI at `http://127.0.0.1:8000/docs`.

### Step 3: Frontend Setup
```bash
# Navigate to frontend directory in a separate terminal
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
The application will launch at `http://127.0.0.1:5173`.

---

## 5. Automated Testing & Verification

Execute the complete quality assurance test suite:

```bash
# Run all 50 Pytest + Playwright tests
python -m pytest tests/ -v

# Run preexisting full backend architecture test
python backend/tests/test_backend_full.py

# Run preexisting full workflow test
python backend/tests/test_full_workflow.py

# Verify frontend production build
cd frontend
npm run build
```

---

## 6. Pushing to GitHub

Follow these steps to push the project to your GitHub account:

```bash
# 1. Verify working directory is clean and secrets are excluded
git status

# 2. Add remote origin (replace with your repository URL)
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/homeserve-technologies.git

# 3. Ensure branch name is main and push
git branch -M main
git push -u origin main
```

---

## 7. Cloud Production Deployment Summary

- **Frontend on Vercel**: Import the GitHub repository, set Root Directory to `frontend`, set `VITE_API_BASE_URL` to your Render API URL, and deploy. The included `vercel.json` automatically handles single-page routing rewrites.
- **Backend on Render**: Connect your GitHub repository using `render.yaml` or create a Web Service with Root Directory `backend`. Set `uvicorn app.main:app --host 0.0.0.0 --port $PORT` as the start command and configure your Cloud MySQL `DATABASE_URL`.
- **Complete Step-by-Step Instructions**: Refer to the detailed [DEPLOYMENT_GUIDE.md](file:///C:/Users/tops/.gemini/antigravity/scratch/homeserve/DEPLOYMENT_GUIDE.md).

---

## 8. License & Security Compliance

This application is built in compliance with OWASP Top 10 guidelines, featuring strict server-side RBAC, parameter-bound ORM queries, constant-time bcrypt verification, and isolated tenant boundaries.
