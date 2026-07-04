"""Export API routes for Excel and PDF."""

from datetime import datetime
from io import BytesIO
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.deps import CurrentUser, DBSession
from app.models.property import Property
from app.services.excel_service import ExcelService
from app.services.pdf_service import PDFService

router = APIRouter()


@router.get("/excel")
async def export_excel(
    current_user: CurrentUser,
    db: DBSession,
    property_ids: Annotated[list[int] | None, Query()] = None,
    region: list[str] | None = Query(None),
    property_type: list[str] | None = Query(None),
    sale_type: list[str] | None = Query(None),
    min_price: float | None = Query(None),
    max_price: float | None = Query(None),
) -> StreamingResponse:
    """Export properties to Excel file."""
    # Build query
    query = select(Property).options(selectinload(Property.photos))

    if property_ids:
        query = query.where(Property.id.in_(property_ids))
    else:
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

    query = query.order_by(Property.created_at.desc())

    result = await db.execute(query)
    properties = list(result.scalars().all())

    if not properties:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No properties found to export",
        )

    # Generate Excel file
    excel_service = ExcelService()
    buffer = await excel_service.generate(properties)

    filename = f"hata_properties_{datetime.now().strftime('%Y%m%d_%H%M%S')}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.get("/pdf/{property_id}")
async def export_property_pdf(
    property_id: int,
    current_user: CurrentUser,
    db: DBSession,
) -> StreamingResponse:
    """Export single property to PDF."""
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

    # Generate PDF
    pdf_service = PDFService()
    buffer = await pdf_service.generate_property_card(prop)

    filename = f"hata_property_{prop.external_id}_{datetime.now().strftime('%Y%m%d')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


@router.post("/pdf/batch")
async def export_properties_pdf_batch(
    current_user: CurrentUser,
    db: DBSession,
    property_ids: list[int],
) -> StreamingResponse:
    """Export multiple properties to a single PDF."""
    if not property_ids:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No property IDs provided",
        )

    if len(property_ids) > 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 50 properties per batch export",
        )

    result = await db.execute(
        select(Property)
        .options(selectinload(Property.photos))
        .where(Property.id.in_(property_ids))
    )
    properties = list(result.scalars().all())

    if not properties:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No properties found",
        )

    # Generate PDF
    pdf_service = PDFService()
    buffer = await pdf_service.generate_properties_catalog(properties)

    filename = f"hata_catalog_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
