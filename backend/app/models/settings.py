"""Application settings model."""

from typing import TYPE_CHECKING

from sqlalchemy import Boolean, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class AppSettings(Base):
    """User-specific application settings."""

    __tablename__ = "app_settings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )

    # UI Settings
    theme: Mapped[str] = mapped_column(String(20), default="dark")  # light, dark
    language: Mapped[str] = mapped_column(String(10), default="ru")
    map_provider: Mapped[str] = mapped_column(String(50), default="osm")
    map_style: Mapped[str] = mapped_column(String(50), default="default")

    # Map settings
    map_default_lat: Mapped[float | None] = mapped_column(nullable=True)
    map_default_lng: Mapped[float | None] = mapped_column(nullable=True)
    map_default_zoom: Mapped[int | None] = mapped_column(nullable=True)
    map_clustering: Mapped[bool] = mapped_column(default=True)
    map_show_markers_count: Mapped[bool] = mapped_column(default=True)

    # Parser settings
    parser_delay_min: Mapped[float | None] = mapped_column(nullable=True)
    parser_delay_max: Mapped[float | None] = mapped_column(nullable=True)
    parser_concurrent_pages: Mapped[int | None] = mapped_column(nullable=True)
    parser_auto_save_interval: Mapped[int | None] = mapped_column(
        nullable=True
    )  # seconds
    parser_proxy_enabled: Mapped[bool] = mapped_column(default=False)

    # Visualization settings
    show_photos_in_list: Mapped[bool] = mapped_column(default=True)
    photos_per_row: Mapped[int] = mapped_column(default=4)
    cards_per_page: Mapped[int] = mapped_column(default=20)
    default_sort_field: Mapped[str] = mapped_column(String(50), default="created_at")
    default_sort_order: Mapped[str] = mapped_column(String(10), default="desc")

    # Filters (saved filter presets)
    saved_filters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    # Notification settings
    notifications_enabled: Mapped[bool] = mapped_column(default=True)
    email_notifications: Mapped[bool] = mapped_column(default=False)
    new_properties_notification: Mapped[bool] = mapped_column(default=False)

    # Relationship
    user: Mapped["User"] = relationship("User", back_populates="settings")

    def __repr__(self) -> str:
        return f"<AppSettings(id={self.id}, user_id={self.user_id})>"
