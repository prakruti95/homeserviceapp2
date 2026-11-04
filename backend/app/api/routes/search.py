from fastapi import APIRouter, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.api.deps import DB
from app.models.service import Service, ServiceCategory
from app.models.provider import ProviderProfile
from app.schemas.service import ServiceResponse
from app.schemas.provider import ProviderProfileResponse

router = APIRouter(prefix="/search", tags=["Search"])


@router.get("/services", response_model=list[ServiceResponse])
def search_services(
    db: DB,
    q: str = Query("", min_length=0, description="Search query"),
    category_id: int | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[ServiceResponse]:
    """Search services by name, description, or category."""
    query = db.query(Service).filter(Service.is_active == True)

    if q:
        query = query.join(ServiceCategory).filter(
            or_(
                Service.name.ilike(f"%{q}%"),
                Service.description.ilike(f"%{q}%"),
                ServiceCategory.name.ilike(f"%{q}%"),
            )
        )
    if category_id:
        query = query.filter(Service.category_id == category_id)
    if min_price is not None:
        query = query.filter(Service.base_price >= min_price)
    if max_price is not None:
        query = query.filter(Service.base_price <= max_price)

    services = query.order_by(Service.name).offset(skip).limit(limit).all()
    return [ServiceResponse.model_validate(s) for s in services]


@router.get("/providers", response_model=list[dict])
def search_providers(
    db: DB,
    q: str = Query("", min_length=0, description="Search query"),
    service_area: str | None = None,
    service_id: int | None = None,
    min_rating: float | None = None,
    verified_only: bool = False,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
) -> list[dict]:
    """Search providers by name, service area, service, or rating."""
    from app.models.user import User

    query = db.query(ProviderProfile).join(User)

    if q:
        query = query.filter(
            or_(
                User.full_name.ilike(f"%{q}%"),
                ProviderProfile.business_name.ilike(f"%{q}%"),
                ProviderProfile.bio.ilike(f"%{q}%"),
            )
        )
    if service_area:
        query = query.filter(ProviderProfile.service_area.ilike(f"%{service_area}%"))
    if min_rating is not None:
        query = query.filter(ProviderProfile.average_rating >= min_rating)
    if verified_only:
        query = query.filter(ProviderProfile.is_verified == True)
    if service_id:
        query = query.filter(ProviderProfile.services.any(id=service_id))

    profiles = query.order_by(ProviderProfile.average_rating.desc()).offset(skip).limit(limit).all()
    return [
        {
            "provider_id": p.id,
            "user_id": p.user_id,
            "name": p.user.full_name if p.user else None,
            "business_name": p.business_name,
            "service_area": p.service_area,
            "average_rating": p.average_rating,
            "total_reviews": p.total_reviews,
            "is_verified": p.is_verified,
            "hourly_rate": p.hourly_rate,
            "experience_years": p.experience_years,
        }
        for p in profiles
    ]
