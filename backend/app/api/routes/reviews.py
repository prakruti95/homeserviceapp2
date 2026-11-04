from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser
from app.models.booking import Booking, BookingStatus
from app.models.review import Review
from app.models.provider import ProviderProfile
from app.models.user import User, UserRole
from app.schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewDetailResponse,
    ReviewListResponse,
)

router = APIRouter(prefix="/reviews", tags=["Reviews"])


def _enrich(review: Review) -> ReviewDetailResponse:
    data = ReviewResponse.model_validate(review).model_dump()
    data["customer_name"] = review.customer.full_name if review.customer else None
    data["provider_name"] = review.provider.full_name if review.provider else None
    return ReviewDetailResponse(**data)


@router.get("", response_model=ReviewListResponse)
def list_reviews(
    db: DB,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    provider_id: int | None = None,
) -> ReviewListResponse:
    """List reviews, optionally filtered by provider user ID."""
    query = db.query(Review)
    if provider_id:
        query = query.filter(Review.provider_id == provider_id)
    total = query.count()
    avg_rating = db.query(func.avg(Review.rating)).filter(
        Review.provider_id == provider_id
    ).scalar() if provider_id else None
    reviews = query.order_by(Review.created_at.desc()).offset(skip).limit(limit).all()
    return ReviewListResponse(
        reviews=[_enrich(r) for r in reviews],
        total=total,
        average_rating=round(float(avg_rating), 2) if avg_rating else None,
    )


@router.get("/{review_id}", response_model=ReviewDetailResponse)
def get_review(review_id: int, db: DB) -> ReviewDetailResponse:
    """Get a review by ID."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    return _enrich(review)


@router.post("", response_model=ReviewDetailResponse, status_code=status.HTTP_201_CREATED)
def create_review(payload: ReviewCreate, db: DB, current_user: CurrentUser) -> ReviewDetailResponse:
    """Create a review for a completed booking (customer only)."""
    booking = db.query(Booking).filter(Booking.id == payload.booking_id).first()
    if not booking:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if booking.customer_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking")
    if booking.status != BookingStatus.COMPLETED:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Can only review completed bookings")

    existing = db.query(Review).filter(Review.booking_id == payload.booking_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Review already exists for this booking")

    review = Review(
        booking_id=payload.booking_id,
        customer_id=current_user.id,
        provider_id=booking.provider_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    # Update provider aggregate rating
    _update_provider_rating(db, booking.provider_id)

    return _enrich(review)


@router.put("/{review_id}", response_model=ReviewDetailResponse)
def update_review(
    review_id: int, payload: ReviewUpdate, db: DB, current_user: CurrentUser
) -> ReviewDetailResponse:
    """Update a review (author only)."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.customer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your review")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(review, field, value)
    db.commit()
    db.refresh(review)

    _update_provider_rating(db, review.provider_id)
    return _enrich(review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db: DB, current_user: CurrentUser) -> None:
    """Delete a review (author or admin)."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found")
    if review.customer_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your review")

    provider_id = review.provider_id
    db.delete(review)
    db.commit()
    _update_provider_rating(db, provider_id)


def _update_provider_rating(db: Session, provider_user_id: int) -> None:
    """Recalculate average rating for a provider."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == provider_user_id).first()
    if not profile:
        return
    result = db.query(
        func.avg(Review.rating), func.count(Review.id)
    ).filter(Review.provider_id == provider_user_id).first()
    profile.average_rating = round(float(result[0]), 2) if result[0] else 0.0
    profile.total_reviews = result[1] or 0
    db.commit()
