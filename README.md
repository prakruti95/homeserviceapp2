# HomeServe Technologies
# Home Services Booking SaaS Platform

## Tech Stack
- **Frontend**: React.js + Vite + Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MySQL 8.4
- **ORM**: SQLAlchemy
- **Auth**: JWT (python-jose)

## Quick Start

### Prerequisites
- Python 3.12+
- Node.js 20+
- MySQL 8.x

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
# Set environment variables in .env
python -m uvicorn app.main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### Default Admin Account
- Email: admin@homeserve.com
- Password: admin123

## API Documentation
Once the backend is running, visit http://localhost:8000/docs for Swagger UI.

## Features
- 🔐 JWT Authentication with role-based access (Admin, Provider, Customer)
- 🏠 Service catalog with categories and search
- 📅 Booking system with status workflow
- 💳 Payment tracking and invoicing
- ⭐ Reviews and ratings
- 🔔 In-app notifications
- 📊 Admin analytics dashboard
- 🔍 Search and discovery
