from fastapi import APIRouter, HTTPException, Query, status

from app.api.deps import DB, CurrentUser, AdminUser
from app.models.service import ServiceCategory, Service
from app.models.user import UserRole
from app.schemas.service import (
    ServiceCategoryCreate,
    ServiceCategoryUpdate,
    ServiceCategoryResponse,
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceListResponse,
)

router = APIRouter(prefix="/services", tags=["Services"])


# ── Categories ───────────────────────────────────────────────────────────────

@router.get("/categories", response_model=list[ServiceCategoryResponse])
def list_categories(db: DB) -> list[ServiceCategoryResponse]:
    """List all active service categories (public)."""
    cats = db.query(ServiceCategory).filter(ServiceCategory.is_active == True).order_by(ServiceCategory.name).all()
    return [ServiceCategoryResponse.model_validate(c) for c in cats]


@router.post("/categories", response_model=ServiceCategoryResponse, status_code=status.HTTP_201_CREATED)
def create_category(payload: ServiceCategoryCreate, db: DB, admin: AdminUser) -> ServiceCategoryResponse:
    """Create a service category (admin only)."""
    existing = db.query(ServiceCategory).filter(ServiceCategory.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")
    cat = ServiceCategory(**payload.model_dump())
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return ServiceCategoryResponse.model_validate(cat)


@router.put("/categories/{category_id}", response_model=ServiceCategoryResponse)
def update_category(
    category_id: int, payload: ServiceCategoryUpdate, db: DB, admin: AdminUser
) -> ServiceCategoryResponse:
    """Update a service category (admin only)."""
    cat = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    db.commit()
    db.refresh(cat)
    return ServiceCategoryResponse.model_validate(cat)


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: DB, admin: AdminUser) -> None:
    """Delete a service category (admin only)."""
    cat = db.query(ServiceCategory).filter(ServiceCategory.id == category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(cat)
    db.commit()


# ── Services ─────────────────────────────────────────────────────────────────

@router.get("", response_model=ServiceListResponse)
def list_services(
    db: DB,
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    category_id: int | None = None,
    is_active: bool | None = True,
) -> ServiceListResponse:
    """List services (public)."""
    query = db.query(Service)
    if category_id:
        query = query.filter(Service.category_id == category_id)
    if is_active is not None:
        query = query.filter(Service.is_active == is_active)
    total = query.count()
    services = query.order_by(Service.name).offset(skip).limit(limit).all()
    return ServiceListResponse(
        services=[ServiceResponse.model_validate(s) for s in services],
        total=total,
    )


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: int, db: DB) -> ServiceResponse:
    """Get a service by ID (public)."""
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    return ServiceResponse.model_validate(svc)


@router.post("", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service(payload: ServiceCreate, db: DB, admin: AdminUser) -> ServiceResponse:
    """Create a service (admin only)."""
    cat = db.query(ServiceCategory).filter(ServiceCategory.id == payload.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    svc = Service(**payload.model_dump())
    db.add(svc)
    db.commit()
    db.refresh(svc)
    return ServiceResponse.model_validate(svc)


@router.put("/{service_id}", response_model=ServiceResponse)
def update_service(service_id: int, payload: ServiceUpdate, db: DB, admin: AdminUser) -> ServiceResponse:
    """Update a service (admin only)."""
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(svc, field, value)
    db.commit()
    db.refresh(svc)
    return ServiceResponse.model_validate(svc)


@router.delete("/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(service_id: int, db: DB, admin: AdminUser) -> None:
    """Delete a service (admin only)."""
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service not found")
    db.delete(svc)
    db.commit()
