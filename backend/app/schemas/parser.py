"""Parser schemas for status and progress."""

from datetime import datetime
from enum import Enum

from pydantic import BaseModel


class ParserStatusEnum(str, Enum):
    """Parser status enum."""

    IDLE = "idle"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    ERROR = "error"
    COMPLETED = "completed"


class ParserLog(BaseModel):
    """Schema for parser log entry."""

    timestamp: datetime
    level: str  # info, warning, error
    message: str
    details: dict | None = None


class ParserProgress(BaseModel):
    """Schema for parser progress."""

    status: ParserStatusEnum = ParserStatusEnum.IDLE

    # Current task
    current_page: int = 0
    total_pages: int = 0
    current_item: str | None = None

    # Statistics
    total_items_found: int = 0
    items_processed: int = 0
    items_added: int = 0
    items_updated: int = 0
    items_skipped: int = 0
    items_failed: int = 0

    # Photos
    photos_downloaded: int = 0
    photos_failed: int = 0

    # Timing
    started_at: datetime | None = None
    estimated_completion: datetime | None = None

    # Progress percentage
    @property
    def progress_percent(self) -> float:
        if self.total_pages == 0:
            return 0.0
        return round((self.current_page / self.total_pages) * 100, 2)


class ParserStats(BaseModel):
    """Schema for parser statistics."""

    # Total counts
    total_properties: int
    total_photos: int

    # By type
    by_property_type: dict[str, int]
    by_sale_type: dict[str, int]
    by_region: dict[str, int]

    # By status
    by_status: dict[str, int]

    # Last parse
    last_parse_at: datetime | None = None
    last_parse_duration: float | None = None  # seconds

    # Errors
    last_error: str | None = None
    last_error_at: datetime | None = None


class ParserStatus(BaseModel):
    """Schema for full parser status."""

    progress: ParserProgress
    stats: ParserStats
    recent_logs: list[ParserLog] = []

    class Config:
        from_attributes = True


class ParserStartRequest(BaseModel):
    """Schema for starting parser."""

    incremental: bool = True
    property_types: list[str] | None = None  # all if None
    regions: list[str] | None = None  # all if None
    max_pages: int | None = None  # all if None
    download_photos: bool = True


class ParserControlRequest(BaseModel):
    """Schema for parser control (pause/resume/stop)."""

    action: str  # pause, resume, stop
