"""
Event processing and aggregation logic.
"""

import pandas as pd
from typing import List, Dict, Tuple
from collections import defaultdict
from app.models.schemas import Event, EventType
from app.utils.coord_transform import world_to_minimap_pixel


def classify_event(event_str: str) -> EventType:
    """
    Classify an event string to EventType enum.

    Args:
        event_str: Raw event string from parquet (e.g., "Kill", "Position")

    Returns:
        EventType enum value
    """
    try:
        return EventType(event_str)
    except ValueError:
        # Default to position if unknown
        return EventType.POSITION


def process_match_events(
    df: pd.DataFrame,
    map_name: str,
) -> List[Event]:
    """
    Process raw parquet DataFrame into Event objects.

    Filters out position tracking events (too verbose) and focuses on
    discrete events (kills, deaths, loot, etc.).

    Args:
        df: DataFrame with columns: user_id, event, x, z, ts
        map_name: Map identifier

    Returns:
        List of Event objects (non-movement events)
    """
    events = []

    # Filter out position events (too many, mostly noise)
    discrete_events = df[
        ~df['event'].isin(['Position', 'BotPosition'])
    ].copy()

    for _, row in discrete_events.iterrows():
        try:
            pixel_x, pixel_y = world_to_minimap_pixel(
                float(row['x']),
                float(row['z']),
                map_name,
            )

            event = Event(
                event_type=classify_event(row['event']),
                pixel_x=pixel_x,
                pixel_y=pixel_y,
                ts=int(row['ts'].timestamp() * 1000) if hasattr(row['ts'], 'timestamp') else 0,
                player_id=str(row['user_id']),
                target_id=None,  # TODO: Parse from event data if available
            )
            events.append(event)
        except Exception as e:
            # Skip malformed events
            continue

    return events


def aggregate_positions_by_player(
    df: pd.DataFrame,
    map_name: str,
    downsample: int = 10,
) -> Dict[str, List[Tuple[float, float, int]]]:
    """
    Extract and transform player positions, optionally downsampling.

    Args:
        df: Raw parquet DataFrame
        map_name: Map identifier
        downsample: Keep every Nth position (reduce data size)

    Returns:
        Dict mapping player_id to list of (pixel_x, pixel_y, ts) tuples
    """
    positions_by_player = defaultdict(list)

    # Filter only position events
    position_events = df[
        df['event'].isin(['Position', 'BotPosition'])
    ].copy()

    # Group by player
    for player_id, player_data in position_events.groupby('user_id'):
        # Sort by timestamp
        player_data = player_data.sort_values('ts')

        # Downsample
        sampled = player_data.iloc[::downsample]

        # Transform coordinates
        for _, row in sampled.iterrows():
            try:
                pixel_x, pixel_y = world_to_minimap_pixel(
                    float(row['x']),
                    float(row['z']),
                    map_name,
                )
                ts = int(row['ts'].timestamp() * 1000) if hasattr(row['ts'], 'timestamp') else 0
                positions_by_player[str(player_id)].append(
                    (pixel_x, pixel_y, ts)
                )
            except Exception:
                continue

    return dict(positions_by_player)


def aggregate_events_into_heatmap(
    events_df: pd.DataFrame,
    event_type: str,
    grid_size: int = 32,
    minimap_size: int = 1024,
) -> List[List[float]]:
    """
    Aggregate events into a 2D heatmap grid.

    Args:
        events_df: DataFrame with pixel_x, pixel_y, event columns
        event_type: Filter to this event type (e.g., "Kill", "Killed")
        grid_size: Number of cells per side (grid_size x grid_size)
        minimap_size: Minimap resolution (1024x1024)

    Returns:
        2D list representing normalized heatmap (0-100)
    """
    # Initialize grid
    grid = [[0.0 for _ in range(grid_size)] for _ in range(grid_size)]

    # Filter events
    filtered = events_df[events_df['event'] == event_type].copy()

    if filtered.empty:
        return grid

    # Map pixel coordinates to grid cells
    cell_size = minimap_size / grid_size

    for _, row in filtered.iterrows():
        try:
            pixel_x = float(row['x'])
            pixel_y = float(row['y'])

            # Clamp to minimap bounds
            pixel_x = max(0, min(minimap_size - 1, pixel_x))
            pixel_y = max(0, min(minimap_size - 1, pixel_y))

            # Map to grid cell
            cell_x = int(pixel_x / cell_size)
            cell_y = int(pixel_y / cell_size)

            # Clamp cell indices
            cell_x = max(0, min(grid_size - 1, cell_x))
            cell_y = max(0, min(grid_size - 1, cell_y))

            grid[cell_y][cell_x] += 1.0
        except (ValueError, TypeError):
            continue

    # Normalize to 0-100 range
    max_val = max(max(row) for row in grid) if any(any(row) for row in grid) else 1
    if max_val > 0:
        normalized = [[int(100 * cell / max_val) for cell in row] for row in grid]
    else:
        normalized = grid

    return normalized
