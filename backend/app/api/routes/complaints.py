import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.complaint import Complaint
from app.models.booking import Booking
from app.models.user import UserRole
from app.schemas.payment import (
    ComplaintCreate,
    ComplaintStatusUpdate,
    ComplaintResponse,
)

router = APIRouter(prefix="/complaints", tags=["Complaints & Disputes"])


@router.get("", response_model=list[ComplaintResponse])
@router.get("/", response_model=list[ComplaintResponse], include_in_schema=False)
def list_complaints(
    db: DB,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[ComplaintResponse]:
    """List customer complaints (customers view own, admin views all)."""
    query = db.query(Complaint)
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        query = query.filter(Complaint.customer_id == current_user.id)
    complaints = query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()
    return [ComplaintResponse.model_validate(c) for c in complaints]


@router.post("", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def file_complaint(payload: ComplaintCreate, db: DB, current_user: CurrentUser) -> ComplaintResponse:
    """File a customer service dispute or complaint ticket."""
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Associated booking not found")

    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN) and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized for this booking")

    ticket = f"CMP-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
    complaint = Complaint(
        ticket_number=ticket,
        booking_id=booking.id,
        customer_id=current_user.id,
        subject=payload.subject,
        description=payload.description,
        priority=payload.priority or "medium",
        status="open",
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return ComplaintResponse.model_validate(complaint)


@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def resolve_complaint(
    complaint_id: int, payload: ComplaintStatusUpdate, db: DB, admin: AdminUser
) -> ComplaintResponse:
    """Update dispute status and resolution notes (Admin only)."""
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")

    complaint.status = payload.status
    if payload.resolution_notes:
        complaint.resolution_notes = payload.resolution_notes
    if payload.status in ("resolved", "closed"):
        complaint.resolved_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(complaint)
    return ComplaintResponse.model_validate(complaint)
