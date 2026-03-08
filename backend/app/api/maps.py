"""
Maps metadata API endpoints.
"""

from fastapi import APIRouter, HTTPException
from app.models.schemas import MapConfig, MapsResponse
from app.utils.constants import MAPS

router = APIRouter()


@router.get("/maps", response_model=MapsResponse)
async def get_maps():
    """
    Get all available maps and their configuration.

    Returns map metadata including scale, origin, and minimap URLs.

    Returns:
        MapsResponse with list of all maps
    """
    maps_list = []

    for map_id, config in MAPS.items():
        map_config = MapConfig(
            map_id=map_id,
            scale=config.scale,
            origin_x=config.origin_x,
            origin_z=config.origin_z,
            minimap_width=config.minimap_width,
            minimap_height=config.minimap_height,
            minimap_url=f"/maps/{map_id}_Minimap.png",
        )
        maps_list.append(map_config)

    return MapsResponse(maps=maps_list)
