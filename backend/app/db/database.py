"""Database initialization and schema setup."""

import sqlite3
import os
from pathlib import Path
from app.config import get_settings


SCHEMA = """
-- Match metadata index for fast lookups
CREATE TABLE IF NOT EXISTS matches (
    match_id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    map TEXT NOT NULL,
    player_count INTEGER,
    human_count INTEGER,
    bot_count INTEGER,
    duration_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_matches_date ON matches(date);
CREATE INDEX IF NOT EXISTS idx_matches_map ON matches(map);
CREATE INDEX IF NOT EXISTS idx_matches_date_map ON matches(date, map);

-- File manifest for quick discovery
CREATE TABLE IF NOT EXISTS files (
    file_path TEXT PRIMARY KEY,
    match_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    map TEXT NOT NULL,
    is_bot INTEGER,
    file_size INTEGER,
    scanned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(match_id) REFERENCES matches(match_id)
);

CREATE INDEX IF NOT EXISTS idx_files_match ON files(match_id);
CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
CREATE INDEX IF NOT EXISTS idx_files_date ON files(date);
CREATE INDEX IF NOT EXISTS idx_files_map ON files(map);

-- Cache invalidation tracking
CREATE TABLE IF NOT EXISTS cache_metadata (
    key TEXT PRIMARY KEY,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ttl_hours INTEGER
);
"""


def init_database():
    """Initialize SQLite database with schema."""
    settings = get_settings()
    db_path = settings.DB_PATH

    # Create directory if needed
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # Execute schema
    cursor.executescript(SCHEMA)
    conn.commit()

    print(f"✓ Database initialized at {db_path}")
    return conn


def get_db_connection() -> sqlite3.Connection:
    """Get SQLite database connection."""
    settings = get_settings()
    db_path = settings.DB_PATH

    if not os.path.exists(db_path):
        init_database()

    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row  # Enable dict-like access
    return conn


def close_db_connection(conn: sqlite3.Connection):
    """Close database connection."""
    if conn:
        conn.close()
