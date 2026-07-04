"""Property model for real estate objects."""

from datetime import datetime
from decimal import Decimal
from typing import TYPE_CHECKING

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class Property(Base):
    """Real estate property model."""

    __tablename__ = "properties"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)

    # External ID from source
    external_id: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Basic info
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Property type
    property_type: Mapped[str] = mapped_column(
        String(50), index=True
    )  # house, apartment, commercial, land

    # Sale type
    sale_type: Mapped[str] = mapped_column(
        String(50), index=True
    )  # auction, direct_sale

    # Location
    region: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    district: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), index=True, nullable=True)
    address: Mapped[str | None] = mapped_column(String(500), nullable=True)
    latitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)
    longitude: Mapped[float | None] = mapped_column(Numeric(10, 7), nullable=True)

    # Property details
    total_area: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    living_area: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    land_area: Mapped[float | None] = mapped_column(Numeric(10, 2), nullable=True)
    land_area_unit: Mapped[str | None] = mapped_column(String(20), nullable=True)
    rooms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    floors: Mapped[int | None] = mapped_column(Integer, nullable=True)
    floor: Mapped[int | None] = mapped_column(Integer, nullable=True)
    building_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    year_built: Mapped[int | None] = mapped_column(Integer, nullable=True)
    condition: Mapped[str | None] = mapped_column(String(100), nullable=True)

    # Price
    price: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    starting_price: Mapped[Decimal | None] = mapped_column(
        Numeric(15, 2), nullable=True
    )
    current_bid: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    price_per_sqm: Mapped[Decimal | None] = mapped_column(Numeric(15, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(10), default="BYN")

    # Auction details
    auction_start: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    auction_end: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    auction_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    bid_count: Mapped[int | None] = mapped_column(Integer, default=0)

    # Seller info
    seller_name: Mapped[str | None] = mapped_column(String(500), nullable=True)
    seller_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    seller_email: Mapped[str | None] = mapped_column(String(100), nullable=True)
    seller_type: Mapped[str | None] = mapped_column(String(50), nullable=True)

    # Status
    status: Mapped[str] = mapped_column(
        String(50), default="active", index=True
    )  # active, sold, withdrawn

    # Additional data as JSON
    extra_data: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Raw HTML for reference (optional, can be null to save space)
    raw_html: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    parsed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Relationships
    photos: Mapped[list["PropertyPhoto"]] = relationship(
        "PropertyPhoto", back_populates="property", cascade="all, delete-orphan"
    )
    documents: Mapped[list["PropertyDocument"]] = relationship(
        "PropertyDocument", back_populates="property", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Property(id={self.id}, external_id={self.external_id}, title={self.title[:50]}...)>"


class PropertyPhoto(Base):
    """Property photo model."""

    __tablename__ = "property_photos"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    property_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )

    # Photo URLs
    original_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    local_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Photo metadata
    filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    width: Mapped[int | None] = mapped_column(Integer, nullable=True)
    height: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Order and description
    order: Mapped[int] = mapped_column(Integer, default=0)
    description: Mapped[str | None] = mapped_column(String(500), nullable=True)
    is_main: Mapped[bool] = mapped_column(Boolean, default=False)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    property: Mapped["Property"] = relationship("Property", back_populates="photos")

    def __repr__(self) -> str:
        return f"<PropertyPhoto(id={self.id}, property_id={self.property_id})>"


class PropertyDocument(Base):
    """Property document model."""

    __tablename__ = "property_documents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    property_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("properties.id", ondelete="CASCADE"), nullable=False
    )

    # Document info
    name: Mapped[str] = mapped_column(String(500), nullable=False)
    document_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    original_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    local_path: Mapped[str | None] = mapped_column(String(500), nullable=True)

    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationship
    property: Mapped["Property"] = relationship("Property", back_populates="documents")

    def __repr__(self) -> str:
        return f"<PropertyDocument(id={self.id}, name={self.name})>"
