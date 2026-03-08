"""
Pydantic models for request/response validation.
All models include field descriptions for API documentation.
"""

from datetime import date, datetime
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field


class EventType(str, Enum):
    """Event types in player telemetry."""
    POSITION = "Position"
    BOT_POSITION = "BotPosition"
    KILL = "Kill"
    KILLED = "Killed"
    BOT_KILL = "BotKill"
    BOT_KILLED = "BotKilled"
    LOOT = "Loot"
    KILLED_BY_STORM = "KilledByStorm"


class MapId(str, Enum):
    """Available maps in LILA BLACK."""
    AMBROSE_VALLEY = "AmbroseValley"
    GRAND_RIFT = "GrandRift"
    LOCKDOWN = "Lockdown"


# ==================== Match Models ====================

class MatchSummary(BaseModel):
    """Summary info for a single match."""
    match_id: str = Field(..., description="Unique match identifier")
    map_name: str = Field(..., description="Map where match was played")
    date: str = Field(..., description="Date match was played (YYYY-MM-DD)")
    player_count: int = Field(..., description="Total players (humans + bots)")
    human_count: int = Field(..., description="Number of human players")
    bot_count: int = Field(..., description="Number of bots")
    duration_ms: int = Field(..., description="Match duration in milliseconds")


class MatchListResponse(BaseModel):
    """Response for match listing endpoint."""
    matches: List[MatchSummary] = Field(..., description="List of matches")
    total: int = Field(..., description="Total matches matching filters")
    limit: int = Field(..., description="Pagination limit")
    offset: int = Field(..., description="Pagination offset")


# ==================== Journey Models ====================

class Position(BaseModel):
    """A player position in minimap pixel coordinates."""
    pixel_x: float = Field(..., description="X coordinate in minimap pixels (0-1024)")
    pixel_y: float = Field(..., description="Y coordinate in minimap pixels (0-1024)")
    ts: int = Field(..., description="Timestamp in match (milliseconds)")


class PlayerJourney(BaseModel):
    """Full journey of one player in one match."""
    match_id: str = Field(..., description="Match ID")
    player_id: str = Field(..., description="Player ID (UUID or numeric for bots)")
    map_name: str = Field(..., description="Map name")
    is_bot: bool = Field(..., description="Whether player is a bot")
    positions: List[Position] = Field(..., description="List of positions over time")
    start_ts: int = Field(..., description="Match start time (ms)")
    end_ts: int = Field(..., description="Match end time (ms)")


class JourneyResponse(BaseModel):
    """Response for journey endpoint."""
    journeys: List[PlayerJourney] = Field(..., description="Player journeys in match")


# ==================== Event Models ====================

class Event(BaseModel):
    """A discrete event (kill, death, loot, etc.)."""
    event_type: EventType = Field(..., description="Type of event")
    pixel_x: float = Field(..., description="X coordinate in minimap pixels")
    pixel_y: float = Field(..., description="Y coordinate in minimap pixels")
    ts: int = Field(..., description="Timestamp in match (milliseconds)")
    player_id: str = Field(..., description="Player who triggered event")
    target_id: Optional[str] = Field(None, description="Player affected (for kills/deaths)")


class EventResponse(BaseModel):
    """Response for events endpoint."""
    match_id: str = Field(..., description="Match ID")
    map_name: str = Field(..., description="Map name")
    events: List[Event] = Field(..., description="List of events in match")


# ==================== Heatmap Models ====================

class HeatmapType(str, Enum):
    """Types of heatmaps available."""
    KILLS = "kills"
    DEATHS = "deaths"
    TRAFFIC = "traffic"


class HeatmapData(BaseModel):
    """2D heatmap grid (normalized 0-100)."""
    map_name: str = Field(..., description="Map name")
    heatmap_type: HeatmapType = Field(..., description="Type of heatmap")
    grid: List[List[float]] = Field(..., description="2D array of heatmap values (0-100)")
    grid_size: int = Field(..., description="Grid dimension (grid_size x grid_size)")
    max_value: float = Field(..., description="Maximum value in grid (for normalization)")


# ==================== Map Models ====================

class MapConfig(BaseModel):
    """Configuration for a single map."""
    map_id: MapId = Field(..., description="Map identifier")
    scale: float = Field(..., description="World-to-pixel scale factor")
    origin_x: float = Field(..., description="World origin X coordinate")
    origin_z: float = Field(..., description="World origin Z coordinate")
    minimap_width: int = Field(..., description="Minimap width in pixels")
    minimap_height: int = Field(..., description="Minimap height in pixels")
    minimap_url: str = Field(..., description="URL to minimap image")


class MapsResponse(BaseModel):
    """Response for maps metadata endpoint."""
    maps: List[MapConfig] = Field(..., description="All available maps")
