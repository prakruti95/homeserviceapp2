import uuid
from datetime import datetime, date
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.booking import Booking, BookingStatus
from app.models.payment import Payment, PaymentStatus, PaymentMethod, Invoice, ProviderEarning
from app.models.user import UserRole
from app.schemas.payment import (
    PaymentCreate,
    PaymentUpdate,
    PaymentResponse,
    PaymentListResponse,
    DemoPaymentRequest,
)

router = APIRouter(prefix="/payments", tags=["Payments"])

COMMISSION_RATE = 0.10  # 10% platform commission fee


def _create_invoice_and_earnings(db: Session, payment: Payment, booking: Booking) -> Invoice:
    """Helper to generate invoice and calculate provider earnings."""
    # 1. Invoice
    invoice = db.query(Invoice).filter(Invoice.booking_id == booking.id).first()
    if not invoice:
        inv_number = f"INV-{datetime.now().strftime('%Y%m')}-{uuid.uuid4().hex[:6].upper()}"
        invoice = Invoice(
            invoice_number=inv_number,
            booking_id=booking.id,
            customer_id=booking.customer_id,
            subtotal=booking.subtotal or payment.amount,
            discount_amount=booking.discount_amount or 0.0,
            tax_amount=0.0,
            total_amount=payment.amount,
            status="paid" if payment.status in (PaymentStatus.COMPLETED, PaymentStatus.PAID) else "issued",
            issued_date=date.today(),
            due_date=date.today(),
        )
        db.add(invoice)

    # 2. Provider Earnings
    if booking.provider_id:
        earning = db.query(ProviderEarning).filter(ProviderEarning.booking_id == booking.id).first()
        if not earning:
            earning = ProviderEarning(
                provider_id=booking.provider_id,
                booking_id=booking.id,
                gross_amount=payment.amount,
                platform_fee=payment.platform_fee,
                net_earnings=payment.provider_amount,
                status="available",
            )
            db.add(earning)
    return invoice


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
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN):
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
    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN) and payment.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")
    return PaymentResponse.model_validate(payment)


@router.post("/process-demo", response_model=PaymentResponse, status_code=status.HTTP_200_OK)
def process_demo_payment(payload: DemoPaymentRequest, db: DB, current_user: CurrentUser) -> PaymentResponse:
    """Clearly labelled DEMO payment processor for sandbox simulated checkout."""
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN) and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")

    # Check if already paid
    existing = db.query(Payment).filter(Payment.booking_id == payload.booking_id).first()
    if existing and existing.status in (PaymentStatus.PAID, PaymentStatus.COMPLETED):
        return PaymentResponse.model_validate(existing)

    amount = booking.total_price
    platform_fee = round(amount * COMMISSION_RATE, 2)
    provider_amount = round(amount - platform_fee, 2)
    txn_id = f"TXN-DEMO-{uuid.uuid4().hex[:10].upper()}"

    if existing:
        payment = existing
        payment.status = PaymentStatus.COMPLETED
        payment.platform_fee = platform_fee
        payment.provider_amount = provider_amount
        payment.transaction_id = txn_id
        payment.is_demo = True
    else:
        payment = Payment(
            booking_id=booking.id,
            user_id=current_user.id,
            amount=amount,
            platform_fee=platform_fee,
            provider_amount=provider_amount,
            payment_method=payload.payment_method,
            status=PaymentStatus.COMPLETED,
            transaction_id=txn_id,
            is_demo=True,
        )
        db.add(payment)

    # Advance pending booking to confirmed upon payment
    if booking.status == BookingStatus.PENDING:
        booking.status = BookingStatus.CONFIRMED

    # Create Invoice and record ProviderEarnings
    _create_invoice_and_earnings(db, payment, booking)

    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)


@router.post("", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(payload: PaymentCreate, db: DB, current_user: CurrentUser) -> PaymentResponse:
    """Record a payment transaction with automated commission fee breakdown and invoice generation."""
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")

    if current_user.role not in (UserRole.ADMIN, UserRole.SUPER_ADMIN) and booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")

    existing = db.query(Payment).filter(Payment.booking_id == payload.booking_id).first()
    if existing:
        return PaymentResponse.model_validate(existing)

    amount = payload.amount
    platform_fee = round(amount * COMMISSION_RATE, 2)
    provider_amount = round(amount - platform_fee, 2)
    txn_id = payload.transaction_id or f"TXN-{uuid.uuid4().hex[:12].upper()}"
    pay_status = (
        PaymentStatus.COMPLETED
        if payload.payment_method in (PaymentMethod.CREDIT_CARD, PaymentMethod.DEBIT_CARD, PaymentMethod.WALLET)
        else PaymentStatus.PENDING
    )

    payment = Payment(
        booking_id=payload.booking_id,
        user_id=current_user.id,
        amount=amount,
        platform_fee=platform_fee,
        provider_amount=provider_amount,
        payment_method=payload.payment_method,
        status=pay_status,
        transaction_id=txn_id,
        is_demo=False,
    )
    db.add(payment)

    # Generate invoice and provider earnings if paid
    if pay_status == PaymentStatus.COMPLETED:
        if booking.status == BookingStatus.PENDING:
            booking.status = BookingStatus.CONFIRMED
        _create_invoice_and_earnings(db, payment, booking)

    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)


@router.patch("/{payment_id}", response_model=PaymentResponse)
def update_payment(
    payment_id: int, payload: PaymentUpdate, db: DB, admin: AdminUser
) -> PaymentResponse:
    """Update payment status (strictly admin only; clients cannot directly mark payments as paid)."""
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")

    for key, val in payload.model_dump(exclude_unset=True).items():
        setattr(payment, key, val)

    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)
