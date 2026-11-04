import csv
import io
from fastapi import APIRouter, Query, HTTPException, Response, status
from pydantic import BaseModel
from typing import Optional
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.api.deps import DB, AdminUser
from app.models.user import User, UserRole
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus
from app.models.review import Review
from app.models.provider import ProviderProfile, Technician
from app.models.service import ServiceCategory, Service
from app.models.complaint import Complaint

router = APIRouter(prefix="/admin", tags=["Admin"])


class ProviderVerificationUpdate(BaseModel):
    is_verified: bool


@router.get("/stats")
def get_platform_stats(db: DB, admin: AdminUser) -> dict:
    """Get overall platform statistics."""
    total_users = db.query(func.count(User.id)).scalar() or 0
    total_customers = db.query(func.count(User.id)).filter(User.role == UserRole.CUSTOMER).scalar() or 0
    total_providers = db.query(func.count(User.id)).filter(User.role == UserRole.PROVIDER).scalar() or 0
    total_technicians = db.query(func.count(User.id)).filter(User.role == UserRole.TECHNICIAN).scalar() or 0
    total_bookings = db.query(func.count(Booking.id)).scalar() or 0
    total_revenue = db.query(func.coalesce(func.sum(Payment.amount), 0.0)).filter(
        Payment.status == PaymentStatus.COMPLETED
    ).scalar() or 0.0
    total_services = db.query(func.count(Service.id)).scalar() or 0
    total_categories = db.query(func.count(ServiceCategory.id)).scalar() or 0
    total_reviews = db.query(func.count(Review.id)).scalar() or 0
    avg_rating = db.query(func.avg(Review.rating)).scalar()
    verified_providers = db.query(func.count(ProviderProfile.id)).filter(
        ProviderProfile.is_verified == True
    ).scalar() or 0
    open_complaints = db.query(func.count(Complaint.id)).filter(
        Complaint.status.in_(["open", "under_investigation"])
    ).scalar() or 0

    platform_commission = round(float(total_revenue) * 0.10, 2)

    return {
        "total_users": total_users,
        "total_customers": total_customers,
        "total_providers": total_providers,
        "total_technicians": total_technicians,
        "verified_providers": verified_providers,
        "total_bookings": total_bookings,
        "total_revenue": round(float(total_revenue), 2),
        "platform_commission": platform_commission,
        "open_complaints": open_complaints,
        "total_services": total_services,
        "total_categories": total_categories,
        "total_reviews": total_reviews,
        "average_rating": round(float(avg_rating), 2) if avg_rating else 4.9,
    }


@router.get("/bookings/stats")
def get_booking_stats(db: DB, admin: AdminUser) -> dict:
    """Get booking statistics broken down by status."""
    statuses = {}
    for s in BookingStatus:
        count = db.query(func.count(Booking.id)).filter(Booking.status == s).scalar() or 0
        statuses[s.value] = count

    return {"booking_statuses": statuses}


@router.get("/revenue/monthly")
def get_monthly_revenue(db: DB, admin: AdminUser, year: int = Query(2026)) -> dict:
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
        monthly[row.month] = round(float(row.revenue), 2)

    return {"year": year, "monthly_revenue": monthly}


@router.get("/popular-services")
def get_popular_services(db: DB, admin: AdminUser, limit: int = Query(6, ge=1, le=20)) -> list[dict]:
    """Get most booked services across platform."""
    results = (
        db.query(
            Service.id,
            Service.name,
            Service.base_price,
            ServiceCategory.name.label("category_name"),
            func.count(Booking.id).label("booking_count"),
            func.coalesce(func.sum(Booking.total_price), 0.0).label("total_revenue"),
        )
        .join(ServiceCategory, Service.category_id == ServiceCategory.id)
        .outerjoin(Booking, Service.id == Booking.service_id)
        .group_by(Service.id, Service.name, Service.base_price, ServiceCategory.name)
        .order_by(desc("booking_count"), desc("total_revenue"))
        .limit(limit)
        .all()
    )
    return [
        {
            "id": r.id,
            "name": r.name,
            "category": r.category_name,
            "base_price": r.base_price,
            "bookings": r.booking_count,
            "revenue": round(float(r.total_revenue), 2),
        }
        for r in results
    ]


@router.get("/top-providers")
def get_top_providers(
    db: DB,
    admin: AdminUser,
    limit: int = Query(10, ge=1, le=50),
) -> list[dict]:
    """Get all registered providers with verification status."""
    profiles = (
        db.query(ProviderProfile)
        .order_by(ProviderProfile.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "provider_id": p.id,
            "user_id": p.user_id,
            "business_name": p.business_name,
            "name": p.user.full_name if p.user else None,
            "email": p.user.email if p.user else None,
            "phone": p.user.phone if p.user else None,
            "service_area": p.service_area,
            "hourly_rate": p.hourly_rate,
            "is_verified": p.is_verified,
            "average_rating": p.average_rating or 4.9,
            "total_reviews": p.total_reviews or 0,
            "total_bookings": p.total_bookings or 0,
        }
        for p in profiles
    ]


@router.patch("/providers/{provider_id}/verify")
def set_provider_verification(
    provider_id: int, payload: ProviderVerificationUpdate, db: DB, admin: AdminUser
) -> dict:
    """Approve or reject/revoke provider partner verification."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")

    profile.is_verified = payload.is_verified
    db.commit()
    db.refresh(profile)
    return {
        "message": f"Provider {'verified & approved' if profile.is_verified else 'unverified/suspended'}",
        "provider_id": profile.id,
        "is_verified": profile.is_verified,
    }


@router.get("/export/bookings")
def export_bookings_csv(db: DB, admin: AdminUser):
    """Download full platform bookings report as CSV."""
    bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Booking ID", "Reference", "Customer Name", "Customer Email", "Service",
        "Scheduled Date", "Scheduled Time", "Duration (mins)", "Total Price ($)",
        "Status", "Address", "City", "Notes", "Created At"
    ])
    for b in bookings:
        writer.writerow([
            b.id,
            b.booking_reference,
            b.customer.full_name if b.customer else "N/A",
            b.customer.email if b.customer else "N/A",
            b.service.name if b.service else "N/A",
            str(b.scheduled_date),
            str(b.scheduled_time),
            b.duration_minutes,
            f"{b.total_price:.2f}",
            b.status.value,
            b.address,
            b.city,
            b.notes or "",
            b.created_at.strftime("%Y-%m-%d %H:%M:%S") if b.created_at else "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=homeserve_bookings_report.csv"}
    )


@router.get("/export/revenue")
def export_revenue_csv(db: DB, admin: AdminUser):
    """Download financial revenue and transactions report as CSV."""
    payments = db.query(Payment).order_by(Payment.created_at.desc()).all()
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Transaction ID", "Booking ID", "Customer ID", "Payment Method",
        "Gross Amount ($)", "Platform Fee 10% ($)", "Provider Payout 90% ($)",
        "Status", "Is Demo", "Processed Date"
    ])
    for p in payments:
        writer.writerow([
            p.transaction_id or f"TXN-{p.id}",
            p.booking_id,
            p.user_id,
            p.payment_method.value if hasattr(p.payment_method, "value") else str(p.payment_method),
            f"{p.amount:.2f}",
            f"{p.platform_fee:.2f}",
            f"{p.provider_amount:.2f}",
            p.status.value if hasattr(p.status, "value") else str(p.status),
            "YES" if p.is_demo else "NO",
            p.created_at.strftime("%Y-%m-%d %H:%M:%S") if p.created_at else "",
        ])

    csv_data = output.getvalue()
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=homeserve_financial_revenue.csv"}
    )
