# Player Journey Visualization API - Implementation Guide

## Overview

The backend API has been fully implemented with all required endpoints for loading, processing, and visualizing player telemetry data from Parquet files.

## Architecture

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI app entrypoint
│   ├── config.py               # Configuration & settings
│   ├── api/                    # API route handlers
│   │   ├── maps.py            # GET /maps
│   │   ├── matches.py         # GET /matches
│   │   ├── journey.py         # GET /match/{id}/journey
│   │   ├── events.py          # GET /match/{id}/events
│   │   └── heatmaps.py        # GET /heatmaps/{map}/{type}
│   ├── services/              # Business logic
│   │   ├── data_loader.py     # Parquet file loading
│   │   ├── event_processor.py # Event classification & aggregation
│   │   └── heatmap_generator.py # Heatmap generation with caching
│   ├── models/
│   │   └── schemas.py         # Pydantic models & response schemas
│   ├── utils/
│   │   ├── constants.py       # Map configurations & constants
│   │   └── coord_transform.py # World → Minimap coordinate transformation
│   └── db/
│       └── database.py        # SQLite schema & initialization
└── requirements.txt           # Python dependencies
```

## Data Processing Pipeline

### 1. Data Loading
- **Source**: Parquet files in `player_data/February_*/` directories
- **Format**: `.nakama-0` extension (custom Parquet variant)
- **Schema**: `user_id, match_id, map_id, x, y, z, ts, event`
- **Processing**: 
  - Automatic byte decoding for event column
  - Timestamp parsing to milliseconds
  - Bot detection via numeric user_id

### 2. Coordinate Transformation
- **Input**: World coordinates (x, z) in game space
- **Process**:
  - Map-specific origin and scale values
  - Formula: `u = (x - origin_x) / scale; v = (z - origin_z) / scale`
  - Pixel conversion: `pixel_x = u * 1024; pixel_y = (1 - v) * 1024`
- **Output**: Minimap pixel coordinates (0-1024 range)

### 3. Event Classification
- **Position Events**: Player/bot location updates (filtered from discrete events)
- **Combat Events**: Kill, Killed, BotKill, BotKilled
- **Loot Events**: Item pickups
- **Environmental**: KilledByStorm

### 4. Heatmap Aggregation
- **Grid**: Configurable NxN grid (default 32x32)
- **Normalization**: Values scaled to 0-100 range
- **Types**:
  - `kills`: Kill + BotKill events
  - `deaths`: Killed + BotKilled + KilledByStorm events
  - `traffic`: All Position events (player movement)

## API Endpoints

### Maps Metadata
```
GET /maps

Response:
{
  "maps": [
    {
      "map_id": "AmbroseValley",
      "scale": 900,
      "origin_x": -370,
      "origin_z": -473,
      "minimap_width": 1024,
      "minimap_height": 1024,
      "minimap_url": "/maps/AmbroseValley_Minimap.png"
    },
    ...
  ]
}
```

### List Matches
```
GET /matches?date=2026-02-10&map=AmbroseValley&limit=20&offset=0

Response:
{
  "matches": [
    {
      "match_id": "uuid-here",
      "map": "AmbroseValley",
      "date": "2026-02-10",
      "player_count": 45,
      "human_count": 32,
      "bot_count": 13,
      "duration_ms": 1800000
    },
    ...
  ],
  "total": 123,
  "limit": 20,
  "offset": 0
}
```

### Player Journeys
```
GET /match/{match_id}/journey

Response:
{
  "journeys": [
    {
      "match_id": "uuid",
      "player_id": "uuid-or-numeric-id",
      "map": "AmbroseValley",
      "is_bot": false,
      "positions": [
        {
          "pixel_x": 512.0,
          "pixel_y": 512.0,
          "ts": 1000
        },
        ...
      ],
      "start_ts": 1000,
      "end_ts": 1800000
    },
    ...
  ]
}
```

### Match Events
```
GET /match/{match_id}/events?event_type=Kill

