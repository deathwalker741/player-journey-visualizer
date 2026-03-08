"""Coordinate transformation utilities."""

from typing import Tuple
from app.utils.constants import MAPS, MapConfig


def world_to_minimap_pixel(
    world_x: float,
    world_z: float,
    map_name: str,
) -> Tuple[float, float]:
    """
    Convert world coordinates to minimap pixel coordinates.

    Implementation of the transformation from README:
    Step 1: u = (x - origin_x) / scale
            v = (z - origin_z) / scale
    Step 2: pixel_x = u * 1024
            pixel_y = (1 - v) * 1024

    Args:
        world_x: World X coordinate
        world_z: World Z coordinate
        map_name: Map identifier (e.g., "AmbroseValley")

    Returns:
        Tuple of (pixel_x, pixel_y) in range [0, 1024]

    Raises:
        ValueError: If map_name is unknown
    """
    if map_name not in MAPS:
        raise ValueError(f"Unknown map: {map_name}")

    config = MAPS[map_name]

    # Step 1: Convert to UV coordinates (0-1 range)
    u = (world_x - config.origin_x) / config.scale
    v = (world_z - config.origin_z) / config.scale

    # Step 2: Convert to pixel coordinates
    # Y is flipped because image origin is top-left
    pixel_x = u * config.minimap_width
    pixel_y = (1 - v) * config.minimap_height

    return pixel_x, pixel_y


def is_point_on_minimap(
    pixel_x: float,
    pixel_y: float,
    map_name: str,
) -> bool:
    """
    Check if pixel coordinates are within minimap bounds.

    Args:
        pixel_x: Pixel X coordinate
        pixel_y: Pixel Y coordinate
        map_name: Map name

    Returns:
        True if point is within bounds, False otherwise
    """
    if map_name not in MAPS:
        return False

    config = MAPS[map_name]
    return (
        0 <= pixel_x <= config.minimap_width and
        0 <= pixel_y <= config.minimap_height
    )


def get_map_bounds(map_name: str) -> dict:
    """
    Get world-space bounds for a map.

    Returns dict with min_x, max_x, min_z, max_z.
    """
    if map_name not in MAPS:
        raise ValueError(f"Unknown map: {map_name}")

    config = MAPS[map_name]

    # Minimap pixel (0,0) to (1024,1024) maps to world bounds
    min_x = config.origin_x
    max_x = config.origin_x + config.scale
    min_z = config.origin_z
    max_z = config.origin_z + config.scale

    return {
        "min_x": min_x,
        "max_x": max_x,
        "min_z": min_z,
        "max_z": max_z,
    }
