"""Settings schemas for user preferences."""

from pydantic import BaseModel


class SettingsBase(BaseModel):
    """Base settings schema."""

    # UI Settings
    theme: str = "dark"
    language: str = "ru"
    map_provider: str = "osm"
    map_style: str = "default"

    # Map settings
    map_default_lat: float | None = None
    map_default_lng: float | None = None
    map_default_zoom: int | None = None
    map_clustering: bool = True
    map_show_markers_count: bool = True

    # Parser settings
    parser_delay_min: float | None = None
    parser_delay_max: float | None = None
    parser_concurrent_pages: int | None = None
    parser_auto_save_interval: int | None = None
    parser_proxy_enabled: bool = False

    # Visualization settings
    show_photos_in_list: bool = True
    photos_per_row: int = 4
    cards_per_page: int = 20
    default_sort_field: str = "created_at"
    default_sort_order: str = "desc"

    # Notification settings
    notifications_enabled: bool = True
    email_notifications: bool = False
    new_properties_notification: bool = False


class SettingsUpdate(BaseModel):
    """Schema for updating settings."""

    theme: str | None = None
    language: str | None = None
    map_provider: str | None = None
    map_style: str | None = None

    map_default_lat: float | None = None
    map_default_lng: float | None = None
    map_default_zoom: int | None = None
    map_clustering: bool | None = None
    map_show_markers_count: bool | None = None

    parser_delay_min: float | None = None
    parser_delay_max: float | None = None
    parser_concurrent_pages: int | None = None
    parser_auto_save_interval: int | None = None
    parser_proxy_enabled: bool | None = None

    show_photos_in_list: bool | None = None
    photos_per_row: int | None = None
    cards_per_page: int | None = None
    default_sort_field: str | None = None
    default_sort_order: str | None = None

    notifications_enabled: bool | None = None
    email_notifications: bool | None = None
    new_properties_notification: bool | None = None

    saved_filters: dict | None = None


class SettingsResponse(SettingsBase):
    """Schema for settings response."""

    id: int
    user_id: int
    saved_filters: dict | None = None

    class Config:
        from_attributes = True
