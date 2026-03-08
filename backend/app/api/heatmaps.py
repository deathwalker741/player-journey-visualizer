"""
Heatmap API endpoints.
"""

from fastapi import APIRouter, HTTPException, Path, Query
from typing import Optional
from datetime import date, datetime
from app.models.schemas import HeatmapData, HeatmapType
from app.services.data_loader import load_date_range_data
from app.services.heatmap_generator import HeatmapGenerator
from app.config import get_settings
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

# Global heatmap generator instance
heatmap_gen = HeatmapGenerator(cache_enabled=True)


@router.get("/heatmaps/{map_id}/{heatmap_type}", response_model=HeatmapData)
async def get_heatmap(
    map_id: str = Path(..., description="Map name (AmbroseValley, GrandRift, Lockdown)"),
    heatmap_type: str = Path(..., description="Heatmap type (kills, deaths, traffic)"),
    date_start: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    date_end: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    grid_size: int = Query(32, ge=8, le=128, description="Grid dimension (8-128)"),
):
    """
    Get aggregated heatmap for a map and event type.

    Generates a normalized 2D grid (0-100) showing intensity of events.

    Path Parameters:
    - map_id: Map name (AmbroseValley, GrandRift, Lockdown)
    - heatmap_type: Heatmap type (kills, deaths, traffic)

    Query Parameters:
    - date_start: Start date filter (YYYY-MM-DD)
    - date_end: End date filter (YYYY-MM-DD)
    - grid_size: Grid resolution (NxN, default 32)

    Returns:
        HeatmapData with normalized 2D grid (0-100)
    """
    settings = get_settings()

    # Validate heatmap type
    try:
        heatmap_enum = HeatmapType(heatmap_type)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid heatmap type: {heatmap_type}. Must be: kills, deaths, traffic",
        )

    # Parse dates
    try:
        if date_start:
            start = datetime.strptime(date_start, "%Y-%m-%d").date()
        else:
            start = date(2026, 2, 10)  # Default to first data date

        if date_end:
            end = datetime.strptime(date_end, "%Y-%m-%d").date()
        else:
            end = date(2026, 2, 14)  # Default to last data date
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Invalid date format. Use YYYY-MM-DD",
        )

    # Load data for date range
    try:
        df = load_date_range_data(start, end, settings.DATA_PATH)
    except Exception as e:
        logger.error(f"Failed to load data for date range: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to load data",
        )

    if df is None or df.empty:
        logger.warning(f"No data found for {map_id} between {start} and {end}")
        # Return empty heatmap
        empty_grid = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
        return HeatmapData(
            map=map_id,
            heatmap_type=heatmap_enum,
            grid=empty_grid,
            grid_size=grid_size,
            max_value=0.0,
        )

    # Filter by map
    df = df[df['map_id'] == map_id]

    if df.empty:
        empty_grid = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
        return HeatmapData(
            map=map_id,
            heatmap_type=heatmap_enum,
            grid=empty_grid,
            grid_size=grid_size,
            max_value=0.0,
        )

    # Generate heatmap
    try:
        heatmap = heatmap_gen.generate(
            df,
            map_id=map_id,
            heatmap_type=heatmap_enum,
            grid_size=grid_size,
        )
        return heatmap
    except Exception as e:
        logger.error(f"Failed to generate heatmap: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate heatmap",
        )
