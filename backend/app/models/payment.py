import enum
from datetime import datetime, timezone, date

from sqlalchemy import (
    Column, Integer, String, Float, Enum, DateTime, Date, ForeignKey, Boolean, Text,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"


class PaymentMethod(str, enum.Enum):
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    CASH = "cash"
    BANK_TRANSFER = "bank_transfer"
    WALLET = "wallet"


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False, default=0.0)
    provider_amount = Column(Float, nullable=False, default=0.0)
    payment_method = Column(Enum(PaymentMethod), nullable=False, default=PaymentMethod.CREDIT_CARD)
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.PENDING)
    transaction_id = Column(String(255), nullable=True, unique=True)
    is_demo = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    booking = relationship("Booking", back_populates="payment")
    user = relationship("User", back_populates="payments")


class Invoice(Base):
    """Canonical invoices entity."""
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    invoice_number = Column(String(50), unique=True, index=True, nullable=False)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), default="issued", nullable=False)  # draft, issued, paid, cancelled
    issued_date = Column(Date, default=lambda: date.today(), nullable=False)
    due_date = Column(Date, nullable=True)
    pdf_url = Column(String(512), nullable=True)

    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )

    # Relationships
    booking = relationship("Booking", back_populates="invoice")
    customer = relationship("User", foreign_keys=[customer_id])


class Coupon(Base):
    """Discount coupons entity."""
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    code = Column(String(50), unique=True, index=True, nullable=False)
    description = Column(String(255), nullable=True)
    discount_type = Column(String(20), default="percentage", nullable=False)  # percentage, fixed
    discount_value = Column(Float, nullable=False)  # e.g., 15 for 15% or 20.0 for $20 off
    min_order_amount = Column(Float, default=0.0, nullable=False)
    max_discount = Column(Float, nullable=True)
    valid_from = Column(DateTime, nullable=True)
    valid_to = Column(DateTime, nullable=True)
    usage_limit = Column(Integer, default=100, nullable=False)
    times_used = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    bookings = relationship("Booking", back_populates="coupon")


class ProviderEarning(Base):
    """Canonical provider_earnings entity for commission & payouts."""
    __tablename__ = "provider_earnings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    gross_amount = Column(Float, nullable=False)
    platform_fee = Column(Float, nullable=False)
    net_earnings = Column(Float, nullable=False)
    status = Column(String(50), default="available", nullable=False)  # pending, available, paid, withdrawn
    payout_date = Column(DateTime, nullable=True)

    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    provider = relationship("User", foreign_keys=[provider_id])
    booking = relationship("Booking", foreign_keys=[booking_id])
