# API Documentation

## Base URL

**Development:** `http://localhost:8000/api`  
**Production:** `https://your-backend-domain/api`

## Authentication

Currently, no authentication required. For production, implement API key or JWT.

---

## Endpoints

### Matches

#### List Matches

```
GET /api/matches?date=2026-02-10&map=AmbroseValley&limit=20&offset=0
```

**Parameters:**
- `date` (string, optional): Filter by date (YYYY-MM-DD)
- `map` (string, optional): Filter by map (AmbroseValley, GrandRift, Lockdown)
- `limit` (integer, default: 20): Results per page
- `offset` (integer, default: 0): Pagination offset

**Response:**
```json
{
  "matches": [
    {
      "match_id": "abc-123-def",
      "map": "AmbroseValley",
      "date": "2026-02-10",
      "player_count": 12,
      "human_count": 10,
      "bot_count": 2,
      "duration_ms": 1800000
    }
  ],
  "total": 437,
  "limit": 20,
  "offset": 0
}
```

**Status Codes:**
- `200 OK` - Success
- `400 Bad Request` - Invalid parameters

---

### Journey

#### Get Player Journeys

```
GET /api/match/{match_id}/journey
```

**Parameters:**
- `match_id` (string, required): Match identifier

**Response:**
```json
{
  "journeys": [
    {
      "match_id": "abc-123",
      "player_id": "f4e072fa-b7af-4761-b567-1d95b7ad0108",
      "map": "AmbroseValley",
      "is_bot": false,
      "positions": [
        {"pixel_x": 78, "pixel_y": 890, "ts": 0},
        {"pixel_x": 82, "pixel_y": 888, "ts": 500},
        {"pixel_x": 85, "pixel_y": 885, "ts": 1000}
      ],
      "start_ts": 0,
      "end_ts": 1800000
    }
  ]
}
```

**Notes:**
- `pixel_x`, `pixel_y`: Coordinates in 1024x1024 minimap space
- `ts`: Timestamp in milliseconds (relative to match start)
- `is_bot`: Whether player is AI-controlled

---

### Events

#### Get Match Events

```
GET /api/match/{match_id}/events
```

**Parameters:**
- `match_id` (string, required): Match identifier
- `event_type` (string, optional): Filter by event type

**Response:**
```json
{
  "match_id": "abc-123",
  "map": "AmbroseValley",
  "events": [
    {
      "event_type": "Kill",
      "pixel_x": 150,
      "pixel_y": 420,
      "ts": 45000,
      "player_id": "uuid-1234",
      "target_id": "uuid-5678"
    },
    {
      "event_type": "Loot",
      "pixel_x": 152,
      "pixel_y": 422,
      "ts": 45500,
      "player_id": "uuid-1234",
      "target_id": null
    }
  ]
}
```

**Event Types:**
- `Kill` - Human player killed human player
- `Killed` - Human player was killed
- `BotKill` - Human killed bot
- `BotKilled` - Human killed by bot
- `Loot` - Player picked up item
- `KilledByStorm` - Player died to storm

---

### Heatmaps

#### Get Heatmap

```
GET /api/heatmaps/{map}/{type}?aggregation=32&date_start=2026-02-10&date_end=2026-02-12
```

**Parameters:**
- `map` (string, required): Map name (AmbroseValley, GrandRift, Lockdown)
- `type` (string, required): Heatmap type (kills, deaths, traffic)
- `aggregation` (integer, default: 32): Grid size (NxN)
- `date_start` (string, optional): Start date (YYYY-MM-DD)
- `date_end` (string, optional): End date (YYYY-MM-DD)

**Response:**
```json
{
  "map": "AmbroseValley",
  "heatmap_type": "kills",
  "grid": [
    [0, 0, 5, 12, 8],
    [0, 2, 10, 25, 15],
    [3, 8, 20, 45, 30],
    [5, 12, 35, 60, 50],
    [8, 18, 40, 55, 40]
  ],
  "grid_size": 32,
  "max_value": 100
}
```

**Heatmap Types:**
- `kills` - Locations where kills occurred
- `deaths` - Locations where players died
- `traffic` - Player position density

**Notes:**
- Grid values are normalized (0-100 scale)
- Each cell represents an area on the minimap
- Use `max_value` to normalize rendering

---

### Maps

#### Get Map Metadata

```
GET /api/maps
```

**Response:**
```json
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
    {
      "map_id": "GrandRift",
      "scale": 581,
      "origin_x": -290,
      "origin_z": -290,
      "minimap_width": 1024,
      "minimap_height": 1024,
      "minimap_url": "/maps/GrandRift_Minimap.png"
    },
    {
      "map_id": "Lockdown",
      "scale": 1000,
      "origin_x": -500,
      "origin_z": -500,
      "minimap_width": 1024,
      "minimap_height": 1024,
      "minimap_url": "/maps/Lockdown_Minimap.jpg"
    }
  ]
}
```

---

## Error Responses

All errors return JSON with `detail` field:

```json
{
  "detail": "Match not found"
}
```

**Common Status Codes:**
- `400 Bad Request` - Invalid parameters
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

**Development:** No rate limiting  
**Production:** Implement rate limiting (e.g., 100 req/min per IP)

---

## Caching

For performance:
- Match metadata cached in SQLite (persistent)
- Journey/event data cached in-memory (1 hour TTL)
- Heatmaps cached (24 hour TTL)

---

## Example Workflows

### 1. Browse Matches for a Date

```javascript
const matches = await fetch(
  'http://localhost:8000/api/matches?date=2026-02-10&limit=20'
).then(r => r.json());
```

### 2. Load a Specific Match

```javascript
const journey = await fetch(
  'http://localhost:8000/api/match/abc-123/journey'
).then(r => r.json());

const events = await fetch(
  'http://localhost:8000/api/match/abc-123/events'
).then(r => r.json());
```

### 3. Get Kill Zone Heatmap

```javascript
const heatmap = await fetch(
  'http://localhost:8000/api/heatmaps/AmbroseValley/kills'
).then(r => r.json());
```

---

## Interactive Testing

Visit `http://localhost:8000/docs` for interactive Swagger UI where you can test all endpoints with forms.

