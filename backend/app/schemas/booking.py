from datetime import date, time, datetime
from typing import Optional

from pydantic import BaseModel, Field

from app.models.booking import BookingStatus


class BookingCreate(BaseModel):
    provider_id: int
    service_id: int
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int = Field(60, ge=1)
    total_price: Optional[float] = Field(0.0, ge=0)
    address: str = Field(..., min_length=1)
    city: Optional[str] = None
    zip_code: Optional[str] = None
    notes: Optional[str] = None
    coupon_code: Optional[str] = None


class BookingUpdate(BaseModel):
    scheduled_date: Optional[date] = None
    scheduled_time: Optional[time] = None
    duration_minutes: Optional[int] = Field(None, ge=1)
    total_price: Optional[float] = Field(None, ge=0)
    address: Optional[str] = None
    city: Optional[str] = None
    zip_code: Optional[str] = None
    notes: Optional[str] = None


class BookingReschedule(BaseModel):
    scheduled_date: date
    scheduled_time: time


class BookingCancel(BaseModel):
    cancellation_reason: Optional[str] = "Customer requested cancellation"


class BookingStatusUpdate(BaseModel):
    status: BookingStatus
    cancellation_reason: Optional[str] = None


class TechnicianAssign(BaseModel):
    technician_id: int
    notes: Optional[str] = None


class BookingImageCreate(BaseModel):
    image_url: str = Field(..., min_length=1)
    caption: Optional[str] = None
    image_type: Optional[str] = "work_log"  # before, after, inspection, invoice


class BookingImageResponse(BaseModel):
    id: int
    booking_id: int
    image_url: str
    caption: Optional[str] = None
    image_type: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class BookingResponse(BaseModel):
    id: int
    booking_reference: Optional[str] = None
    customer_id: int
    provider_id: Optional[int] = None
    service_id: Optional[int] = None
    status: BookingStatus
    scheduled_date: date
    scheduled_time: time
    duration_minutes: int
    subtotal: float = 0.0
    discount_amount: float = 0.0
    tax_amount: float = 0.0
    total_price: float
    address: str
    city: Optional[str] = None
    zip_code: Optional[str] = None
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BookingDetailResponse(BookingResponse):
    customer_name: Optional[str] = None
    provider_name: Optional[str] = None
    service_name: Optional[str] = None
    technician_name: Optional[str] = None
    payment_status: Optional[str] = None
    payment_id: Optional[int] = None
    transaction_id: Optional[str] = None


class BookingListResponse(BaseModel):
    bookings: list[BookingDetailResponse]
    total: int
