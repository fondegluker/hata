"""Properties API routes."""

from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import select, func, or_, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DBSession
from app.models.property import Property, PropertyPhoto
from app.schemas.property import (
    PropertyCreate,
    PropertyFilter,
    PropertyListResponse,
    PropertyResponse,
    PropertyUpdate,
)

router = APIRouter()


@router.get("/", response_model=PropertyListResponse)
async def list_properties(
    current_user: CurrentUser,
    db: DBSession,
    search: str | None = Query(None),
    property_type: list[str] | None = Query(None),
    sale_type: list[str] | None = Query(None),
    region: list[str] | None = Query(None),
    city: list[str] | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
    min_area: float | None = Query(None),
    max_area: float | None = Query(None),
    min_rooms: int | None = Query(None),
    max_rooms: int | None = Query(None),
    status: list[str] | None = Query(None),
    has_coordinates: bool | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
) -> PropertyListResponse:
    """List properties with filtering and pagination."""
    # Base query
    query = select(Property).options(selectinload(Property.photos))

    # Apply filters
    conditions = []

    if search:
        search_ilike = f"%{search}%"
        conditions.append(
            or_(
                Property.title.ilike(search_ilike),
                Property.description.ilike(search_ilike),
                Property.address.ilike(search_ilike),
                Property.city.ilike(search_ilike),
            )
        )

    if property_type:
        conditions.append(Property.property_type.in_(property_type))

    if sale_type:
        conditions.append(Property.sale_type.in_(sale_type))

    if region:
        conditions.append(Property.region.in_(region))

    if city:
        conditions.append(Property.city.in_(city))

    if min_price is not None:
        conditions.append(Property.price >= min_price)

    if max_price is not None:
        conditions.append(Property.price <= max_price)

    if min_area is not None:
        conditions.append(Property.total_area >= min_area)

    if max_area is not None:
        conditions.append(Property.total_area <= max_area)

    if min_rooms is not None:
        conditions.append(Property.rooms >= min_rooms)

    if max_rooms is not None:
        conditions.append(Property.rooms <= max_rooms)

    if status:
        conditions.append(Property.status.in_(status))

    if has_coordinates is not None:
        if has_coordinates:
            conditions.append(Property.latitude.isnot(None))
            conditions.append(Property.longitude.isnot(None))
        else:
            conditions.append(
                or_(Property.latitude.is_(None), Property.longitude.is_(None))
            )

    if conditions:
        query = query.where(and_(*conditions))

    # Count total
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Apply sorting
    sort_column = getattr(Property, sort_by, Property.created_at)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    # Execute query
    result = await db.execute(query)
    properties = list(result.scalars().all())

    # Calculate total pages
    total_pages = (total + page_size - 1) // page_size

    return PropertyListResponse(
        items=properties,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/regions", response_model=list[str])
async def get_regions(current_user: CurrentUser, db: DBSession) -> list[str]:
    """Get list of unique regions."""
    result = await db.execute(
        select(Property.region)
        .distinct()
        .where(Property.region.isnot(None))
        .order_by(Property.region)
    )
    return [r for r in result.scalars().all() if r]


@router.get("/cities", response_model=list[str])
async def get_cities(
    current_user: CurrentUser,
    db: DBSession,
    region: str | None = Query(None),
) -> list[str]:
    """Get list of unique cities, optionally filtered by region."""
    query = select(Property.city).distinct().where(Property.city.isnot(None))

    if region:
        query = query.where(Property.region == region)

    query = query.order_by(Property.city)
    result = await db.execute(query)
    return [c for c in result.scalars().all() if c]


@router.get("/property-types", response_model=list[str])
async def get_property_types(current_user: CurrentUser, db: DBSession) -> list[str]:
    """Get list of unique property types."""
    result = await db.execute(
        select(Property.property_type)
        .distinct()
        .order_by(Property.property_type)
    )
    return list(result.scalars().all())


@router.get("/{property_id}", response_model=PropertyResponse)
async def get_property(
    property_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> Property:
    """Get property by ID."""
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.photos))
        .where(Property.id == property_id)
    )
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    return prop


@router.post("/", response_model=PropertyResponse, status_code=status.HTTP_201_CREATED)
async def create_property(
    property_data: PropertyCreate,
    db: DBSession,
) -> Property:
    """Create a new property (used by parser)."""
    # Check if external_id already exists
    result = await db.execute(
        select(Property).where(Property.external_id == property_data.external_id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Property with this external_id already exists",
        )

    # Create property
    property_dict = property_data.model_dump(exclude={"photos"})
    prop = Property(**property_dict)

    # Add photos if provided
    if property_data.photos:
        for i, photo in enumerate(property_data.photos):
            prop_photo = PropertyPhoto(
                original_url=photo.original_url,
                description=photo.description,
                is_main=photo.is_main,
                order=i,
            )
            prop.photos.append(prop_photo)

    db.add(prop)
    await db.commit()
    await db.refresh(prop)

    return prop


@router.patch("/{property_id}", response_model=PropertyResponse)
async def update_property(
    property_id: int,
    update_data: PropertyUpdate,
    db: DBSession,
) -> Property:
    """Update property (used by parser for updates)."""
    result = await db.execute(
        select(Property)
        .options(selectinload(Property.photos))
        .where(Property.id == property_id)
    )
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    update_fields = update_data.model_dump(exclude_unset=True)
    for field, value in update_fields.items():
        setattr(prop, field, value)

    await db.commit()
    await db.refresh(prop)

    return prop


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: int,
    db: DBSession,
) -> None:
    """Delete property."""
    result = await db.execute(select(Property).where(Property.id == property_id))
    prop = result.scalar_one_or_none()

    if not prop:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Property not found",
        )

    await db.delete(prop)
    await db.commit()
