import uuid
from datetime import date, datetime, timedelta
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.booking import (
    Booking, BookingStatus, BOOKING_STATUS_TRANSITIONS,
    BookingAssignment, BookingImage
)
from app.models.user import User, UserRole
from app.models.service import Service
from app.models.payment import Coupon
from app.schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingStatusUpdate,
    BookingReschedule,
    BookingCancel,
    TechnicianAssign,
    BookingImageCreate,
    BookingImageResponse,
    BookingResponse,
    BookingDetailResponse,
    BookingListResponse,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _check_provider_overlap(
    db: Session,
    provider_id: int,
    scheduled_date: date,
    scheduled_time,
    duration_minutes: int,
    exclude_booking_id: int | None = None,
) -> None:
    """Validate that provider does not have an overlapping active booking."""
    active_statuses = [
        BookingStatus.PENDING,
        BookingStatus.CONFIRMED,
        BookingStatus.PROVIDER_ASSIGNED,
        BookingStatus.IN_PROGRESS,
    ]
    query = db.query(Booking).filter(
        Booking.provider_id == provider_id,
        Booking.scheduled_date == scheduled_date,
        Booking.status.in_(active_statuses),
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)

    existing_bookings = query.all()
    req_start = scheduled_time.hour * 60 + scheduled_time.minute
    req_end = req_start + duration_minutes

    for eb in existing_bookings:
        eb_start = eb.scheduled_time.hour * 60 + eb.scheduled_time.minute
        eb_end = eb_start + eb.duration_minutes
        # Check time overlap: (start1 < end2) and (end1 > start2)
        if req_start < eb_end and req_end > eb_start:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Provider already has a scheduled appointment ({eb.scheduled_time.strftime('%H:%M')}) overlapping with this time slot.",
            )


def _enrich(booking: Booking) -> BookingDetailResponse:
    data = BookingResponse.model_validate(booking).model_dump()
    data["customer_name"] = booking.customer.full_name if booking.customer else None
    data["provider_name"] = booking.provider.full_name if booking.provider else None
    data["service_name"] = booking.service.name if booking.service else None
    
    # Check if a technician is assigned
    if booking.assignments:
        latest_assign = booking.assignments[-1]
        data["technician_name"] = latest_assign.technician.full_name if latest_assign.technician else None
    return BookingDetailResponse(**data)


@router.get("", response_model=BookingListResponse)
@router.get("/", response_model=BookingListResponse, include_in_schema=False)
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
        # Technicians see bookings assigned to them or confirmed jobs
        query = query.outerjoin(BookingAssignment).filter(
            (BookingAssignment.technician_id == current_user.id) |
            (Booking.status.in_([BookingStatus.CONFIRMED, BookingStatus.PROVIDER_ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED]))
        )
    # SUPER_ADMIN and ADMIN see all

    if status_filter:
        query = query.filter(Booking.status == status_filter)

    total = query.distinct().count()
    bookings = query.distinct().order_by(Booking.created_at.desc()).offset(skip).limit(limit).all()
    return BookingListResponse(
        bookings=[_enrich(b) for b in bookings],
        total=total,
    )


