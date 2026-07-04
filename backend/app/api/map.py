"""Map API routes for markers."""

from fastapi import APIRouter
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import CurrentUser, DBSession
from app.models.property import Property

router = APIRouter()


@router.get("/markers")
async def get_markers(
    current_user: CurrentUser,
    db: DBSession,
    region: list[str] | None = None,
    property_type: list[str] | None = None,
    sale_type: list[str] | None = None,
    min_price: float | None = None,
    max_price: float | None = None,
) -> list[dict]:
    """Get all property markers for map display."""
    query = select(Property).where(
        Property.latitude.isnot(None),
        Property.longitude.isnot(None),
    )

    # Apply filters
    if region:
        query = query.where(Property.region.in_(region))

    if property_type:
        query = query.where(Property.property_type.in_(property_type))

    if sale_type:
        query = query.where(Property.sale_type.in_(sale_type))

    if min_price is not None:
        query = query.where(Property.price >= min_price)

    if max_price is not None:
        query = query.where(Property.price <= max_price)

    result = await db.execute(query)
    properties = result.scalars().all()

    # Build markers
    markers = []
    for prop in properties:
        # Get main photo
        main_photo = None
        if prop.photos:
            for photo in prop.photos:
                if photo.is_main:
                    main_photo = photo.local_path or photo.original_url
                    break
            if not main_photo and prop.photos:
                main_photo = prop.photos[0].local_path or prop.photos[0].original_url

        markers.append({
            "id": prop.id,
            "external_id": prop.external_id,
            "title": prop.title,
            "lat": float(prop.latitude),
            "lng": float(prop.longitude),
            "price": float(prop.price) if prop.price else None,
            "currency": prop.currency,
            "property_type": prop.property_type,
            "sale_type": prop.sale_type,
            "city": prop.city,
            "address": prop.address,
            "total_area": float(prop.total_area) if prop.total_area else None,
            "rooms": prop.rooms,
            "main_photo": main_photo,
            "status": prop.status,
        })

    return markers


@router.get("/bounds")
async def get_bounds(
    current_user: CurrentUser,
    db: DBSession,
) -> dict:
    """Get bounds of all properties for initial map view."""
    from sqlalchemy import func

    result = await db.execute(
        select(
            func.min(Property.latitude).label("min_lat"),
            func.max(Property.latitude).label("max_lat"),
            func.min(Property.longitude).label("min_lng"),
            func.max(Property.longitude).label("max_lng"),
        ).where(
            Property.latitude.isnot(None),
            Property.longitude.isnot(None),
        )
    )
    bounds = result.one()

    if bounds.min_lat is None:
        # Return default bounds for Belarus
        from app.config import get_settings
        settings = get_settings()
        return {
            "center": {
                "lat": settings.map_default_lat,
                "lng": settings.map_default_lng,
            },
            "zoom": settings.map_default_zoom,
        }

    return {
        "min_lat": float(bounds.min_lat),
        "max_lat": float(bounds.max_lat),
        "min_lng": float(bounds.min_lng),
        "max_lng": float(bounds.max_lng),
    }
