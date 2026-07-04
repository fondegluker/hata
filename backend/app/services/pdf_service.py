"""PDF export service."""

import io
from datetime import datetime
from typing import Any

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    Image,
    PageBreak,
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT

from app.models.property import Property


class PDFService:
    """Service for generating PDF documents."""

    def __init__(self):
        self.page_width, self.page_height = A4
        self.margin = 1.5 * cm

    async def generate_property_card(self, prop: Property) -> io.BytesIO:
        """Generate PDF card for a single property."""
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="TitleCustom",
            parent=styles["Heading1"],
            fontSize=16,
            spaceAfter=20,
        ))
        styles.add(ParagraphStyle(
            name="SubTitle",
            parent=styles["Heading2"],
            fontSize=12,
            spaceAfter=10,
        ))
        styles.add(ParagraphStyle(
            name="BodyTextCustom",
            parent=styles["BodyText"],
            fontSize=10,
            spaceAfter=6,
        ))

        elements = []

        # Title
        elements.append(Paragraph(f"Карточка объекта недвижимости", styles["TitleCustom"]))
        elements.append(Paragraph(prop.title, styles["SubTitle"]))
        elements.append(Spacer(1, 10))

        # Property details table
        data = [
            ["Параметр", "Значение"],
            ["ID", str(prop.external_id)],
            ["Тип недвижимости", prop.property_type],
            ["Тип продажи", prop.sale_type],
            ["Статус", prop.status],
        ]

        if prop.region:
            data.append(["Регион", prop.region])
        if prop.city:
            data.append(["Город", prop.city])
        if prop.address:
            data.append(["Адрес", prop.address])
        if prop.total_area:
            data.append(["Площадь", f"{prop.total_area} кв.м"])
        if prop.rooms:
            data.append(["Комнат", str(prop.rooms)])
        if prop.floor:
            data.append(["Этаж", str(prop.floor)])
        if prop.floors:
            data.append(["Этажей", str(prop.floors)])
        if prop.year_built:
            data.append(["Год постройки", str(prop.year_built)])
        if prop.price:
            data.append(["Цена", f"{prop.price:,.2f} {prop.currency}"])
        if prop.starting_price:
            data.append(["Начальная цена", f"{prop.starting_price:,.2f} {prop.currency}"])

        if prop.auction_start:
            data.append(["Начало аукциона", prop.auction_start.strftime("%Y-%m-%d %H:%M")])
        if prop.auction_end:
            data.append(["Окончание аукциона", prop.auction_end.strftime("%Y-%m-%d %H:%M")])

        if prop.seller_name:
            data.append(["Продавец", prop.seller_name])
        if prop.seller_phone:
            data.append(["Телефон", prop.seller_phone])

        table = Table(data, colWidths=[5 * cm, 10 * cm])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4472C4")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ALIGN", (0, 0), (-1, -1), "LEFT"),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#F2F2F2")),
            ("GRID", (0, 0), (-1, -1), 1, colors.HexColor("#CCCCCC")),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ]))

        elements.append(table)
        elements.append(Spacer(1, 20))

        # Description
        if prop.description:
            elements.append(Paragraph("Описание", styles["SubTitle"]))
            elements.append(Paragraph(prop.description[:1000], styles["BodyTextCustom"]))
            elements.append(Spacer(1, 20))

        # Source URL
        if prop.source_url:
            elements.append(Paragraph("Источник:", styles["BodyTextCustom"]))
            elements.append(Paragraph(prop.source_url, styles["BodyTextCustom"]))

        # Footer
        elements.append(Spacer(1, 30))
        elements.append(Paragraph(
            f"Сгенерировано: {datetime.now().strftime('%Y-%m-%d %H:%M')} | Hata",
            ParagraphStyle(name="Footer", fontSize=8, textColor=colors.grey),
        ))

        doc.build(elements)
        buffer.seek(0)

        return buffer

    async def generate_properties_catalog(self, properties: list[Property]) -> io.BytesIO:
        """Generate PDF catalog for multiple properties."""
        buffer = io.BytesIO()

        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=self.margin,
            rightMargin=self.margin,
            topMargin=self.margin,
            bottomMargin=self.margin,
        )

        styles = getSampleStyleSheet()

        elements = []

        # Title page
        elements.append(Spacer(1, 3 * cm))
        elements.append(Paragraph("Каталог недвижимости", styles["Heading1"]))
        elements.append(Spacer(1, 1 * cm))
        elements.append(Paragraph(
            f"Дата формирования: {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            styles["BodyText"],
        ))
        elements.append(Paragraph(f"Количество объектов: {len(properties)}", styles["BodyText"]))
        elements.append(PageBreak())

        # Properties
        for i, prop in enumerate(properties, 1):
            elements.append(Paragraph(f"{i}. {prop.title}", styles["Heading2"]))
            elements.append(Spacer(1, 5))

            # Quick info table
            quick_data = [
                ["Тип", prop.property_type],
                ["Регион", prop.region or "Не указан"],
                ["Цена", f"{prop.price:,.2f} {prop.currency}" if prop.price else "Не указана"],
            ]

            if prop.total_area:
                quick_data.append(["Площадь", f"{prop.total_area} кв.м"])
            if prop.rooms:
                quick_data.append(["Комнат", str(prop.rooms)])

            quick_table = Table(quick_data, colWidths=[4 * cm, 8 * cm])
            quick_table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#E7E6E6")),
                ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                ("FONTSIZE", (0, 0), (-1, -1), 9),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ]))

            elements.append(quick_table)

            # Description preview
            if prop.description:
                desc_preview = prop.description[:200] + "..." if len(prop.description) > 200 else prop.description
                elements.append(Spacer(1, 5))
                elements.append(Paragraph(desc_preview, styles["BodyText"]))

            elements.append(Spacer(1, 15))

            # Page break after every 5 properties
            if i % 5 == 0 and i < len(properties):
                elements.append(PageBreak())

        doc.build(elements)
        buffer.seek(0)

        return buffer
