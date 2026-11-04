import enum
from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Boolean, Enum, DateTime, Text, ForeignKey,
)
from sqlalchemy.orm import relationship

from app.db.database import Base


class UserRole(str, enum.Enum):
    SUPER_ADMIN = "super_admin"
    ADMIN = "admin"
    PROVIDER = "provider"
    CUSTOMER = "customer"
    TECHNICIAN = "technician"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(20), nullable=True)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CUSTOMER)
    is_active = Column(Boolean, default=True, nullable=False)
    avatar_url = Column(Text, nullable=True)
    address = Column(Text, nullable=True)
    city = Column(String(100), nullable=True)
    state = Column(String(100), nullable=True)
    zip_code = Column(String(20), nullable=True)

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
    provider_profile = relationship(
        "ProviderProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    service_provider = relationship(
        "ServiceProvider", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    customer_profile = relationship(
        "Customer", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    technician_profile = relationship(
        "Technician", back_populates="user", uselist=False, foreign_keys="Technician.user_id", cascade="all, delete-orphan"
    )
    saved_addresses = relationship(
        "Address", back_populates="user", cascade="all, delete-orphan"
    )
    bookings_as_customer = relationship(
        "Booking", back_populates="customer", foreign_keys="Booking.customer_id", cascade="all, delete-orphan"
    )
    bookings_as_provider = relationship(
        "Booking", back_populates="provider", foreign_keys="Booking.provider_id"
    )
    reviews_written = relationship(
        "Review", back_populates="customer", foreign_keys="Review.customer_id", cascade="all, delete-orphan"
    )
    reviews_received = relationship(
        "Review", back_populates="provider", foreign_keys="Review.provider_id"
    )
    payments = relationship("Payment", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    complaints = relationship("Complaint", back_populates="customer", cascade="all, delete-orphan")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    loyalty_points = Column(Integer, default=0, nullable=False)
    preferred_payment_method = Column(String(50), default="credit_card", nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)

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
    user = relationship("User", back_populates="customer_profile")


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    label = Column(String(50), default="Home", nullable=False)  # Home, Work, Other
    street_address = Column(Text, nullable=False)
    unit_number = Column(String(50), nullable=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=False)
    is_default = Column(Boolean, default=False, nullable=False)

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
    user = relationship("User", back_populates="saved_addresses")
