from datetime import datetime, timezone

from sqlalchemy import (
    Column, Integer, String, Text, Float, Boolean, DateTime, Time,
    ForeignKey, Table,
)
from sqlalchemy.orm import relationship

from app.db.database import Base

# Many-to-many: providers <-> services
provider_services = Table(
    "provider_services",
    Base.metadata,
    Column("provider_id", Integer, ForeignKey("provider_profiles.id", ondelete="CASCADE"), primary_key=True),
    Column("service_id", Integer, ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
    extend_existing=True,
)


class ProviderProfile(Base):
    __tablename__ = "provider_profiles"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    business_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, nullable=True, default=0)
    hourly_rate = Column(Float, nullable=True, default=0.0)
    service_area = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    total_bookings = Column(Integer, default=0, nullable=False)

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
    user = relationship("User", back_populates="provider_profile")
    services = relationship(
        "Service",
        secondary=provider_services,
        back_populates="provider_profiles",
    )
    availability_slots = relationship(
        "ProviderAvailability", back_populates="provider", cascade="all, delete-orphan"
    )


class ServiceProvider(Base):
    """Canonical service_providers entity required by platform specifications."""
    __tablename__ = "service_providers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    business_name = Column(String(255), nullable=True)
    bio = Column(Text, nullable=True)
    license_number = Column(String(100), nullable=True)
    experience_years = Column(Integer, nullable=True, default=0)
    hourly_rate = Column(Float, nullable=True, default=0.0)
    service_area = Column(String(255), nullable=True)
    is_verified = Column(Boolean, default=False, nullable=False)
    commission_rate = Column(Float, default=0.10, nullable=False)
    average_rating = Column(Float, default=0.0, nullable=False)
    total_reviews = Column(Integer, default=0, nullable=False)
    total_bookings = Column(Integer, default=0, nullable=False)

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
    user = relationship("User", back_populates="service_provider")
    service_areas = relationship("ServiceArea", back_populates="service_provider", cascade="all, delete-orphan")
    canonical_availability = relationship("AvailabilitySlot", back_populates="service_provider", cascade="all, delete-orphan")


class Technician(Base):
    """Field technicians deployed for on-site execution."""
    __tablename__ = "technicians"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False, index=True)
    provider_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    badge_number = Column(String(50), nullable=True)
    skills = Column(Text, nullable=True)
    vehicle_type = Column(String(100), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    rating = Column(Float, default=5.0, nullable=False)

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
    user = relationship("User", back_populates="technician_profile", foreign_keys=[user_id])
    provider = relationship("User", foreign_keys=[provider_id])


class ServiceArea(Base):
    """Geographic service areas supported by providers."""
    __tablename__ = "service_areas"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    city = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    zip_code = Column(String(20), nullable=True)
    radius_km = Column(Float, default=25.0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    service_provider = relationship("ServiceProvider", back_populates="service_areas")


class AvailabilitySlot(Base):
    """Canonical availability_slots entity."""
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("service_providers.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday … 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

    created_at = Column(
        DateTime, default=lambda: datetime.now(timezone.utc), nullable=False
    )

    # Relationships
    service_provider = relationship("ServiceProvider", back_populates="canonical_availability")


class ProviderAvailability(Base):
    """Backward compatibility provider_availability table."""
    __tablename__ = "provider_availability"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    provider_id = Column(Integer, ForeignKey("provider_profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    day_of_week = Column(Integer, nullable=False)  # 0=Monday … 6=Sunday
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)

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
    provider = relationship("ProviderProfile", back_populates="availability_slots")
