from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.booking import Booking, BookingStatus, BOOKING_STATUS_TRANSITIONS
from app.models.user import User, UserRole
from app.models.service import Service
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingStatusUpdate,
    BookingResponse,
    BookingDetailResponse,
    BookingListResponse,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _enrich(booking: Booking) -> BookingDetailResponse:
    data = BookingResponse.model_validate(booking).model_dump()
    data["customer_name"] = booking.customer.full_name if booking.customer else None
    data["provider_name"] = booking.provider.full_name if booking.provider else None
    data["service_name"] = booking.service.name if booking.service else None
    return BookingDetailResponse(**data)


@router.get("", response_model=BookingListResponse)
def list_bookings(
    db: DB,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: BookingStatus | None = None,
) -> BookingListResponse:
    """List bookings visible to the current user."""
    query = db.query(Booking)
    if current_user.role == UserRole.CUSTOMER:
        query = query.filter(Booking.customer_id == current_user.id)
    elif current_user.role == UserRole.PROVIDER:
        query = query.filter(Booking.provider_id == current_user.id)
    elif current_user.role == UserRole.TECHNICIAN:
        # Technicians see active dispatched orders
        query = query.filter(Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]))
    # admin sees all

    if status_filter:
        query = query.filter(Booking.status == status_filter)

    total = query.count()
    bookings = query.order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    return BookingListResponse(
        bookings=[_enrich(b) for b in bookings],
        total=total,
    )


@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking(booking_id: int, db: DB, current_user: CurrentUser) -> BookingDetailResponse:
    """Get a booking by ID."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    # Restrict access
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    if current_user.role == UserRole.PROVIDER and booking.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    return _enrich(booking)


@router.post("", response_model=BookingDetailResponse, status_code=status.HTTP_201_CREATED)
def create_booking(payload: BookingCreate, db: DB, current_user: CurrentUser) -> BookingDetailResponse:
    """Create a new booking (customer)."""
    if current_user.role not in (UserRole.CUSTOMER, UserRole.ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can create bookings")

    # Validate provider exists
    provider = db.query(User).filter(User.id == payload.provider_id, User.role == UserRole.PROVIDER).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")

    # Validate service exists
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")

    booking = Booking(
        customer_id=current_user.id,
        provider_id=payload.provider_id,
        service_id=payload.service_id,
        scheduled_date=payload.scheduled_date,
        scheduled_time=payload.scheduled_time,
        duration_minutes=payload.duration_minutes,
        total_price=payload.total_price,
        address=payload.address,
        city=payload.city,
        zip_code=payload.zip_code,
        notes=payload.notes,
        status=BookingStatus.PENDING,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    return _enrich(booking)


@router.put("/{booking_id}", response_model=BookingDetailResponse)
def update_booking(
    booking_id: int, payload: BookingUpdate, db: DB, current_user: CurrentUser
) -> BookingDetailResponse:
    """Update booking details (only if still pending)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")

    if booking.status != BookingStatus.PENDING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only edit bookings with 'pending' status",
        )

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(booking, field, value)
    db.commit()
    db.refresh(booking)
    return _enrich(booking)


@router.patch("/{booking_id}/status", response_model=BookingDetailResponse)
def update_booking_status(
    booking_id: int, payload: BookingStatusUpdate, db: DB, current_user: CurrentUser
) -> BookingDetailResponse:
    """Transition booking status following the allowed workflow."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Access check
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    if current_user.role == UserRole.PROVIDER and booking.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    if current_user.role == UserRole.TECHNICIAN and payload.status not in (BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Technicians can only advance to in-progress or completed")

    # Validate transition
    allowed = BOOKING_STATUS_TRANSITIONS.get(booking.status, [])
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{booking.status.value}' to '{payload.status.value}'. "
                   f"Allowed: {[s.value for s in allowed]}",
        )

    booking.status = payload.status
    if payload.cancellation_reason:
        booking.cancellation_reason = payload.cancellation_reason
    db.commit()
    db.refresh(booking)
    return _enrich(booking)


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: int, db: DB, current_user: CurrentUser) -> None:
    """Delete a booking (admin only, or customer if still pending)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.ADMIN:
        pass  # admin can delete any
    elif current_user.role == UserRole.CUSTOMER and booking.customer_id == current_user.id:
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only delete pending bookings",
            )
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not allowed")

    db.delete(booking)
    db.commit()
