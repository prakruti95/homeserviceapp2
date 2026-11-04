from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from typing import Optional

from app.api.deps import DB, CurrentUser, TechnicianUser, AdminUser
from app.models.provider import Technician
from app.models.booking import Booking, BookingStatus, BookingAssignment
from app.models.user import User, UserRole

router = APIRouter(prefix="/technicians", tags=["Technicians"])


class TechnicianResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    phone: Optional[str] = None
    badge_number: Optional[str] = None
    skills: Optional[str] = None
    vehicle_type: Optional[str] = None
    is_available: bool
    rating: float

    model_config = {"from_attributes": True}


class AssignmentStatusUpdate(BaseModel):
    status: str  # assigned, en_route, on_site, completed
    notes: Optional[str] = None


@router.get("", response_model=list[TechnicianResponse])
def list_technicians(db: DB, current_user: CurrentUser) -> list[TechnicianResponse]:
    """List all registered field technicians."""
    techs = db.query(Technician).join(User, Technician.user_id == User.id).all()
    results = []
    for t in techs:
        results.append(TechnicianResponse(
            id=t.id,
            user_id=t.user_id,
            full_name=t.user.full_name if t.user else "Technician",
            phone=t.user.phone if t.user else None,
            badge_number=t.badge_number,
            skills=t.skills,
            vehicle_type=t.vehicle_type,
            is_available=t.is_available,
            rating=t.rating,
        ))
    return results


@router.get("/me/assignments")
def get_my_assignments(db: DB, technician_user: TechnicianUser):
    """List work orders assigned specifically to the logged-in technician."""
    assignments = (
        db.query(BookingAssignment)
        .filter(BookingAssignment.technician_id == technician_user.id)
        .order_by(BookingAssignment.assigned_at.desc())
        .all()
    )
    results = []
    for a in assignments:
        b = a.booking
        results.append({
            "assignment_id": a.id,
            "status": a.status,
            "notes": a.notes,
            "assigned_at": a.assigned_at,
            "booking": {
                "id": b.id,
                "booking_reference": b.booking_reference,
                "service_name": b.service.name if b.service else "Service",
                "customer_name": b.customer.full_name if b.customer else "Customer",
                "customer_phone": b.customer.phone if b.customer else None,
                "address": b.address,
                "city": b.city,
                "scheduled_date": str(b.scheduled_date),
                "scheduled_time": str(b.scheduled_time),
                "duration_minutes": b.duration_minutes,
                "booking_status": b.status.value,
            } if b else None,
        })
    return results


@router.patch("/assignments/{assignment_id}/status")
def update_assignment_status(
    assignment_id: int, payload: AssignmentStatusUpdate, db: DB, technician_user: TechnicianUser
):
    """Technician updates status of an assigned work order (e.g. en_route, on_site, completed)."""
    assignment = db.query(BookingAssignment).filter(BookingAssignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Assignment not found")

    if assignment.technician_id != technician_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your assigned work order")

    assignment.status = payload.status
    if payload.notes:
        assignment.notes = payload.notes
    if payload.status == "completed":
        assignment.completed_at = datetime.now(timezone.utc)
        if assignment.booking and assignment.booking.status == BookingStatus.IN_PROGRESS:
            assignment.booking.status = BookingStatus.COMPLETED
    elif payload.status in ("en_route", "on_site"):
        if assignment.booking and assignment.booking.status in (BookingStatus.CONFIRMED, BookingStatus.PROVIDER_ASSIGNED):
            assignment.booking.status = BookingStatus.IN_PROGRESS

    db.commit()
    db.refresh(assignment)
    return {"message": f"Assignment status updated to {payload.status}", "assignment_id": assignment.id}
