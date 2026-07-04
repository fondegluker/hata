"""Parser API routes."""

from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status
from fastapi.responses import StreamingResponse
import json
import asyncio

from app.core.deps import AdminUser, CurrentUser, DBSession
from app.schemas.parser import (
    ParserStatus,
    ParserProgress,
    ParserStats,
    ParserStartRequest,
    ParserControlRequest,
    ParserStatusEnum,
)
from app.services.parser_service import ParserService

router = APIRouter()

# Global parser state (in production, use Redis or database)
_parser_service: ParserService | None = None
_parser_progress = ParserProgress()
_parser_logs: list[dict] = []
_parser_stats = ParserStats(
    total_properties=0,
    total_photos=0,
    by_property_type={},
    by_sale_type={},
    by_region={},
    by_status={},
)


def get_parser_service() -> ParserService:
    """Get or create parser service instance."""
    global _parser_service
    if _parser_service is None:
        _parser_service = ParserService()
    return _parser_service


@router.get("/status", response_model=ParserStatus)
async def get_parser_status(admin: AdminUser) -> ParserStatus:
    """Get current parser status."""
    global _parser_progress, _parser_stats, _parser_logs

    recent_logs = [
        {
            "timestamp": log.get("timestamp", datetime.now(timezone.utc)),
            "level": log.get("level", "info"),
            "message": log.get("message", ""),
            "details": log.get("details"),
        }
        for log in _parser_logs[-100:]  # Last 100 logs
    ]

    return ParserStatus(
        progress=_parser_progress,
        stats=_parser_stats,
        recent_logs=recent_logs,
    )


@router.post("/start")
async def start_parser(
    admin: AdminUser,
    request: ParserStartRequest,
    db: DBSession,
) -> dict:
    """Start the parser."""
    global _parser_progress, _parser_logs

    if _parser_progress.status == ParserStatusEnum.RUNNING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parser is already running",
        )

    # Reset progress
    _parser_progress = ParserProgress(
        status=ParserStatusEnum.RUNNING,
        started_at=datetime.now(timezone.utc),
    )
    _parser_logs = []

    # Start parser in background
    service = get_parser_service()
    asyncio.create_task(service.run(request, db, _parser_progress, _parser_logs))

    return {"message": "Parser started", "status": "running"}


@router.post("/control")
async def control_parser(
    admin: AdminUser,
    request: ParserControlRequest,
) -> dict:
    """Control parser (pause/resume/stop)."""
    global _parser_progress

    if _parser_progress.status == ParserStatusEnum.IDLE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Parser is not running",
        )

    action = request.action.lower()

    if action == "pause":
        if _parser_progress.status != ParserStatusEnum.RUNNING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parser is not running",
            )
        _parser_progress.status = ParserStatusEnum.PAUSED
        return {"message": "Parser paused", "status": "paused"}

    elif action == "resume":
        if _parser_progress.status != ParserStatusEnum.PAUSED:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Parser is not paused",
            )
        _parser_progress.status = ParserStatusEnum.RUNNING
        return {"message": "Parser resumed", "status": "running"}

    elif action == "stop":
        _parser_progress.status = ParserStatusEnum.STOPPING
        return {"message": "Parser stopping", "status": "stopping"}

    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown action: {action}",
        )


@router.get("/logs")
async def get_parser_logs(
    admin: AdminUser,
    limit: int = 100,
    level: str | None = None,
) -> list[dict]:
    """Get parser logs."""
    global _parser_logs

    logs = _parser_logs[-limit:]

    if level:
        logs = [log for log in logs if log.get("level") == level]

    return logs


@router.get("/logs/download")
async def download_parser_logs(admin: AdminUser) -> StreamingResponse:
    """Download parser logs as JSON file."""
    global _parser_logs

    content = json.dumps(_parser_logs, indent=2, ensure_ascii=False, default=str)

    return StreamingResponse(
        iter([content]),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename=parser_logs_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        },
    )


@router.get("/stats", response_model=ParserStats)
async def get_parser_stats(admin: AdminUser) -> ParserStats:
    """Get parser statistics."""
    global _parser_stats
    return _parser_stats
