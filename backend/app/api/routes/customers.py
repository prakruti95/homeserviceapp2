from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field
from typing import Optional

from app.api.deps import DB, CurrentUser, CustomerUser, AdminUser
from app.models.user import User, Customer, Address, UserRole

router = APIRouter(prefix="/customers", tags=["Customers"])


class AddressCreate(BaseModel):
    label: str = "Home"  # Home, Office, Villa
    street_address: str = Field(..., min_length=3)
    unit_number: Optional[str] = None
    city: str = Field(..., min_length=1)
    state: str = Field(..., min_length=2)
    zip_code: str = Field(..., min_length=3)
    is_default: bool = False


class AddressResponse(BaseModel):
    id: int
    user_id: int
    label: str
    street_address: str
    unit_number: Optional[str] = None
    city: str
    state: str
    zip_code: str
    is_default: bool

    model_config = {"from_attributes": True}


class CustomerProfileResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    phone: Optional[str] = None
    loyalty_points: int
    preferred_payment_method: Optional[str] = None
    addresses: list[AddressResponse]


@router.get("/me", response_model=CustomerProfileResponse)
def get_my_customer_profile(db: DB, customer_user: CustomerUser) -> CustomerProfileResponse:
    """Retrieve the current customer's profile and saved addresses."""
    profile = db.query(Customer).filter(Customer.user_id == customer_user.id).first()
    loyalty = profile.loyalty_points if profile else 0
    pref_pay = profile.preferred_payment_method if profile else "credit_card"
    addresses = db.query(Address).filter(Address.user_id == customer_user.id).all()

    return CustomerProfileResponse(
        user_id=customer_user.id,
        full_name=customer_user.full_name,
        email=customer_user.email,
        phone=customer_user.phone,
        loyalty_points=loyalty,
        preferred_payment_method=pref_pay,
        addresses=[AddressResponse.model_validate(a) for a in addresses],
    )


@router.get("/me/addresses", response_model=list[AddressResponse])
def list_my_addresses(db: DB, customer_user: CustomerUser) -> list[AddressResponse]:
    """List saved addresses for the customer."""
    addrs = db.query(Address).filter(Address.user_id == customer_user.id).all()
    return [AddressResponse.model_validate(a) for a in addrs]


@router.post("/me/addresses", response_model=AddressResponse, status_code=status.HTTP_201_CREATED)
def add_address(payload: AddressCreate, db: DB, customer_user: CustomerUser) -> AddressResponse:
    """Add a new address to the customer's account."""
    if payload.is_default:
        db.query(Address).filter(Address.user_id == customer_user.id).update({"is_default": False})

    addr = Address(
        user_id=customer_user.id,
        label=payload.label,
        street_address=payload.street_address,
        unit_number=payload.unit_number,
        city=payload.city,
        state=payload.state,
        zip_code=payload.zip_code,
        is_default=payload.is_default,
    )
    db.add(addr)
    db.commit()
    db.refresh(addr)
    return AddressResponse.model_validate(addr)


@router.delete("/me/addresses/{address_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_address(address_id: int, db: DB, customer_user: CustomerUser) -> None:
    """Delete a saved address."""
    addr = db.query(Address).filter(Address.id == address_id, Address.user_id == customer_user.id).first()
    if not addr:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Address not found")
    db.delete(addr)
    db.commit()


@router.get("", response_model=list[dict])
def list_all_customers(db: DB, admin: AdminUser) -> list[dict]:
    """Admin view of all customer accounts."""
    customers = db.query(User).filter(User.role == UserRole.CUSTOMER).all()
    return [
        {
            "id": c.id,
            "full_name": c.full_name,
            "email": c.email,
            "phone": c.phone,
            "city": c.city,
            "is_active": c.is_active,
            "created_at": c.created_at,
        }
        for c in customers
    ]
