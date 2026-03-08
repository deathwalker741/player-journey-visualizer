# API Endpoints Reference

## Server Base URL
```
http://localhost:8000
```

## 1. Health Check
**Endpoint**: `GET /health`

**Description**: Check if API is running

**Response** (200 OK):
```json
{
  "status": "ok",
  "debug": false
}
```

---

## 2. Maps Configuration
**Endpoint**: `GET /maps`

**Description**: Get all available maps with configuration

**Query Parameters**: None

**Response** (200 OK):
```json
{
  "maps": [
    {
      "map_id": "AmbroseValley",
      "scale": 900,
      "origin_x": -370.0,
      "origin_z": -473.0,
      "minimap_width": 1024,
      "minimap_height": 1024,
      "minimap_url": "/maps/AmbroseValley_Minimap.png"
    },
    {
      "map_id": "GrandRift",
      "scale": 581,
      "origin_x": -290.0,
      "origin_z": -290.0,
      "minimap_width": 1024,
      "minimap_height": 1024,
      "minimap_url": "/maps/GrandRift_Minimap.png"
    },
    {
      "map_id": "Lockdown",
      "scale": 1000,
      "origin_x": -500.0,
      "origin_z": -500.0,
      "minimap_width": 1024,
      "minimap_height": 1024,
      "minimap_url": "/maps/Lockdown_Minimap.png"
    }
  ]
}
```

---

## 3. List Matches
**Endpoint**: `GET /matches`

