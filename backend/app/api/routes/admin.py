from fastapi import APIRouter, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import DB, AdminUser
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.review import Review
from app.models.provider import ProviderProfile
from app.models.service import ServiceCategory, Service

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.get("/stats")
def get_platform_stats(db: DB, admin: AdminUser) -> dict:
    """Get overall platform statistics."""
    total_users = db.query(func.count(User.id)).scalar()
    total_customers = db.query(func.count(User.id)).filter(User.role == UserRole.CUSTOMER).scalar()
    total_providers = db.query(func.count(User.id)).filter(User.role == UserRole.PROVIDER).scalar()
    total_bookings = db.query(func.count(Booking.id)).scalar()
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.status == PaymentStatus.COMPLETED
    ).scalar()
    total_services = db.query(func.count(Service.id)).scalar()
    total_categories = db.query(func.count(ServiceCategory.id)).scalar()
    total_reviews = db.query(func.count(Review.id)).scalar()
    avg_rating = db.query(func.avg(Review.rating)).scalar()
    verified_providers = db.query(func.count(ProviderProfile.id)).filter(
        ProviderProfile.is_verified == True
    ).scalar()

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_providers": total_providers,
        "verified_providers": verified_providers,
        "total_bookings": total_bookings,
        "total_revenue": float(total_revenue),
        "total_services": total_services,
        "total_categories": total_categories,
        "total_reviews": total_reviews,
        "average_rating": round(float(avg_rating), 2) if avg_rating else None,
    }


@router.get("/bookings/stats")
def get_booking_stats(db: DB, admin: AdminUser) -> dict:
    """Get booking statistics broken down by status."""
    statuses = {}
    for s in BookingStatus:
        count = db.query(func.count(Booking.id)).filter(Booking.status == s).scalar()
        statuses[s.value] = count

    return {"booking_statuses": statuses}


@router.get("/revenue/monthly")
def get_monthly_revenue(db: DB, admin: AdminUser, year: int = Query(2024)) -> dict:
    """Get monthly revenue for a given year."""
    results = (
        db.query(
            func.month(Payment.created_at).label("month"),
            func.sum(Payment.amount).label("revenue"),
        )
        .filter(
            Payment.status == PaymentStatus.COMPLETED,
            func.year(Payment.created_at) == year,
        )
        .group_by(func.month(Payment.created_at))
        .order_by(func.month(Payment.created_at))
        .all()
    )

    monthly: dict[int, float] = {i: 0.0 for i in range(1, 13)}
    for row in results:
        monthly[row.month] = float(row.revenue)

    return {"year": year, "monthly_revenue": monthly}


@router.get("/top-providers")
def get_top_providers(
    db: DB,
    admin: AdminUser,
    limit: int = Query(10, ge=1, le=50),
) -> list[dict]:
    """Get top-rated providers."""
    profiles = (
        db.query(ProviderProfile)
        .filter(ProviderProfile.total_reviews > 0)
        .order_by(ProviderProfile.average_rating.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "provider_id": p.id,
            "user_id": p.user_id,
            "business_name": p.business_name,
            "name": p.user.full_name if p.user else None,
            "average_rating": p.average_rating,
            "total_reviews": p.total_reviews,
            "total_bookings": p.total_bookings,
        }
        for p in profiles
    ]
