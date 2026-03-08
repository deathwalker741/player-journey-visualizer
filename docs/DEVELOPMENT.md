# Development Guide

## Project Structure Overview

```
player-journey-tool/
├── backend/              # FastAPI Python backend
│   ├── app/
│   │   ├── api/         # Route handlers
│   │   ├── services/    # Business logic
│   │   ├── models/      # Data models
│   │   ├── db/          # Database
│   │   └── utils/       # Utilities
│   ├── requirements.txt  # Python dependencies
│   └── main.py          # Entrypoint
│
├── frontend/            # React TypeScript frontend
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API client
│   │   ├── types/       # TypeScript types
│   │   └── utils/       # Utilities
│   ├── public/          # Static assets
│   └── package.json
│
└── docs/                # Documentation
```

---

## Backend Development

### Starting Development Server

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
uvicorn app.main:app --reload --port 8000
```

The `--reload` flag watches for file changes and auto-restarts.

### Project Layout

#### `app/config.py`
Centralized configuration from environment variables. Use `get_settings()` to access.

```python
from app.config import get_settings

settings = get_settings()
print(settings.DATA_PATH)
```

#### `app/models/schemas.py`
Pydantic models for API validation and serialization. Automatically generates OpenAPI docs.

```python
from app.models.schemas import MatchSummary

# Use in routes
@app.get("/api/matches", response_model=MatchListResponse)
async def list_matches():
    ...
```

#### `app/services/`
Core business logic, separated from API routes:
- `data_loader.py` - Load parquet files
- `coord_transform.py` - World ↔ Minimap conversions
- `heatmap_generator.py` - Compute heatmaps
- `event_processor.py` - Parse event data
- `cache_manager.py` - Caching layer

**Example:**
```python
from app.services.data_loader import load_match_data
from app.services.coord_transform import world_to_minimap_pixel

df = load_match_data("match-123", "../player_data")
pixel_x, pixel_y = world_to_minimap_pixel(100, 200, "AmbroseValley")
```

#### `app/api/`
API route handlers. Keep these thin — delegate logic to services.

**Example route structure:**
```python
from fastapi import APIRouter, HTTPException, Query
from app.models.schemas import MatchListResponse
from app.services.data_loader import list_matches

router = APIRouter()

@router.get("/matches", response_model=MatchListResponse)
async def get_matches(
    date: Optional[str] = Query(None),
    map: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100),
):
    """List matches with filters."""
    # Validation is automatic via Pydantic
    # Call service layer
    matches = list_matches(date=date, map=map, limit=limit)
    return matches
```

#### `app/db/database.py`
SQLite for metadata caching. Automatically initialized on startup.

```python
from app.db.database import get_db_connection

conn = get_db_connection()
cursor = conn.cursor()
cursor.execute("SELECT * FROM matches WHERE date = ?", (date,))
results = cursor.fetchall()
```

---

### Adding a New API Endpoint

**Step 1:** Create data model in `models/schemas.py`

```python
class NewResponse(BaseModel):
    value: str = Field(..., description="Value description")
```

**Step 2:** Implement business logic in `services/`

```python
# services/new_service.py
def get_data(param: str):
    # Load, transform, return
    return result
```

**Step 3:** Create route in `api/new_endpoint.py`

```python
from fastapi import APIRouter
from app.models.schemas import NewResponse
from app.services.new_service import get_data

router = APIRouter()

@router.get("/new", response_model=NewResponse)
async def new_endpoint(param: str):
    data = get_data(param)
    return data
```

**Step 4:** Register in `main.py`

```python
from app.api import new_endpoint
app.include_router(new_endpoint.router, prefix="/api")
```

---

### Testing Backend

```bash
# Run all tests
pytest tests/

# Run specific test file
pytest tests/test_data_loader.py

# Run with coverage
pytest --cov=app tests/

# Run in watch mode
pytest-watch tests/
```

**Example test:**
```python
# tests/test_coord_transform.py
from app.utils.coord_transform import world_to_minimap_pixel

def test_world_to_minimap_conversion():
    x, y = world_to_minimap_pixel(-301.45, -355.55, "AmbroseValley")
    assert x == pytest.approx(78, abs=1)
    assert y == pytest.approx(890, abs=1)
```

---

### Debugging

Enable verbose logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

Use FastAPI debug mode:
```bash
DEBUG=True uvicorn app.main:app --reload
```

Check database:
```bash
sqlite3 cache.db
> SELECT * FROM matches LIMIT 5;
> .schema
```

---

## Frontend Development

### Starting Dev Server

```bash
cd frontend
npm install  # If needed
npm start
```

Opens `http://localhost:3000` with hot reload.

### Project Layout

