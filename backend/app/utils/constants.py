"""Map constants and configurations."""

from dataclasses import dataclass
from typing import Dict


@dataclass
class MapConfig:
    """Configuration for world-to-minimap coordinate transformation."""
    name: str
    scale: float  # World units per minimap dimension
    origin_x: float  # World X at minimap (0, 0)
    origin_z: float  # World Z at minimap (0, 0)
    minimap_width: int = 1024
    minimap_height: int = 1024


# Map configurations from README
MAPS: Dict[str, MapConfig] = {
    "AmbroseValley": MapConfig(
        name="AmbroseValley",
        scale=900,
        origin_x=-370,
        origin_z=-473,
    ),
    "GrandRift": MapConfig(
        name="GrandRift",
        scale=581,
        origin_x=-290,
        origin_z=-290,
    ),
    "Lockdown": MapConfig(
        name="Lockdown",
        scale=1000,
        origin_x=-500,
        origin_z=-500,
    ),
}

# Event type colors (RGB tuples for frontend)
EVENT_COLORS = {
    "Kill": [255, 0, 0],  # Red
    "Killed": [255, 0, 0],  # Red
    "BotKill": [255, 100, 0],  # Orange
    "BotKilled": [255, 100, 0],  # Orange
    "KilledByStorm": [0, 100, 255],  # Blue
    "Loot": [255, 255, 0],  # Yellow
    "Position": [0, 255, 0],  # Green (low opacity)
    "BotPosition": [100, 150, 100],  # Gray-green
}

# Data file naming conventions
BOT_ID_PREFIX = None  # Bots have numeric IDs (e.g., "1440")
HUMAN_ID_IS_UUID = True  # Humans have UUID format

DATA_FILE_SUFFIX = ".nakama-0"
