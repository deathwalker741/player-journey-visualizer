import os
from functools import lru_cache
from typing import Optional


class Settings:
    """Application configuration from environment variables."""

    # Data paths
    DATA_PATH: str = os.getenv("DATA_PATH", "../player_data")
    MAPS_PATH: str = os.getenv("MAPS_PATH", "../player_data/minimaps")
    DB_PATH: str = os.getenv("DB_PATH", "./cache.db")

    # Server
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    # CORS
    ALLOWED_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
    ]

    # Cache settings
    CACHE_MAX_SIZE_MB: int = int(os.getenv("CACHE_MAX_SIZE_MB", "500"))
    HEATMAP_CACHE_TTL_HOURS: int = int(os.getenv("HEATMAP_CACHE_TTL_HOURS", "24"))

    # Data processing
    BATCH_SIZE: int = 100  # Files to load per batch
    HEATMAP_AGGREGATION_GRID: int = 32  # 32x32 grid for heatmaps


@lru_cache()
def get_settings() -> Settings:
    """Return cached settings instance."""
    return Settings()
