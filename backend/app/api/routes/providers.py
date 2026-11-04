from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import DB, CurrentUser, AdminUser, ProviderOrAdmin
from app.models.provider import ProviderProfile, ProviderAvailability
from app.models.service import Service
from app.models.user import User, UserRole
from app.schemas.provider import (
    ProviderProfileCreate,
    ProviderProfileUpdate,
    ProviderProfileResponse,
    ProviderDetailResponse,
    ProviderAvailabilityCreate,
    ProviderAvailabilityUpdate,
    ProviderAvailabilityResponse,
)

router = APIRouter(prefix="/providers", tags=["Providers"])


# ── Helper ───────────────────────────────────────────────────────────────────

def _build_detail(profile: ProviderProfile) -> ProviderDetailResponse:
    data = ProviderProfileResponse.model_validate(profile).model_dump()
    data["user_name"] = profile.user.full_name if profile.user else None
    data["user_email"] = profile.user.email if profile.user else None
    data["user_phone"] = profile.user.phone if profile.user else None
    data["services"] = [
        {"id": s.id, "name": s.name, "base_price": s.base_price}
        for s in profile.services
    ]
    data["availability"] = [
        ProviderAvailabilityResponse.model_validate(a).model_dump()
        for a in profile.availability_slots
    ]
    return ProviderDetailResponse(**data)


# ── Profile CRUD ─────────────────────────────────────────────────────────────

@router.get("", response_model=list[ProviderDetailResponse])
def list_providers(
    db: DB,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    service_area: str | None = None,
    verified_only: bool = False,
) -> list[ProviderDetailResponse]:
    """List provider profiles (public)."""
    query = db.query(ProviderProfile)
    if service_area:
        query = query.filter(ProviderProfile.service_area.ilike(f"%{service_area}%"))
    if verified_only:
        query = query.filter(ProviderProfile.is_verified == True)
    profiles = query.offset(skip).limit(limit).all()
    return [_build_detail(p) for p in profiles]


@router.get("/me", response_model=ProviderDetailResponse)
def get_my_profile(current_user: CurrentUser, db: DB) -> ProviderDetailResponse:
    """Get the current provider's own profile."""
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a provider account")
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider profile not found")
    return _build_detail(profile)


@router.get("/{provider_id}", response_model=ProviderDetailResponse)
def get_provider(provider_id: int, db: DB) -> ProviderDetailResponse:
    """Get a provider profile by ID (public)."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    return _build_detail(profile)


@router.post("", response_model=ProviderDetailResponse, status_code=status.HTTP_201_CREATED)
def create_provider_profile(
    payload: ProviderProfileCreate, current_user: CurrentUser, db: DB
) -> ProviderDetailResponse:
    """Create a provider profile for the current user (must be provider role)."""
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only providers can create a profile")
    existing = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Profile already exists")

    service_ids = payload.service_ids
    profile = ProviderProfile(
        user_id=current_user.id,
        business_name=payload.business_name,
        bio=payload.bio,
        experience_years=payload.experience_years,
        hourly_rate=payload.hourly_rate,
        service_area=payload.service_area,
    )
    if service_ids:
        services = db.query(Service).filter(Service.id.in_(service_ids)).all()
        profile.services = services
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return _build_detail(profile)


@router.put("/me", response_model=ProviderDetailResponse)
def update_my_profile(
    payload: ProviderProfileUpdate, current_user: CurrentUser, db: DB
) -> ProviderDetailResponse:
    """Update the current provider's profile."""
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a provider account")
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found. Create one first.")
    update_data = payload.model_dump(exclude_unset=True)
    service_ids = update_data.pop("service_ids", None)
    # Only admin can change is_verified
    if "is_verified" in update_data and current_user.role != UserRole.ADMIN:
        update_data.pop("is_verified")
    for field, value in update_data.items():
        setattr(profile, field, value)
    if service_ids is not None:
        services = db.query(Service).filter(Service.id.in_(service_ids)).all()
        profile.services = services
    db.commit()
    db.refresh(profile)
    return _build_detail(profile)


@router.put("/{provider_id}", response_model=ProviderDetailResponse)
def admin_update_provider(
    provider_id: int, payload: ProviderProfileUpdate, db: DB, admin: AdminUser
) -> ProviderDetailResponse:
    """Admin update a provider profile (e.g., verify)."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    update_data = payload.model_dump(exclude_unset=True)
    service_ids = update_data.pop("service_ids", None)
    for field, value in update_data.items():
        setattr(profile, field, value)
    if service_ids is not None:
        services = db.query(Service).filter(Service.id.in_(service_ids)).all()
        profile.services = services
    db.commit()
    db.refresh(profile)
    return _build_detail(profile)


# ── Availability ─────────────────────────────────────────────────────────────

@router.get("/me/availability", response_model=list[ProviderAvailabilityResponse])
def list_my_availability(current_user: CurrentUser, db: DB) -> list[ProviderAvailabilityResponse]:
    """List the current provider's availability slots."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return [ProviderAvailabilityResponse.model_validate(a) for a in profile.availability_slots]


@router.get("/{provider_id}/availability", response_model=list[ProviderAvailabilityResponse])
def list_provider_availability(provider_id: int, db: DB) -> list[ProviderAvailabilityResponse]:
    """List a provider's availability slots (public)."""
    profile = db.query(ProviderProfile).filter(ProviderProfile.id == provider_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    return [ProviderAvailabilityResponse.model_validate(a) for a in profile.availability_slots]


@router.post("/me/availability", response_model=ProviderAvailabilityResponse, status_code=status.HTTP_201_CREATED)
def add_availability(
    payload: ProviderAvailabilityCreate, current_user: CurrentUser, db: DB
) -> ProviderAvailabilityResponse:
    """Add an availability slot for the current provider."""
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a provider account")
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    slot = ProviderAvailability(
        provider_id=profile.id,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        is_available=payload.is_available,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return ProviderAvailabilityResponse.model_validate(slot)


@router.put("/me/availability/{slot_id}", response_model=ProviderAvailabilityResponse)
def update_availability(
    slot_id: int, payload: ProviderAvailabilityUpdate, current_user: CurrentUser, db: DB
) -> ProviderAvailabilityResponse:
    """Update an availability slot."""
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a provider account")
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    slot = db.query(ProviderAvailability).filter(
        ProviderAvailability.id == slot_id,
        ProviderAvailability.provider_id == profile.id,
    ).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(slot, field, value)
    db.commit()
    db.refresh(slot)
    return ProviderAvailabilityResponse.model_validate(slot)


@router.delete("/me/availability/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability(slot_id: int, current_user: CurrentUser, db: DB) -> None:
    """Delete an availability slot."""
    if current_user.role != UserRole.PROVIDER:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not a provider account")
    profile = db.query(ProviderProfile).filter(ProviderProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    slot = db.query(ProviderAvailability).filter(
        ProviderAvailability.id == slot_id,
        ProviderAvailability.provider_id == profile.id,
    ).first()
    if not slot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found")
    db.delete(slot)
    db.commit()
