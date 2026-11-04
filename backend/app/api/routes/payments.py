import uuid
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.booking import Booking
from app.models.payment import Payment, PaymentStatus, PaymentMethod
from app.models.user import UserRole
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
)

router = APIRouter(prefix="/payments", tags=["Payments"])


@router.get("", response_model=PaymentListResponse)
def list_payments(
    db: DB,
    current_user: CurrentUser,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    status_filter: PaymentStatus | None = None,
) -> PaymentListResponse:
    """List payments visible to the current user."""
    query = db.query(Payment)
    if current_user.role != UserRole.ADMIN:
        query = query.filter(Payment.user_id == current_user.id)
    if status_filter:
        query = query.filter(Payment.status == status_filter)
    total = query.count()
    payments = query.order_by(Payment.created_at.desc()).offset(skip).limit(limit).all()
    return PaymentListResponse(
        payments=[PaymentResponse.model_validate(p) for p in payments],
        total=total,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: DB, current_user: CurrentUser) -> PaymentResponse:
    """Get a payment by ID."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if current_user.role != UserRole.ADMIN and payment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return PaymentResponse.model_validate(payment)


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: DB, current_user: CurrentUser) -> PaymentResponse:
    """Record a payment for a booking."""
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role == UserRole.CUSTOMER and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")

    existing = db.query(Payment).filter(Payment.booking_id == payload.booking_id).first()
    if existing:
        return PaymentResponse.model_validate(existing)

    # Automatically complete card/digital payments and generate transaction reference
    txn_id = payload.transaction_id or f"TXN-{uuid.uuid4().hex[:12].upper()}"
    pay_status = (
        PaymentStatus.COMPLETED
        if payload.payment_method in (PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.WALLET)
        else PaymentStatus.PENDING
    )

    payment = Payment(
        booking_id=payload.booking_id,
        user_id=current_user.id,
        amount=payload.amount,
        payment_method=payload.payment_method,
        status=pay_status,
        transaction_id=txn_id,
    )
    db.add(payment)
    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)


@router.patch("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int, payload: PaymentUpdate, db: DB, admin: AdminUser
) -> PaymentResponse:
    """Update payment status (admin only)."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(payment, key, val)

    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)