**Description**: List available matches with optional filtering

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date` | string (YYYY-MM-DD) | None | Filter by match date |
| `map` | string | None | Filter by map (AmbroseValley, GrandRift, Lockdown) |
| `limit` | integer (1-100) | 20 | Results per page |
| `offset` | integer (≥0) | 0 | Pagination offset |

**Example Request**:
```
GET /matches?date=2026-02-10&map=AmbroseValley&limit=10&offset=0
```

**Response** (200 OK):
```json
{
  "matches": [
    {
      "match_id": "550e8400-e29b-41d4-a716-446655440000",
      "map": "AmbroseValley",
      "date": "2026-02-10",
      "player_count": 45,
      "human_count": 32,
      "bot_count": 13,
      "duration_ms": 1800000
    },
    {
      "match_id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "map": "AmbroseValley",
      "date": "2026-02-10",
      "player_count": 38,
      "human_count": 28,
      "bot_count": 10,
      "duration_ms": 2100000
    }
  ],
  "total": 47,
  "limit": 10,
  "offset": 0
}
```

**Error Responses**:
- 400 Bad Request: Invalid date format
- 400 Bad Request: Invalid limit/offset values

---

## 4. Player Journey
**Endpoint**: `GET /match/{match_id}/journey`

**Description**: Get player movement trajectories for a match

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `match_id` | string (UUID) | Match identifier |

**Query Parameters**: None

**Example Request**:
```
GET /match/550e8400-e29b-41d4-a716-446655440000/journey
```

**Response** (200 OK):
```json
{
  "journeys": [
    {
      "match_id": "550e8400-e29b-41d4-a716-446655440000",
      "player_id": "abc-def-ghi",
      "map": "AmbroseValley",
      "is_bot": false,
      "positions": [
        {
          "pixel_x": 78.0,
          "pixel_y": 890.0,
          "ts": 0
        },
        {
          "pixel_x": 82.0,
          "pixel_y": 888.0,
          "ts": 1000
        },
        {
          "pixel_x": 85.0,
          "pixel_y": 886.0,
          "ts": 2000
        }
      ],
      "start_ts": 0,
      "end_ts": 1800000
    },
    {
      "match_id": "550e8400-e29b-41d4-a716-446655440000",
      "player_id": "123",
      "map": "AmbroseValley",
      "is_bot": true,
      "positions": [
        {
          "pixel_x": 512.0,
          "pixel_y": 512.0,
          "ts": 5000
        }
      ],
      "start_ts": 5000,
      "end_ts": 1750000
    }
  ]
}
```

**Error Responses**:
- 404 Not Found: Match does not exist
- 404 Not Found: No data available for match

---

## 5. Match Events
**Endpoint**: `GET /match/{match_id}/events`

**Description**: Get discrete combat and loot events for a match

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `match_id` | string (UUID) | Match identifier |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `event_type` | string | None | Filter by event type (Kill, Killed, BotKill, BotKilled, Loot, KilledByStorm) |

**Example Request**:
```
GET /match/550e8400-e29b-41d4-a716-446655440000/events?event_type=Kill
```

**Response** (200 OK):
```json
{
  "match_id": "550e8400-e29b-41d4-a716-446655440000",
  "map": "AmbroseValley",
  "events": [
    {
      "event_type": "Kill",
      "pixel_x": 256.0,
      "pixel_y": 768.0,
      "ts": 45000,
      "player_id": "abc-def-ghi",
      "target_id": null
    },
    {
      "event_type": "Kill",
      "pixel_x": 512.0,
      "pixel_y": 512.0,
      "ts": 67000,
      "player_id": "jkl-mno-pqr",
      "target_id": null
    },
    {
      "event_type": "Loot",
      "pixel_x": 270.0,
      "pixel_y": 760.0,
      "ts": 46000,
      "player_id": "abc-def-ghi",
      "target_id": null
    }
  ]
}
```

**Error Responses**:
- 404 Not Found: Match does not exist
- 404 Not Found: No data available for match

---

## 6. Heatmaps
**Endpoint**: `GET /heatmaps/{map_id}/{heatmap_type}`

**Description**: Get aggregated event heatmap for a map

**Path Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `map_id` | string | Map name (AmbroseValley, GrandRift, Lockdown) |
| `heatmap_type` | string | Heatmap type (kills, deaths, traffic) |

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `date_start` | string (YYYY-MM-DD) | 2026-02-10 | Start date (inclusive) |
| `date_end` | string (YYYY-MM-DD) | 2026-02-14 | End date (inclusive) |
| `grid_size` | integer (8-128) | 32 | Grid dimension (NxN) |

**Example Requests**:
```
GET /heatmaps/AmbroseValley/kills
GET /heatmaps/AmbroseValley/kills?grid_size=64
GET /heatmaps/GrandRift/deaths?date_start=2026-02-10&date_end=2026-02-12
GET /heatmaps/Lockdown/traffic?grid_size=16
```

**Response** (200 OK):
```json
{
  "map": "AmbroseValley",
  "heatmap_type": "kills",
  "grid": [
    [0, 5, 10, 15, 20, 25, 30, 35],
    [2, 8, 15, 25, 35, 45, 55, 65],
    [5, 12, 22, 38, 50, 62, 72, 80],
    [8, 18, 32, 50, 68, 82, 90, 95],
    [10, 22, 40, 62, 80, 92, 98, 100],
    [12, 25, 45, 70, 88, 98, 100, 100],
    [15, 28, 50, 75, 92, 100, 100, 95],
    [18, 32, 55, 80, 95, 100, 92, 85]
  ],
  "grid_size": 8,
  "max_value": 100.0
}
```

**Heatmap Types**:
- `kills` - All kill events (Kill + BotKill)
- `deaths` - All death events (Killed + BotKilled + KilledByStorm)
- `traffic` - All movement events (Position + BotPosition)

**Error Responses**:
- 400 Bad Request: Invalid heatmap type
- 400 Bad Request: Invalid date format
- 400 Bad Request: Invalid grid size (outside 8-128 range)

---

## Event Types Reference

| Event Type | Description |
|------------|-------------|
| `Kill` | Player killed another player |
| `Killed` | Player was killed by another player |
| `BotKill` | Player killed a bot |
| `BotKilled` | Bot killed a player |
| `Loot` | Item pickup event |
| `KilledByStorm` | Player killed by zone storm |
| `Position` | Player position update (filtered) |
| `BotPosition` | Bot position update (filtered) |

---

## Response Data Types

### Position Object
```json
{
  "pixel_x": 512.0,
  "pixel_y": 256.0,
  "ts": 5000
}
```

### Event Object
```json
{
  "event_type": "Kill",
  "pixel_x": 256.0,
  "pixel_y": 768.0,
  "ts": 45000,
  "player_id": "player-uuid",
  "target_id": null
}
```

### PlayerJourney Object
```json
{
  "match_id": "match-uuid",
  "player_id": "player-uuid-or-numeric",
  "map": "AmbroseValley",
  "is_bot": false,
  "positions": [...],
  "start_ts": 0,
  "end_ts": 1800000
}
```

### MatchSummary Object
```json
{
  "match_id": "match-uuid",
  "map": "AmbroseValley",
  "date": "2026-02-10",
  "player_count": 45,
  "human_count": 32,
  "bot_count": 13,
  "duration_ms": 1800000
}
```

---

## cURL Examples

### Get All Maps
```bash
curl http://localhost:8000/maps
```

### Get Matches for Date
```bash
curl "http://localhost:8000/matches?date=2026-02-10&limit=5"
```

### Get Matches for Map
```bash
curl "http://localhost:8000/matches?map=AmbroseValley&limit=10"
```

### Get Player Journeys
```bash
curl "http://localhost:8000/match/550e8400-e29b-41d4-a716-446655440000/journey"
```

### Get All Events
```bash
curl "http://localhost:8000/match/550e8400-e29b-41d4-a716-446655440000/events"
```

### Get Kill Events Only
```bash
curl "http://localhost:8000/match/550e8400-e29b-41d4-a716-446655440000/events?event_type=Kill"
```

### Get Kill Heatmap
```bash
curl "http://localhost:8000/heatmaps/AmbroseValley/kills"
```

### Get Custom Grid Heatmap
```bash
curl "http://localhost:8000/heatmaps/GrandRift/deaths?grid_size=64"
```

### Get Date Range Heatmap
```bash
curl "http://localhost:8000/heatmaps/Lockdown/traffic?date_start=2026-02-10&date_end=2026-02-12"
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Resource does not exist |
| 500 | Server Error - Internal error |

---

## Available Data

**Dates**: February 10-14, 2026
**Maps**: AmbroseValley, GrandRift, Lockdown
**Total Matches**: ~400+
**Total Players**: 5000+
**Total Events**: 89,000+

---

## Rate Limiting

Currently: No rate limiting applied

Recommendations for production:
- 100 requests per minute per IP
- 10,000 requests per day per IP

---

## Testing

Access interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Use these interfaces to test all endpoints with live data.

---

**Last Updated**: Implementation Complete
**Version**: 1.0
