from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel, Field

from app.models.payment import PaymentMethod, PaymentStatus


class PaymentCreate(BaseModel):
    booking_id: int
    amount: float = Field(..., gt=0)
    payment_method: PaymentMethod = PaymentMethod.CREDIT_CARD
    transaction_id: Optional[str] = None


class PaymentUpdate(BaseModel):
    status: Optional[PaymentStatus] = None
    transaction_id: Optional[str] = None


class DemoPaymentRequest(BaseModel):
    booking_id: int
    payment_method: PaymentMethod = PaymentMethod.CREDIT_CARD
    card_last4: Optional[str] = "4242"


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: float
    platform_fee: float = 0.0
    provider_amount: float = 0.0
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str] = None
    is_demo: bool = True
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    payments: list[PaymentResponse]
    total: int


# --- Invoices ---

class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    booking_id: int
    customer_id: int
    subtotal: float
    discount_amount: float
    tax_amount: float
    total_amount: float
    status: str
    issued_date: date
    due_date: Optional[date] = None
    pdf_url: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Coupons ---

class CouponValidateRequest(BaseModel):
    code: str
    subtotal: float = Field(..., ge=0)


class CouponValidateResponse(BaseModel):
    is_valid: bool
    code: str
    discount_amount: float
    final_amount: float
    message: str


class CouponCreate(BaseModel):
    code: str = Field(..., min_length=2, max_length=50)
    description: Optional[str] = None
    discount_type: str = "percentage"  # percentage, fixed
    discount_value: float = Field(..., gt=0)
    min_order_amount: float = 0.0
    max_discount: Optional[float] = None
    usage_limit: int = 100


class CouponResponse(BaseModel):
    id: int
    code: str
    description: Optional[str] = None
    discount_type: str
    discount_value: float
    min_order_amount: float
    max_discount: Optional[float] = None
    usage_limit: int
    times_used: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# --- Complaints ---

class ComplaintCreate(BaseModel):
    booking_id: int
    subject: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10)
    priority: Optional[str] = "medium"  # low, medium, high, urgent


class ComplaintStatusUpdate(BaseModel):
    status: str  # open, investigating, resolved, closed
    resolution_notes: Optional[str] = None


class ComplaintResponse(BaseModel):
    id: int
    ticket_number: str
    booking_id: int
    customer_id: int
    subject: str
    description: str
    priority: str
    status: str
    resolution_notes: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
