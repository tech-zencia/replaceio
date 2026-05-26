from pydantic import BaseModel
from typing import Optional, List, Any
from enum import Enum


class PropertyType(str, Enum):
    flat = "flat"
    house = "house"
    villa = "villa"
    plot = "plot"
    commercial = "commercial"
    pg = "pg"


class ListingType(str, Enum):
    sale = "sale"
    rent = "rent"


class FurnishingStatus(str, Enum):
    furnished = "furnished"
    semi_furnished = "semi_furnished"
    unfurnished = "unfurnished"


class PossessionStatus(str, Enum):
    ready_to_move = "ready_to_move"
    under_construction = "under_construction"


class PropertyStatus(str, Enum):
    active = "active"
    inactive = "inactive"
    sold = "sold"
    rented = "rented"


class CreatePropertyRequest(BaseModel):
    title: str
    description: Optional[str] = None
    property_type: PropertyType
    listing_type: ListingType
    address: str
    city: str
    locality: str
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: float
    area_sqft: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_number: Optional[int] = None
    furnishing_status: Optional[FurnishingStatus] = None
    possession_status: Optional[PossessionStatus] = None
    property_age_years: Optional[int] = None
    amenities: Optional[List[str]] = []


class UpdatePropertyRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    property_type: Optional[PropertyType] = None
    listing_type: Optional[ListingType] = None
    address: Optional[str] = None
    city: Optional[str] = None
    locality: Optional[str] = None
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: Optional[float] = None
    area_sqft: Optional[float] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_number: Optional[int] = None
    furnishing_status: Optional[FurnishingStatus] = None
    possession_status: Optional[PossessionStatus] = None
    property_age_years: Optional[int] = None
    amenities: Optional[List[str]] = None
    status: Optional[PropertyStatus] = None


class PropertyResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    property_type: str
    listing_type: str
    status: str
    address: str
    city: str
    locality: str
    pincode: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    price: float
    area_sqft: float
    bedrooms: Optional[int] = None
    bathrooms: Optional[int] = None
    floor_number: Optional[int] = None
    furnishing_status: Optional[str] = None
    possession_status: Optional[str] = None
    property_age_years: Optional[int] = None
    amenities: Optional[List[str]] = []
    source: Optional[str] = "platform"
    media: Optional[List[Any]] = []
    seller: Optional[Any] = None
    created_at: Optional[str] = None
