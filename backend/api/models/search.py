from pydantic import BaseModel
from typing import Optional, List, Any


class SearchRequest(BaseModel):
    query: str
    page: int = 1
    limit: int = 20


class SearchFilters(BaseModel):
    city: Optional[str] = None
    state_code: Optional[str] = None
    postal_code: Optional[str] = None
    locality: Optional[str] = None
    property_type: Optional[str] = None
    listing_type: Optional[str] = None
    bedrooms: Optional[int] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    min_area: Optional[float] = None
    max_area: Optional[float] = None
    furnishing_status: Optional[str] = None
    amenities: Optional[List[str]] = None


class SearchResult(BaseModel):
    properties: List[Any]
    filters_detected: SearchFilters
    ai_summary: Optional[str] = None
    total: int
    page: int
    limit: int