#### `src/types/index.ts`
TypeScript interfaces matching backend API:

```typescript
// Match with API response structure
interface Match {
  match_id: string;
  map: "AmbroseValley" | "GrandRift" | "Lockdown";
  date: string;
  player_count: number;
}

interface Position {
  pixel_x: number;
  pixel_y: number;
  ts: number;
}
```

#### `src/services/api.ts`
HTTP client for all backend calls:

```typescript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const api = {
  getMatches: (date?: string, map?: string) =>
    axios.get(`${API_URL}/matches`, { params: { date, map } }),
  
  getJourney: (matchId: string) =>
    axios.get(`${API_URL}/match/${matchId}/journey`),
};
```

#### `src/hooks/`
Custom React hooks for data fetching:

```typescript
// useMatches.ts
import { useEffect, useState } from 'react';
import { api } from '../services/api';

export function useMatches(date?: string, map?: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getMatches(date, map)
      .then(r => setData(r.data))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [date, map]);

  return { data, loading, error };
}
```

#### `src/components/`
React components for UI. Keep them focused and composable:

```typescript
// FilterPanel.tsx
interface FilterPanelProps {
  onDateChange: (date: string) => void;
  onMapChange: (map: string) => void;
}

export function FilterPanel({ onDateChange, onMapChange }: FilterPanelProps) {
  return (
    <div className="panel">
      <label>
        Date:
        <input type="date" onChange={e => onDateChange(e.target.value)} />
      </label>
      <label>
        Map:
        <select onChange={e => onMapChange(e.target.value)}>
          <option value="">All</option>
          <option value="AmbroseValley">Ambrose Valley</option>
          <option value="GrandRift">Grand Rift</option>
          <option value="Lockdown">Lockdown</option>
        </select>
      </label>
    </div>
  );
}
```

---

### Adding a New Component

**Step 1:** Define types in `src/types/index.ts`

**Step 2:** Create component file `src/components/MyComponent.tsx`

```typescript
import React from 'react';
import { useMyData } from '../hooks/useMyData';

export function MyComponent() {
  const { data, loading, error } = useMyData();

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return <div>{/* Render data */}</div>;
}
```

**Step 3:** Use in App or parent component

```typescript
import { MyComponent } from './components/MyComponent';

function App() {
  return <MyComponent />;
}
```

---

### Testing Frontend

```bash
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

**Example test:**
```typescript
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

test('renders component', () => {
  render(<MyComponent />);
  expect(screen.getByText(/expected text/i)).toBeInTheDocument();
});
```

---

## Data Processing Workflow

### Loading Match Data

```python
# 1. Scan files
files = scan_data_files("../player_data")

# 2. Load specific match
df = load_match_data("match-123", "../player_data")

# 3. Process
df = df[df['event'] != 'Position']  # Filter out position samples

# 4. Transform coordinates
df[['pixel_x', 'pixel_y']] = df.apply(
    lambda row: world_to_minimap_pixel(row['x'], row['z'], row['map_id']),
    axis=1,
    result_type='expand'
)

# 5. Return as JSON
return [row.to_dict() for _, row in df.iterrows()]
```

---

## Common Tasks

### Add New Map

1. Update `utils/constants.py`:
```python
MAPS["NewMap"] = MapConfig(
    name="NewMap",
    scale=1000,
    origin_x=-500,
    origin_z=-500,
)
```

2. Add minimap image to `frontend/public/maps/`

3. Update enums in `models/schemas.py`:
```python
class MapId(str, Enum):
    NEW_MAP = "NewMap"
```

### Optimize Performance

**Backend:**
- Cache results: `@lru_cache()` decorator
- Batch load files: `BATCH_SIZE` setting
- Pre-compute heatmaps: Background job

**Frontend:**
- Lazy load components: `React.lazy()` + `Suspense`
- Memoize callbacks: `useCallback()`, `useMemo()`
- Virtual scrolling for large lists

### Add Database Query

```python
# db/database.py - add query function
def get_matches_by_date(db_conn, date):
    cursor = db_conn.cursor()
    cursor.execute(
        "SELECT * FROM matches WHERE date = ? ORDER BY created_at DESC",
        (date,)
    )
    return [dict(row) for row in cursor.fetchall()]
```

---

## Environment Setup

### Backend .env
```
DATA_PATH=../player_data
DB_PATH=./cache.db
DEBUG=True
LOG_LEVEL=DEBUG
```

### Frontend .env
```
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_DEBUG=true
```

---

## Resources

- **FastAPI:** https://fastapi.tiangolo.com/
- **Pandas:** https://pandas.pydata.org/docs/
- **React:** https://react.dev/
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Deck.gl:** https://deck.gl/docs

