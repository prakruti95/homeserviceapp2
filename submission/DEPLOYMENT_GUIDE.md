# HomeServe Technologies – Production Deployment Guide

This guide provides end-to-end instructions for deploying the **HomeServe Technologies SaaS Platform** to cloud infrastructure using **Vercel** (Frontend), **Render** (FastAPI Backend), and a **Cloud MySQL Provider** (Aiven, AWS RDS, PlanetScale, or Railway).

---

## 1. Production Architecture Overview

```
                                      +------------------------------------+
                                      |         End Users / Clients        |
                                      +-----------------+------------------+
                                                        |
                                                        v HTTPS
                                      +-----------------+------------------+
                                      |          Vercel Edge CDN           |
                                      |     (React 19 + Vite Frontend)     |
                                      |   https://homeserve.vercel.app     |
                                      +-----------------+------------------+
                                                        |
                                                        | API Calls (HTTPS / CORS)
                                                        v
                                      +-----------------+------------------+
                                      |         Render Web Service         |
                                      |       (FastAPI + Uvicorn)          |
                                      |  https://homeserve-api.onrender.com|
                                      +-----------------+------------------+
                                                        |
                                                        | MySQL Protocol (TLS/SSL)
                                                        v
                                      +-----------------+------------------+
                                      |        Cloud MySQL Database        |
                                      |   (Aiven / AWS RDS / PlanetScale)  |
                                      +------------------------------------+
```

---

## 2. Prerequisites

