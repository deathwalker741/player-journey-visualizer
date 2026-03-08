"""
Events API endpoints.
"""

from fastapi import APIRouter, HTTPException, Path, Query
from typing import Optional
from app.models.schemas import EventResponse, Event, EventType
from app.services.data_loader import load_match_data
from app.utils.coord_transform import world_to_minimap_pixel
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/match/{match_id}/events", response_model=EventResponse)
async def get_events(
    match_id: str = Path(..., description="Match ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
):
    """
    Get discrete events for a specific match.

    Returns combat (kills/deaths), loot, and environmental events
    with transformed minimap coordinates.

    Path Parameters:
    - match_id: Match identifier

    Query Parameters:
    - event_type: Optional filter (Kill, Killed, BotKill, BotKilled, Loot, KilledByStorm)

    Returns:
        EventResponse with list of discrete match events
    """
    settings = get_settings()

    try:
        df = load_match_data(match_id, settings.DATA_PATH)
    except Exception as e:
        logger.error(f"Failed to load match {match_id}: {e}")
        raise HTTPException(
            status_code=404,
            detail=f"Match {match_id} not found",
        )

    if df is None or df.empty:
        raise HTTPException(
            status_code=404,
            detail=f"No data found for match {match_id}",
        )

    # Determine map
    map_id = df['map_id'].iloc[0] if 'map_id' in df.columns else 'AmbroseValley'

    # Filter out position events (too verbose)
    discrete_events = df[
        ~df['event'].isin(['Position', 'BotPosition'])
    ].copy()

    if event_type:
        discrete_events = discrete_events[discrete_events['event'] == event_type]

    # Transform to Event objects
    events = []
    for _, row in discrete_events.iterrows():
        try:
            # Decode event if bytes
            event_str = row['event']
            if isinstance(event_str, bytes):
                event_str = event_str.decode('utf-8')

            pixel_x, pixel_y = world_to_minimap_pixel(
                float(row['x']),
                float(row['z']),
                map_id,
            )

            # Convert timestamp
            ts = int(row['ts'].timestamp() * 1000) if hasattr(row['ts'], 'timestamp') else 0

            # Try to parse event type
            try:
                event_type_enum = EventType(event_str)
            except ValueError:
                event_type_enum = EventType.LOOT  # Default

            event = Event(
                event_type=event_type_enum,
                pixel_x=pixel_x,
                pixel_y=pixel_y,
                ts=ts,
                player_id=str(row['user_id']),
                target_id=None,
            )
            events.append(event)
        except Exception as e:
            logger.debug(f"Failed to process event: {e}")
            continue

    return EventResponse(
        match_id=match_id,
        map=map_id,
        events=events,
    )