Response:
{
  "match_id": "uuid",
  "map": "AmbroseValley",
  "events": [
    {
      "event_type": "Kill",
      "pixel_x": 256.0,
      "pixel_y": 768.0,
      "ts": 45000,
      "player_id": "uuid",
      "target_id": null
    },
    ...
  ]
}
```

### Heatmaps
```
GET /heatmaps/AmbroseValley/kills?date_start=2026-02-10&date_end=2026-02-14&grid_size=32

Response:
{
  "map": "AmbroseValley",
  "heatmap_type": "kills",
  "grid": [
    [0, 5, 10, ...],
    [2, 8, 15, ...],
    ...
  ],
  "grid_size": 32,
  "max_value": 100.0
}
```

## Setup & Running

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment (optional)
```bash
# Create .env file
echo "DATA_PATH=../player_data" > .env
echo "DEBUG=True" >> .env
echo "HEATMAP_CACHE_TTL_HOURS=24" >> .env
```

### 3. Run the Server
```bash
python -m uvicorn app.main:app --reload
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### 4. Test Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Get maps
curl http://localhost:8000/maps

# Get matches for a date
curl "http://localhost:8000/matches?date=2026-02-10&limit=5"

# Get journey for a match
curl "http://localhost:8000/match/{match_id}/journey"

# Get events
curl "http://localhost:8000/match/{match_id}/events"

# Get heatmap
curl "http://localhost:8000/heatmaps/AmbroseValley/kills"
```

## Performance Optimization

### Database Indexing
- Match metadata cached in SQLite
- Indexes on: date, map, date+map combination
- Lazy loading: Database populated on first request

### Caching Strategy
- **Heatmaps**: In-memory LRU cache (24-hour TTL default)
- **Cache Key**: `{map_id}:{heatmap_type}:{grid_size}:{date_range_hash}`

### Data Loading
- **Lazy loading**: Data loaded only when needed
- **Batch scanning**: Files scanned in directory order
- **Byte decoding**: Done during load, not on query

## Key Features

✅ **Parquet Support**: Seamless loading of .nakama-0 telemetry files
✅ **Coordinate Transformation**: World → Minimap pixel conversion with map-specific configs
✅ **Event Classification**: 8 event types supported with filtering
✅ **Heatmap Generation**: 2D grid aggregation with normalization
✅ **Bot Detection**: Automatic classification of bot vs human players
✅ **Database Caching**: Fast match queries with SQLite indexing
✅ **CORS Support**: Cross-origin requests enabled for frontend
✅ **Type Safety**: Full Pydantic validation on all endpoints

## Troubleshooting

### "Match not found" error
- Ensure parquet files exist in `player_data/February_*/` directories
- Verify match_id format (should be UUID)

### Heatmap empty response
- Check date range in query (data available Feb 10-14, 2026)
- Verify map name spelling (AmbroseValley, GrandRift, Lockdown)
- Filter by correct heatmap type (kills, deaths, traffic)

### Slow responses
- Database may be indexing on first request (check logs)
- Reduce date range or increase grid_size for faster aggregation

## Next Steps

1. **Frontend Integration**: Connect React frontend to these endpoints
2. **Performance Tuning**: Profile and optimize bottlenecks
3. **Error Handling**: Add more granular error messages
4. **Caching Refinement**: Implement cache invalidation logic
5. **Testing**: Add integration tests for all endpoints

## File Reference

See the following files for implementation details:

- **Data Loading**: `backend/app/services/data_loader.py`
- **Coordinate Transform**: `backend/app/utils/coord_transform.py`
- **Event Processing**: `backend/app/services/event_processor.py`
- **Heatmap Generation**: `backend/app/services/heatmap_generator.py`
- **Response Models**: `backend/app/models/schemas.py`
- **Configuration**: `backend/app/config.py`
