import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Text, Float, Enum, DateTime, Date, Time,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class BookingStatus(str, enum.Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PROVIDER_ASSIGNED = "provider_assigned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REJECTED = "rejected"


# Valid status transitions
BOOKING_STATUS_TRANSITIONS: dict[BookingStatus, list[BookingStatus]] = {
    BookingStatus.PENDING: [BookingStatus.CONFIRMED, BookingStatus.PROVIDER_ASSIGNED, BookingStatus.CANCELLED, BookingStatus.REJECTED],
    BookingStatus.CONFIRMED: [BookingStatus.PROVIDER_ASSIGNED, BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED],
    BookingStatus.PROVIDER_ASSIGNED: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.REJECTED],
    BookingStatus.IN_PROGRESS: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
    BookingStatus.COMPLETED: [],
    BookingStatus.CANCELLED: [],
    BookingStatus.REJECTED: [],
}


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_reference = Column(String(50), unique=True, index=True, nullable=True)
    customer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    service_id = Column(Integer, ForeignKey("services.id", ondelete="SET NULL"), nullable=True, index=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING, nullable=False, index=True)

    scheduled_date = Column(Date, nullable=False)
    scheduled_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, nullable=False, default=60)
    
    subtotal = Column(Float, nullable=False, default=0.0)
    discount_amount = Column(Float, nullable=False, default=0.0)
    tax_amount = Column(Float, nullable=False, default=0.0)
    total_price = Column(Float, nullable=False, default=0.0)
    coupon_id = Column(Integer, ForeignKey("coupons.id", ondelete="SET NULL"), nullable=True)

    address = Column(Text, nullable=False)
    city = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=True)
    notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)

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
    customer = relationship("User", back_populates="bookings_as_customer", foreign_keys=[customer_id])
    provider = relationship("User", back_populates="bookings_as_provider", foreign_keys=[provider_id])
    service = relationship("Service", back_populates="bookings")
    payment = relationship("Payment", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    review = relationship("Review", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    invoice = relationship("Invoice", back_populates="booking", uselist=False, cascade="all, delete-orphan")
    coupon = relationship("Coupon", back_populates="bookings")
    assignments = relationship("BookingAssignment", back_populates="booking", cascade="all, delete-orphan")
    images = relationship("BookingImage", back_populates="booking", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="booking", cascade="all, delete-orphan")


class BookingAssignment(Base):
    """Assignment of a technician to a booking."""
    __tablename__ = "booking_assignments"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    technician_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    assigned_by_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(50), default="assigned", nullable=False)  # assigned, en_route, on_site, completed
    notes = Column(Text, nullable=True)

    assigned_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    booking = relationship("Booking", back_populates="assignments")
    technician = relationship("User", foreign_keys=[technician_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])


class BookingImage(Base):
    """Job verification images (before, after, invoice photo)."""
    __tablename__ = "booking_images"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(512), nullable=False)
    caption = Column(String(255), nullable=True)
    image_type = Column(String(50), default="work_log", nullable=False)  # before, after, inspection, invoice

    uploaded_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    booking = relationship("Booking", back_populates="images")
