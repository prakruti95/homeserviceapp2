from datetime import datetime
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


class PaymentResponse(BaseModel):
    id: int
    booking_id: int
    user_id: int
    amount: float
    payment_method: PaymentMethod
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class PaymentListResponse(BaseModel):
    payments: list[PaymentResponse]
    total: int
