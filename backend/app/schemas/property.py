"""Property schemas for API."""

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class PropertyPhotoBase(BaseModel):
    """Base schema for property photo."""

    original_url: str
    description: str | None = None
    is_main: bool = False


class PropertyPhotoResponse(PropertyPhotoBase):
    """Schema for property photo response."""

    id: int
    property_id: int
    local_path: str | None = None
    order: int
    created_at: datetime

    class Config:
        from_attributes = True


class PropertyBase(BaseModel):
    """Base schema for property."""

    external_id: str
    title: str
    property_type: str
    sale_type: str


class PropertyCreate(PropertyBase):
    """Schema for creating property."""

    source_url: str | None = None
    description: str | None = None

    # Location
    region: str | None = None
    district: str | None = None
    city: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    # Details
    total_area: float | None = None
    living_area: float | None = None
    land_area: float | None = None
    land_area_unit: str | None = None
    rooms: int | None = None
    floors: int | None = None
    floor: int | None = None
    building_type: str | None = None
    year_built: int | None = None
    condition: str | None = None

    # Price
    price: Decimal | None = None
    starting_price: Decimal | None = None
    current_bid: Decimal | None = None
    price_per_sqm: Decimal | None = None
    currency: str = "BYN"

    # Auction
    auction_start: datetime | None = None
    auction_end: datetime | None = None
    auction_status: str | None = None
    bid_count: int | None = None

    # Seller
    seller_name: str | None = None
    seller_phone: str | None = None
    seller_email: str | None = None
    seller_type: str | None = None

    # Status
    status: str = "active"

    # Extra
    extra_data: dict | None = None
    raw_html: str | None = None

    # Photos
    photos: list[PropertyPhotoBase] | None = None


class PropertyUpdate(BaseModel):
    """Schema for updating property."""

    title: str | None = None
    description: str | None = None
    status: str | None = None
    price: Decimal | None = None
    current_bid: Decimal | None = None
    auction_status: str | None = None
    bid_count: int | None = None


class PropertyResponse(PropertyBase):
    """Schema for property response."""

    id: int
    source_url: str | None = None
    description: str | None = None

    # Location
    region: str | None = None
    district: str | None = None
    city: str | None = None
    address: str | None = None
    latitude: float | None = None
    longitude: float | None = None

    # Details
    total_area: float | None = None
    living_area: float | None = None
    land_area: float | None = None
    land_area_unit: str | None = None
    rooms: int | None = None
    floors: int | None = None
    floor: int | None = None
    building_type: str | None = None
    year_built: int | None = None
    condition: str | None = None

    # Price
    price: Decimal | None = None
    starting_price: Decimal | None = None
    current_bid: Decimal | None = None
    price_per_sqm: Decimal | None = None
    currency: str

    # Auction
    auction_start: datetime | None = None
    auction_end: datetime | None = None
    auction_status: str | None = None
    bid_count: int | None = None

    # Seller
    seller_name: str | None = None
    seller_phone: str | None = None
    seller_email: str | None = None
    seller_type: str | None = None

    # Status
    status: str

    # Timestamps
    created_at: datetime
    updated_at: datetime
    parsed_at: datetime | None = None

    # Relationships
    photos: list[PropertyPhotoResponse] = []

    class Config:
        from_attributes = True


class PropertyListResponse(BaseModel):
    """Schema for paginated property list response."""

    items: list[PropertyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PropertyFilter(BaseModel):
    """Schema for property filtering."""

    # Text search
    search: str | None = None

    # Property type
    property_type: list[str] | None = None

    # Sale type
    sale_type: list[str] | None = None

    # Location
    region: list[str] | None = None
    city: list[str] | None = None

    # Area
    min_area: float | None = None
    max_area: float | None = None

    # Rooms
    min_rooms: int | None = None
    max_rooms: int | None = None

    # Price
    min_price: Decimal | None = None
    max_price: Decimal | None = None

    # Auction
    auction_status: list[str] | None = None

    # Status
    status: list[str] | None = None

    # Has coordinates (for map)
    has_coordinates: bool | None = None

    # Date range
    parsed_after: datetime | None = None
    parsed_before: datetime | None = None

    # Sorting
    sort_by: str = "created_at"
    sort_order: str = "desc"

    # Pagination
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
