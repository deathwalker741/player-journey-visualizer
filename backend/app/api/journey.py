"""
Player journey API endpoints.
"""

from fastapi import APIRouter, HTTPException, Path
from app.models.schemas import JourneyResponse, PlayerJourney, Position
from app.services.data_loader import load_match_data
from app.utils.coord_transform import world_to_minimap_pixel
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/match/{match_id}/journey", response_model=JourneyResponse)
async def get_journey(
    match_id: str = Path(..., description="Match ID"),
):
    """
    Get player journeys for a specific match.

    Returns all players' movement paths with transformed minimap coordinates.

    Path Parameters:
    - match_id: Match identifier (UUID)

    Returns:
        JourneyResponse with list of PlayerJourney objects containing positions
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

    # Group by player
    journeys = []
    for player_id, player_data in df.groupby('user_id'):
        # Filter position events only
        position_events = player_data[
            player_data['event'].isin(['Position', 'BotPosition'])
        ].sort_values('ts')

        if position_events.empty:
            continue

        # Determine if bot
        is_bot = str(player_id).isdigit()

        # Transform coordinates
        positions = []
        for _, row in position_events.iterrows():
            try:
                pixel_x, pixel_y = world_to_minimap_pixel(
                    float(row['x']),
                    float(row['z']),
                    map_id,
                )
                # Convert timestamp to milliseconds
                ts = int(row['ts'].timestamp() * 1000) if hasattr(row['ts'], 'timestamp') else 0
                positions.append(Position(
                    pixel_x=pixel_x,
                    pixel_y=pixel_y,
                    ts=ts,
                ))
            except Exception as e:
                logger.debug(f"Failed to transform position: {e}")
                continue

        if positions:
            journey = PlayerJourney(
                match_id=match_id,
                player_id=str(player_id),
                map=map_id,
                is_bot=is_bot,
                positions=positions,
                start_ts=positions[0].ts if positions else 0,
                end_ts=positions[-1].ts if positions else 0,
            )
            journeys.append(journey)

    return JourneyResponse(journeys=journeys)
