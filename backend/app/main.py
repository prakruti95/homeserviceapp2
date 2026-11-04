import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.db.init_db import init_db
from app.api.routes import (
    auth,
    users,
    services,
    providers,
    bookings,
    payments,
    invoices,
    coupons,
    complaints,
    technicians,
    customers,
    reviews,
    notifications,
    admin,
    search,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing database...")
    try:
        init_db()
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.error(f"Error during database initialization: {e}")
    yield
    logger.info("Shutting down HomeServe API.")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Home Services Booking SaaS Platform API",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for development & testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all route modules under /api
api_prefix = "/api"
app.include_router(auth.router, prefix=api_prefix)
app.include_router(users.router, prefix=api_prefix)
app.include_router(services.router, prefix=api_prefix)
app.include_router(providers.router, prefix=api_prefix)
app.include_router(bookings.router, prefix=api_prefix)
app.include_router(payments.router, prefix=api_prefix)
app.include_router(invoices.router, prefix=api_prefix)
app.include_router(coupons.router, prefix=api_prefix)
app.include_router(complaints.router, prefix=api_prefix)
app.include_router(technicians.router, prefix=api_prefix)
app.include_router(customers.router, prefix=api_prefix)
app.include_router(reviews.router, prefix=api_prefix)
app.include_router(notifications.router, prefix=api_prefix)
app.include_router(admin.router, prefix=api_prefix)
app.include_router(search.router, prefix=api_prefix)


@app.get("/health", tags=["Health"])
@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }


@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.APP_NAME} API",
        "docs": "/docs",
        "version": settings.APP_VERSION,
    }
