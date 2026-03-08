"""
Matches API endpoints.
"""

from fastapi import APIRouter, HTTPException, Query
from datetime import date, datetime
from app.models.schemas import MatchListResponse, MatchSummary
from app.services.data_loader import scan_data_files, get_date_from_path
from app.db.database import get_db_connection
from app.config import get_settings
import sqlite3
from typing import Optional
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


def _ensure_matches_indexed():
    """Ensure matches are indexed in database."""
    settings = get_settings()
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if we have data
    cursor.execute("SELECT COUNT(*) FROM matches")
    count = cursor.fetchone()[0]

    if count == 0:
        logger.info("Indexing matches...")
        _index_all_matches(conn)
    conn.close()


def _index_all_matches(conn: sqlite3.Connection):
    """Scan all data files and index matches."""
    settings = get_settings()
    cursor = conn.cursor()

    files = scan_data_files(settings.DATA_PATH)
    match_summary = {}

    # Group by match_id
    for file_path, metadata in files:
        match_id = metadata['match_id']
        if match_id not in match_summary:
            match_summary[match_id] = {
                'date': metadata['date'],
                'map': 'Unknown',
                'players': set(),
                'humans': set(),
                'bots': set(),
            }

        match_summary[match_id]['map'] = metadata.get('map', match_summary[match_id]['map'])
        match_summary[match_id]['players'].add(metadata['user_id'])
        if metadata['is_bot']:
            match_summary[match_id]['bots'].add(metadata['user_id'])
        else:
            match_summary[match_id]['humans'].add(metadata['user_id'])

    # Insert into database
    for match_id, summary in match_summary.items():
        cursor.execute(
            """
            INSERT OR REPLACE INTO matches
            (match_id, date, map, player_count, human_count, bot_count, duration_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                match_id,
                summary['date'].isoformat(),
                summary['map'],
                len(summary['players']),
                len(summary['humans']),
                len(summary['bots']),
                1800000,  # Default match duration
            ),
        )

    conn.commit()
    logger.info(f"Indexed {len(match_summary)} matches")


@router.get("/matches", response_model=MatchListResponse)
async def list_matches(
    date: Optional[str] = Query(None, description="Date filter (YYYY-MM-DD)"),
    map: Optional[str] = Query(None, description="Map filter"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
):
    """
    List available matches with optional filters.

    Query Parameters:
    - date: Filter by match date (YYYY-MM-DD)
    - map: Filter by map name (AmbroseValley, GrandRift, Lockdown)
    - limit: Results per page (1-100)
    - offset: Pagination offset

    Returns:
        List of matches matching filters with pagination info
    """
    _ensure_matches_indexed()

    conn = get_db_connection()
    cursor = conn.cursor()

    # Build query
    where_clauses = []
    params = []

    if date:
        where_clauses.append("date = ?")
        params.append(date)

    if map:
        where_clauses.append("map = ?")
        params.append(map)

    where_sql = " AND ".join(where_clauses) if where_clauses else "1=1"

    # Get total count
    count_query = f"SELECT COUNT(*) FROM matches WHERE {where_sql}"
    cursor.execute(count_query, params)
    total = cursor.fetchone()[0]

    # Get paginated results
    query = f"""
        SELECT match_id, date, map, player_count, human_count, bot_count, duration_ms
        FROM matches
        WHERE {where_sql}
        ORDER BY date DESC, match_id
        LIMIT ? OFFSET ?
    """
    params.extend([limit, offset])

    cursor.execute(query, params)
    rows = cursor.fetchall()

    matches = [
        MatchSummary(
            match_id=row[0],
            map=row[2],
            date=row[1],
            player_count=row[3],
            human_count=row[4],
            bot_count=row[5],
            duration_ms=row[6],
        )
        for row in rows
    ]

    conn.close()

    return MatchListResponse(
        matches=matches,
        total=total,
        limit=limit,
        offset=offset,
    )