1. **GitHub Account**: To host the application repository.
2. **Vercel Account**: For automated static frontend hosting and CDN edge caching ([vercel.com](https://vercel.com)).
3. **Render Account**: For Docker/Python cloud web service hosting ([render.com](https://render.com)).
4. **Cloud MySQL Database**: Managed MySQL 8.0+ instance (e.g., [Aiven for MySQL](https://aiven.io), [AWS RDS](https://aws.amazon.com/rds/), or [Railway MySQL](https://railway.app)).
5. **Git**: Installed locally to push the repository to GitHub.

---

## 3. Step 1: GitHub Repository Setup

1. **Verify Local Git Status**:
   Ensure all changes are clean and sensitive files are excluded:
   ```bash
   git status
   git ls-files DEMO_CREDENTIALS.md .env
   # Both commands must return empty, confirming secrets are excluded.
   ```

2. **Create a New GitHub Repository**:
   - Navigate to [github.com/new](https://github.com/new).
   - Enter Repository Name: `homeserve-technologies`.
   - Visibility: **Public** or **Private**.
   - Do **NOT** initialize with README or .gitignore (these already exist locally).

3. **Push Existing Repository to GitHub**:
   ```bash
   # Add remote origin
   git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/homeserve-technologies.git

   # Set master/main branch and push
   git branch -M main
   git push -u origin main
   ```

---

## 4. Step 2: Cloud MySQL Database Provisioning

1. **Provision MySQL Instance**:
   - Create a free or starter MySQL 8.0+ service on Aiven, AWS RDS, or Railway.
   - Create a database schema named `homeserve`.
2. **Obtain Connection URI**:
   - Copy the connection string provided by the cloud dashboard.
   - Format it for SQLAlchemy with the PyMySQL driver:
     ```text
     mysql+pymysql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/homeserve
     ```
   - If SSL certificate verification is required by your cloud provider:
     ```text
     mysql+pymysql://<DB_USER>:<DB_PASSWORD>@<DB_HOST>:<DB_PORT>/homeserve?ssl={"ssl_mode":"REQUIRED"}
     ```
3. **Automated Schema Initialization**:
   - On initial backend startup, SQLAlchemy's `Base.metadata.create_all()` will automatically create all 20 normalized tables and constraints.
   - **Production Safety**: Set `SEED_DEMO_DATA=false` in production environment settings to ensure local demo records are not injected into a live customer database.

---

## 5. Step 3: Backend Deployment on Render

### Option A: Automated Blueprint Deployment via `render.yaml`
1. In the Render Dashboard, click **New +** -> **Blueprint**.
2. Select your connected `homeserve-technologies` repository.
3. Render reads [render.yaml](file:///C:/Users/tops/.gemini/antigravity/scratch/homeserve/render.yaml) automatically and configures the `homeserve-api` Web Service.
4. Input your `DATABASE_URL` in the environment prompts and click **Apply**.

### Option B: Manual Web Service Setup
1. In the Render Dashboard, click **New +** -> **Web Service**.
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Name**: `homeserve-api`
   - **Region**: Oregon (or closest to your MySQL database)
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. Add the following **Environment Variables**:

| Variable Name | Recommended Production Value | Description |
|:---|:---|:---|
| `APP_ENV` | `production` | Enables production validation mode |
| `DEBUG` | `false` | Disables debug stack traces |
| `PORT` | `8000` | Port assigned by Render router |
| `SEED_DEMO_DATA` | `false` | Prevents seeding demo records in production |
| `DATABASE_URL` | *Your Cloud MySQL URI* | Connection string to cloud MySQL |
| `SECRET_KEY` | *Generate 64-char key* | Use: `openssl rand -hex 32` |
| `ALGORITHM` | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token lifetime (1 hour) |
| `CORS_ORIGINS` | `https://your-homeserve.vercel.app` | Your Vercel frontend URL |
| `ADMIN_EMAIL` | `admin@yourdomain.com` | Primary administrative account |
| `ADMIN_PASSWORD` | *Strong password* | Initial administrator password |
| `ADMIN_FULL_NAME` | `System Administrator` | Admin profile name |

5. Configure **Health Check Path**:
   - Set Health Check Path to: `/health`
6. Click **Deploy Web Service**.
7. Note down your assigned Render URL (e.g. `https://homeserve-api.onrender.com`).

---

## 6. Step 4: Frontend Deployment on Vercel

1. **Import Project to Vercel**:
   - Navigate to the [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** -> **Project**.
   - Select your GitHub repository (`homeserve-technologies`).
2. **Configure Project Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend` (Click *Edit* and select the `frontend` folder).
   - **Build Command**: `npm run build` (Default)
   - **Output Directory**: `dist` (Default)
3. **Configure Environment Variables**:
   Add the following environment variable in the Vercel dashboard:

| Variable Name | Production Value | Description |
|:---|:---|:---|
| `VITE_API_BASE_URL` | `https://homeserve-api.onrender.com/api` | Your deployed Render backend API URL |

4. **Deploy**:
   - Click **Deploy**. Vercel will install dependencies, compile the production bundles via Vite, and publish to the global CDN edge network.
5. **Single-Page Application Routing**:
   - The included [vercel.json](file:///C:/Users/tops/.gemini/antigravity/scratch/homeserve/frontend/vercel.json) rewrites all incoming routes to `/index.html`, ensuring deep links (e.g., `/customer/dashboard`, `/services/1`) work cleanly on page reload without 404 errors.

---

## 7. Step 5: Production CORS Synchronization

Once Vercel assigns your production domain (e.g., `https://homeserve-technologies.vercel.app`):
1. Return to the **Render Dashboard** -> `homeserve-api` -> **Environment**.
2. Update the `CORS_ORIGINS` variable:
   ```text
   https://homeserve-technologies.vercel.app,https://your-custom-domain.com
   ```
3. Save changes. Render will automatically redeploy the service with the updated CORS whitelist.

---

## 8. Step 6: Post-Deployment Smoke Testing & Verification

Execute the following verification checklist against the live URLs:

1. **API Health Probe**:
   ```bash
   curl -i https://homeserve-api.onrender.com/health
   # Expected: HTTP 200 OK
   # Body: {"status":"healthy","app":"HomeServe Technologies","version":"1.0.0","environment":"production","database":"connected"}
   ```
2. **OpenAPI Interactive Documentation**:
   - Navigate to `https://homeserve-api.onrender.com/docs` in your browser to verify OpenAPI schema accessibility.
3. **Public Landing Page**:
   - Visit `https://homeserve-technologies.vercel.app`. Verify hero search, 8 category cards, and testimonials render without console errors.
4. **User Registration & Login**:
   - Register a new customer account on `/register`.
   - Verify JWT issuance and redirection to `/customer/dashboard`.
5. **Booking Creation & Invoicing**:
   - Browse catalog, select a service, apply promo coupon `WELCOME20`, and complete demo payment.
   - Verify that an itemized invoice (`INV-YYYYMM-XXXXXX`) is generated and viewable.
6. **Role Dashboards**:
   - Log in with administrative credentials and verify platform statistics, popular services table, and CSV download capabilities.

---

## 9. Troubleshooting & FAQ

- **Database Connection Refused / Timeout**:
  - Verify that your Cloud MySQL provider allows connections from all IP addresses (`0.0.0.0/0`), as Render uses dynamic outbound IP pools.
- **CORS Error in Browser Console**:
  - Ensure the exact protocol (`https://`) and domain name from Vercel are present in Render's `CORS_ORIGINS` variable without trailing slashes.
- **Client Route 404 on Refresh**:
  - Verify that `vercel.json` exists in the deployed directory and contains the `rewrites` rule pointing `/(.*)` to `/index.html`.
- **Cold Start Delay**:
  - Render free tier instances spin down after 15 minutes of inactivity. Initial requests may take 30–50 seconds to wake up the service. Upgrading to a starter plan provides instant responsiveness.