@router.get("/{booking_id}", response_model=BookingDetailResponse)
def get_booking(booking_id: int, db: DB, current_user: CurrentUser) -> BookingDetailResponse:
    """Get a booking by ID with ownership enforcement."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    
    # Role-based ownership check
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    if current_user.role == UserRole.PROVIDER and booking.provider_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    return _enrich(booking)


@router.post("", response_model=BookingDetailResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=BookingDetailResponse, status_code=status.HTTP_201_CREATED, include_in_schema=False)
def create_booking(payload: BookingCreate, db: DB, current_user: CurrentUser) -> BookingDetailResponse:
    """Create a new booking with transaction safety, overlap prevention, and optional coupon discount."""
    if current_user.role not in (UserRole.CUSTOMER, UserRole.ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only customers can create bookings")

    # Validate scheduled date is today or future
    if payload.scheduled_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Appointment date cannot be in the past")

    # Validate provider exists and is active
    provider = db.query(User).filter(User.id == payload.provider_id, User.role == UserRole.PROVIDER).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found or not active")

    # Validate service exists and is active
    service = db.query(Service).filter(Service.id == payload.service_id, Service.is_active == True).first()
    if not service:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found or is currently inactive")

    # Prevent overlapping provider bookings
    _check_provider_overlap(db, payload.provider_id, payload.scheduled_date, payload.scheduled_time, payload.duration_minutes)

    subtotal = float(service.base_price) if payload.total_price <= 0 else float(payload.total_price)
    discount_amount = 0.0
    coupon_id = None

    # Apply coupon if provided
    if payload.coupon_code:
        coupon = db.query(Coupon).filter(Coupon.code == payload.coupon_code.strip().upper(), Coupon.is_active == True).first()
        if coupon and subtotal >= coupon.min_order_amount:
            if coupon.discount_type == "percentage":
                discount_amount = (subtotal * coupon.discount_value) / 100.0
                if coupon.max_discount:
                    discount_amount = min(discount_amount, coupon.max_discount)
            else:
                discount_amount = min(coupon.discount_value, subtotal)
            coupon_id = coupon.id
            coupon.times_used += 1

    total_price = max(0.0, round(subtotal - discount_amount, 2))
    booking_ref = f"HS-BK-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"

    try:
        booking = Booking(
            booking_reference=booking_ref,
            customer_id=current_user.id,
            provider_id=payload.provider_id,
            service_id=payload.service_id,
            scheduled_date=payload.scheduled_date,
            scheduled_time=payload.scheduled_time,
            duration_minutes=payload.duration_minutes,
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=0.0,
            total_price=total_price,
            coupon_id=coupon_id,
            address=payload.address,
            city=payload.city or current_user.city or "San Francisco",
            zip_code=payload.zip_code or current_user.zip_code or "94103",
            notes=payload.notes,
            status=BookingStatus.PENDING,
        )
        db.add(booking)
        db.commit()
        db.refresh(booking)
        return _enrich(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to create booking: {str(e)}")


@router.patch("/{booking_id}/reschedule", response_model=BookingDetailResponse)
def reschedule_booking(
    booking_id: int, payload: BookingReschedule, db: DB, current_user: CurrentUser
) -> BookingDetailResponse:
    """Reschedule an existing booking with overlap validation."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Ownership check
    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to reschedule this booking")

    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot reschedule a {booking.status.value} booking")

    if payload.scheduled_date < date.today():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Reschedule date cannot be in the past")

    if booking.provider_id:
        _check_provider_overlap(
            db, booking.provider_id, payload.scheduled_date, payload.scheduled_time, booking.duration_minutes, exclude_booking_id=booking.id
        )

    try:
        booking.scheduled_date = payload.scheduled_date
        booking.scheduled_time = payload.scheduled_time
        db.commit()
        db.refresh(booking)
        return _enrich(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Reschedule failed: {str(e)}")


@router.patch("/{booking_id}/cancel", response_model=BookingDetailResponse)
def cancel_booking(
    booking_id: int, payload: BookingCancel, db: DB, current_user: CurrentUser
) -> BookingDetailResponse:
    """Cancel a booking with a valid cancellation reason."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to cancel this booking")

    if booking.status in (BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REJECTED):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Booking is already {booking.status.value}")

    try:
        booking.status = BookingStatus.CANCELLED
        booking.cancellation_reason = payload.cancellation_reason or "Cancelled by user"
        db.commit()
        db.refresh(booking)
        return _enrich(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Cancellation failed: {str(e)}")


@router.post("/{booking_id}/assign", response_model=BookingDetailResponse)
def assign_technician(
    booking_id: int, payload: TechnicianAssign, db: DB, current_user: CurrentUser
) -> BookingDetailResponse:
    """Assign a field technician to a confirmed booking."""
    if current_user.role not in (UserRole.PROVIDER, UserRole.ADMIN, UserRole.SUPER_ADMIN):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only providers or admins can assign technicians")

    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    # Validate technician exists
    tech = db.query(User).filter(User.id == payload.technician_id, User.role == UserRole.TECHNICIAN).first()
    if not tech:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Technician user not found")

    try:
        assignment = BookingAssignment(
            booking_id=booking.id,
            technician_id=tech.id,
            assigned_by_id=current_user.id,
            status="assigned",
            notes=payload.notes,
        )
        db.add(assignment)
        booking.status = BookingStatus.PROVIDER_ASSIGNED
        db.commit()
        db.refresh(booking)
        return _enrich(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to assign technician: {str(e)}")


@router.post("/{booking_id}/images", response_model=BookingImageResponse, status_code=status.HTTP_201_CREATED)
def add_booking_image(
    booking_id: int, payload: BookingImageCreate, db: DB, current_user: CurrentUser
) -> BookingImageResponse:
    """Upload or record a photo/work verification image for a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    image = BookingImage(
        booking_id=booking.id,
        image_url=payload.image_url,
        caption=payload.caption,
        image_type=payload.image_type or "work_log",
    )
    db.add(image)
    db.commit()
    db.refresh(image)
    return BookingImageResponse.model_validate(image)


@router.get("/{booking_id}/images", response_model=list[BookingImageResponse])
def get_booking_images(booking_id: int, db: DB, current_user: CurrentUser) -> list[BookingImageResponse]:
    """Retrieve all images attached to a booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    images = db.query(BookingImage).filter(BookingImage.booking_id == booking_id).all()
    return [BookingImageResponse.model_validate(img) for img in images]


@router.patch("/{booking_id}/status", response_model=BookingDetailResponse)
def update_booking_status(
    booking_id: int, payload: BookingStatusUpdate, db: DB, current_user: CurrentUser
) -> BookingDetailResponse:
    """Transition booking status following strict state machine rules."""
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
    if payload.status == booking.status:
        return _enrich(booking)

    allowed = BOOKING_STATUS_TRANSITIONS.get(booking.status, [])
    if payload.status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot transition from '{booking.status.value}' to '{payload.status.value}'. "
                   f"Allowed transitions: {[s.value for s in allowed]}",
        )

    try:
        booking.status = payload.status
        if payload.cancellation_reason:
            booking.cancellation_reason = payload.cancellation_reason
        db.commit()
        db.refresh(booking)
        return _enrich(booking)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Status update failed: {str(e)}")


@router.delete("/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_booking(booking_id: int, db: DB, current_user: CurrentUser) -> None:
    """Delete a booking (admin or customer if still pending)."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
        pass  # Admins can delete any
    elif current_user.role == UserRole.CUSTOMER and booking.customer_id == current_user.id:
        if booking.status != BookingStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Can only delete pending bookings",
            )
    else:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

    db.delete(booking)
    db.commit()
