from datetime import datetime, time
from typing import Optional

from pydantic import BaseModel, Field


# --- Provider Profile ---

class ProviderProfileCreate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)
    hourly_rate: Optional[float] = Field(None, ge=0)
    service_area: Optional[str] = None
    service_ids: list[int] = []


class ProviderProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = Field(None, ge=0)
    hourly_rate: Optional[float] = Field(None, ge=0)
    service_area: Optional[str] = None
    is_verified: Optional[bool] = None
    service_ids: Optional[list[int]] = None


class ProviderProfileResponse(BaseModel):
    id: int
    user_id: int
    business_name: Optional[str] = None
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    hourly_rate: Optional[float] = None
    service_area: Optional[str] = None
    is_verified: bool
    average_rating: float
    total_reviews: int
    total_bookings: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProviderDetailResponse(ProviderProfileResponse):
    user_name: Optional[str] = None
    user_email: Optional[str] = None
    user_phone: Optional[str] = None
    services: list[dict] = []
    availability: list[dict] = []


# --- Availability ---

class ProviderAvailabilityCreate(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6)
    start_time: time
    end_time: time
    is_available: bool = True


class ProviderAvailabilityUpdate(BaseModel):
    day_of_week: Optional[int] = Field(None, ge=0, le=6)
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    is_available: Optional[bool] = None


class ProviderAvailabilityResponse(BaseModel):
    id: int
    provider_id: int
    day_of_week: int
    start_time: time
    end_time: time
    is_available: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
