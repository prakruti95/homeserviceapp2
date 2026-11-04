from app.models.user import User, UserRole, Customer, Address
from app.models.service import ServiceCategory, Service
from app.models.provider import (
    ProviderProfile,
    ServiceProvider,
    Technician,
    ServiceArea,
    AvailabilitySlot,
    ProviderAvailability,
    provider_services,
)
from app.models.booking import Booking, BookingStatus, BookingAssignment, BookingImage, BOOKING_STATUS_TRANSITIONS
from app.models.payment import Payment, PaymentStatus, PaymentMethod, Invoice, Coupon, ProviderEarning
from app.models.review import Review
from app.models.notification import Notification
from app.models.complaint import Complaint

__all__ = [
    # 20 Canonical Entities
    "User",
    "Customer",
    "ServiceProvider",
    "Technician",
    "Address",
    "ServiceCategory",
    "Service",
    "provider_services",
    "ServiceArea",
    "AvailabilitySlot",
    "Booking",
    "BookingAssignment",
    "BookingImage",
    "Payment",
    "Invoice",
    "Coupon",
    "Review",
    "Complaint",
    "Notification",
    "ProviderEarning",
    # Supporting models & enums
    "UserRole",
    "ProviderProfile",
    "ProviderAvailability",
    "BookingStatus",
    "BOOKING_STATUS_TRANSITIONS",
    "PaymentStatus",
    "PaymentMethod",
]
