"""
Heatmap generation and caching.
"""

import pandas as pd
from typing import Dict, List, Optional, Tuple
from datetime import datetime, date
from app.models.schemas import HeatmapData, HeatmapType, MapId
from app.services.event_processor import aggregate_events_into_heatmap
import logging

logger = logging.getLogger(__name__)


class HeatmapGenerator:
    """Generate heatmaps from aggregated event data."""

    def __init__(self, cache_enabled: bool = True):
        """
        Initialize generator.

        Args:
            cache_enabled: Whether to cache computed heatmaps
        """
        self.cache = {}
        self.cache_enabled = cache_enabled

    def _cache_key(
        self,
        map_id: str,
        heatmap_type: str,
        date_start: Optional[date] = None,
        date_end: Optional[date] = None,
    ) -> str:
        """Generate cache key."""
        key = f"{map_id}:{heatmap_type}"
        if date_start:
            key += f":{date_start}"
        if date_end:
            key += f":{date_end}"
        return key

    def generate(
        self,
        events_df: pd.DataFrame,
        map_id: MapId,
        heatmap_type: HeatmapType,
        grid_size: int = 32,
    ) -> HeatmapData:
        """
        Generate a heatmap from events.

        Args:
            events_df: DataFrame with columns: event, x, y, ts
            map_id: Map identifier
            heatmap_type: Type of heatmap (kills, deaths, traffic)
            grid_size: Grid dimension (NxN)

        Returns:
            HeatmapData object with normalized grid
        """
        if events_df.empty:
            # Return empty heatmap
            empty_grid = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
            return HeatmapData(
                map=map_id,
                heatmap_type=heatmap_type,
                grid=empty_grid,
                grid_size=grid_size,
                max_value=0.0,
            )

        # Determine which events to aggregate
        if heatmap_type == HeatmapType.KILLS:
            event_types = ['Kill', 'BotKill']
        elif heatmap_type == HeatmapType.DEATHS:
            event_types = ['Killed', 'BotKilled', 'KilledByStorm']
        elif heatmap_type == HeatmapType.TRAFFIC:
            # For traffic, use position events (sampled)
            event_types = ['Position', 'BotPosition']
        else:
            event_types = []

        # Filter events
        filtered = events_df[events_df['event'].isin(event_types)].copy()

        if filtered.empty:
            empty_grid = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
            return HeatmapData(
                map=map_id,
                heatmap_type=heatmap_type,
                grid=empty_grid,
                grid_size=grid_size,
                max_value=0.0,
            )

        # Generate grid
        grid = self._aggregate_to_grid(
            filtered,
            grid_size=grid_size,
        )

        # Find max for normalization
        max_val = max(max(row) for row in grid) if any(any(row) for row in grid) else 1

        # Normalize to 0-100
        if max_val > 0:
            normalized = [[100.0 * cell / max_val for cell in row] for row in grid]
        else:
            normalized = grid

        return HeatmapData(
            map=map_id,
            heatmap_type=heatmap_type,
            grid=normalized,
            grid_size=grid_size,
            max_value=float(max_val),
        )

    def _aggregate_to_grid(
        self,
        events_df: pd.DataFrame,
        grid_size: int = 32,
        minimap_size: int = 1024,
    ) -> List[List[float]]:
        """
        Aggregate events into grid.

        Args:
            events_df: Events with pixel_x, pixel_y (already transformed)
            grid_size: Grid dimension
            minimap_size: Minimap size (1024)

        Returns:
            2D grid with counts
        """
        grid = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]
        cell_size = minimap_size / grid_size

        for _, row in events_df.iterrows():
            try:
                # Expected columns: x, y (already in pixel space from parquet)
                pixel_x = float(row.get('x', 0))
                pixel_y = float(row.get('y', 0))

                # Clamp to bounds
                pixel_x = max(0, min(minimap_size - 1, pixel_x))
                pixel_y = max(0, min(minimap_size - 1, pixel_y))

                # Map to grid cell
                cell_x = int(pixel_x / cell_size)
                cell_y = int(pixel_y / cell_size)

                # Clamp cell indices
                cell_x = max(0, min(grid_size - 1, cell_x))
                cell_y = max(0, min(grid_size - 1, cell_y))

                grid[cell_y][cell_x] += 1.0
            except (ValueError, TypeError, KeyError):
                continue

        return grid
