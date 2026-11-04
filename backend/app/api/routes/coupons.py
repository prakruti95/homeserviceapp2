from fastapi import APIRouter, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.payment import Coupon
from app.schemas.payment import (
    CouponCreate,
    CouponResponse,
    CouponValidateRequest,
    CouponValidateResponse,
)

router = APIRouter(prefix="/coupons", tags=["Coupons"])


@router.get("", response_model=list[CouponResponse])
def list_active_coupons(db: DB) -> list[CouponResponse]:
    """List active promotional coupons (public)."""
    coupons = db.query(Coupon).filter(Coupon.is_active == True).all()
    return [CouponResponse.model_validate(c) for c in coupons]


@router.post("/validate", response_model=CouponValidateResponse)
def validate_coupon(payload: CouponValidateRequest, db: DB) -> CouponValidateResponse:
    """Validate a coupon code against a subtotal and compute discount."""
    code_cleaned = payload.code.strip().upper()
    coupon = db.query(Coupon).filter(Coupon.code == code_cleaned, Coupon.is_active == True).first()

    if not coupon:
        return CouponValidateResponse(
            is_valid=False,
            code=payload.code,
            discount_amount=0.0,
            final_amount=payload.subtotal,
            message="Invalid or expired coupon code",
        )

    if payload.subtotal < coupon.min_order_amount:
        return CouponValidateResponse(
            is_valid=False,
            code=coupon.code,
            discount_amount=0.0,
            final_amount=payload.subtotal,
            message=f"Minimum order of ${coupon.min_order_amount:.2f} required for this coupon",
        )

    if coupon.times_used >= coupon.usage_limit:
        return CouponValidateResponse(
            is_valid=False,
            code=coupon.code,
            discount_amount=0.0,
            final_amount=payload.subtotal,
            message="This coupon has reached its maximum usage limit",
        )

    # Calculate discount
    if coupon.discount_type == "percentage":
        discount = (payload.subtotal * coupon.discount_value) / 100.0
        if coupon.max_discount:
            discount = min(discount, coupon.max_discount)
    else:
        discount = min(coupon.discount_value, payload.subtotal)

    final_amt = max(0.0, round(payload.subtotal - discount, 2))
    return CouponValidateResponse(
        is_valid=True,
        code=coupon.code,
        discount_amount=round(discount, 2),
        final_amount=final_amt,
        message=f"Coupon applied: ${discount:.2f} off your booking!",
    )


@router.post("", response_model=CouponResponse, status_code=status.HTTP_201_CREATED)
def create_coupon(payload: CouponCreate, db: DB, admin: AdminUser) -> CouponResponse:
    """Create a new promotional coupon (Admin only)."""
    existing = db.query(Coupon).filter(Coupon.code == payload.code.strip().upper()).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Coupon code already exists")

    coupon = Coupon(
        code=payload.code.strip().upper(),
        description=payload.description,
        discount_type=payload.discount_type,
        discount_value=payload.discount_value,
        min_order_amount=payload.min_order_amount,
        max_discount=payload.max_discount,
        usage_limit=payload.usage_limit,
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return CouponResponse.model_validate(coupon)
