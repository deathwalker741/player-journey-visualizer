"""Data loading from parquet files."""

import os
import re
from pathlib import Path
from datetime import datetime, date
from typing import List, Optional, Dict, Tuple
import pyarrow.parquet as pq
import pandas as pd
from app.config import get_settings
from app.utils.constants import DATA_FILE_SUFFIX
import logging

logger = logging.getLogger(__name__)


def extract_file_metadata(filename: str) -> Dict[str, str]:
    """
    Extract user_id and match_id from filename.

    Format: {user_id}_{match_id}.nakama-0
    Example: f4e072fa-b7af-4761-b567-1d95b7ad0108_b71aaad8-aa62-4b3a-8534-927d4de18f22.nakama-0

    Returns:
        Dict with keys: user_id, match_id
        Returns empty dict if filename doesn't match pattern
    """
    if not filename.endswith(DATA_FILE_SUFFIX):
        return {}

    # Remove suffix
    name_without_suffix = filename[:-len(DATA_FILE_SUFFIX)]

    # Split by last underscore (handles UUIDs which contain underscores)
    parts = name_without_suffix.rsplit("_", 1)
    if len(parts) != 2:
        return {}

    user_id, match_id = parts
    return {"user_id": user_id, "match_id": match_id}


def is_bot_user(user_id: str) -> bool:
    """
    Determine if user_id is a bot.

    Bots have numeric IDs, humans have UUID format.

    Args:
        user_id: User ID string

    Returns:
        True if bot, False if human player
    """
    return user_id.isdigit()


def get_date_from_path(file_path: str) -> Optional[date]:
    """
    Extract date from file path.

    Expected format: .../February_10/filename
                     .../February_11/filename
    """
    # Look for pattern like "February_10" in path
    match = re.search(r"February_(\d+)", file_path)
    if match:
        day = int(match.group(1))
        return date(2026, 2, day)
    return None


def scan_data_files(data_path: str) -> List[Tuple[str, Dict]]:
    """
    Scan all .nakama-0 files in data directory.

    Returns:
        List of tuples: (full_path, metadata_dict)
        metadata_dict contains: user_id, match_id, date, is_bot
    """
    results = []
    data_path = Path(data_path)

    if not data_path.exists():
        logger.warning(f"Data path does not exist: {data_path}")
        return results

    # Walk directory tree
    for file_path in data_path.rglob("*" + DATA_FILE_SUFFIX):
        metadata = extract_file_metadata(file_path.name)
        if not metadata:
            continue

        file_date = get_date_from_path(str(file_path))
        if not file_date:
            continue

        metadata["date"] = file_date
        metadata["is_bot"] = is_bot_user(metadata["user_id"])

        results.append((str(file_path), metadata))

    logger.info(f"Found {len(results)} data files in {data_path}")
    return results


def load_parquet_file(file_path: str) -> Optional[pd.DataFrame]:
    """
    Load a single parquet file into a DataFrame.

    Args:
        file_path: Path to .nakama-0 parquet file

    Returns:
        DataFrame with columns: user_id, match_id, map_id, x, y, z, ts, event
        Returns None if file cannot be loaded
    """
    try:
        table = pq.read_table(file_path)
        df = table.to_pandas()

        # Decode event column from bytes to string
        if "event" in df.columns and df["event"].dtype == object:
            df["event"] = df["event"].apply(
                lambda x: x.decode("utf-8") if isinstance(x, bytes) else x
            )

        return df
    except Exception as e:
        logger.error(f"Failed to load {file_path}: {e}")
        return None


def load_match_data(match_id: str, data_path: str) -> Optional[pd.DataFrame]:
    """
    Load all player journeys for a specific match.

    Combines all files with matching match_id.

    Args:
        match_id: Match identifier
        data_path: Root data directory path

    Returns:
        Combined DataFrame for all players in match
        Returns None if no files found
    """
    frames = []
    data_path = Path(data_path)

    for file_path in data_path.rglob("*" + DATA_FILE_SUFFIX):
        metadata = extract_file_metadata(file_path.name)
        if metadata.get("match_id") == match_id:
            df = load_parquet_file(str(file_path))
            if df is not None:
                frames.append(df)

    if not frames:
        return None

    combined = pd.concat(frames, ignore_index=True)
    return combined.sort_values("ts").reset_index(drop=True)


def load_date_range_data(
    start_date: date,
    end_date: date,
    data_path: str,
) -> Optional[pd.DataFrame]:
    """
    Load all data for a date range.

    Useful for bulk analysis.

    Args:
        start_date: Start date (inclusive)
        end_date: End date (inclusive)
        data_path: Root data directory path

    Returns:
        Combined DataFrame for all matches in range
    """
    frames = []
    data_path = Path(data_path)

    for file_path in data_path.rglob("*" + DATA_FILE_SUFFIX):
        file_date = get_date_from_path(str(file_path))
        if file_date and start_date <= file_date <= end_date:
            df = load_parquet_file(str(file_path))
            if df is not None:
                frames.append(df)

    if not frames:
        return None

    combined = pd.concat(frames, ignore_index=True)
    return combined.sort_values("ts").reset_index(drop=True)
