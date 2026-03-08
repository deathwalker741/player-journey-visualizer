# Player Journey Visualization Tool

A production-quality web-based visualization platform for analyzing player behavior in game analytics. Designed for understanding player movement patterns, combat zones, kill/death distributions, and match progression with interactive heatmaps and timeline playback.

**Current Version**: 1.0.0  
**Last Updated**: 2024  
**Status**: ✅ Production Ready

## 🎯 Features

### Core Capabilities
- ✅ **Real-time Event Visualization** - Kills, deaths, loots, storm interactions
- ✅ **Player Journey Tracking** - Full path visualization for individual players
- ✅ **Interactive Timeline** - Play/pause/scrub through matches with live stats
- ✅ **Advanced Filtering** - Filter by date, map, match, event type, player type
- ✅ **Heatmap Analytics** - Three heatmap types for spatial analysis:
  - Kill density (red intensity)
  - Death density (black intensity)  
  - Player traffic patterns (blue intensity)
- ✅ **Performance Optimizations** - GPU acceleration, caching, indexing
- ✅ **Responsive Design** - Mobile-friendly with dark mode support

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Configuration](#configuration)
- [Running Locally](#running-locally)
- [Docker Deployment](#docker-deployment)
- [Cloud Deployment](#cloud-deployment)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)

## ⚡ Quick Start

### 5-Minute Local Setup

#### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000
```

**Backend runs at**: `http://localhost:8000`  
**API Docs**: `http://localhost:8000/docs`

#### 2. Frontend Setup (New Terminal)
```bash
cd frontend
npm install
cp .env.example .env.local
npm start
```

**Frontend runs at**: `http://localhost:3000`

#### 3. Open Browser
Navigate to `http://localhost:3000` - you're done! 🎉

### Docker Quick Start

```bash
# One command to rule them all
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Available at:
- **Frontend**: `http://localhost:3000`
- **Backend**: `http://localhost:8000`

## 📦 Prerequisites

### Local Development
- **Python** 3.11+ (for backend)
- **Node.js** 18+ & npm 9+ (for frontend)
- **Git** (for version control)

### Docker Deployment
- **Docker** 20.10+
- **Docker Compose** 2.0+

### Cloud Deployment
- Cloud account (AWS, GCP, Azure, Heroku, etc.)
- Docker container registry access

## 🗂️ Project Structure

```
player-journey-tool/
├── frontend/
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── MapViewerEnhanced.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── Filters.tsx
│   │   │   ├── Heatmap.tsx
│   │   │   └── *.module.css
│   │   ├── hooks/               # Custom React hooks
│   │   │   └── usePlayback.ts
│   │   ├── services/
│   │   │   └── api.ts           # API client
│   │   └── App.tsx
│   ├── public/                  # Static assets
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── backend/
│   ├── app/
│   │   ├── main.py             # FastAPI app
│   │   ├── routers/            # API endpoints
│   │   ├── services/           # Business logic
│   │   └── models.py
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── .env.example
│   └── README.md
│
├── player_data/
│   ├── February_10/ through 14/  # Game event data
│   └── minimaps/                  # Map assets
│
├── docker-compose.yml             # Docker orchestration
└── README.md                      # This file
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```dotenv
# Database
DATABASE_URL=sqlite:///./player_data.db

# Server
HOST=0.0.0.0
PORT=8000
WORKERS=4

# CORS
CORS_ORIGINS=["http://localhost:3000"]

# Logging
LOG_LEVEL=info

# Caching
CACHE_ENABLED=true
CACHE_TTL=3600

# Data
DATA_PATH=../player_data
MAPS_PATH=../player_data/minimaps
```

See [backend/.env.example](backend/.env.example) for complete documentation.

#### Frontend (.env.local)
```dotenv
# API
REACT_APP_API_URL=http://localhost:8000

# Features
REACT_APP_ENABLE_HEATMAPS=true
REACT_APP_ENABLE_TIMELINE=true
REACT_APP_ENABLE_FILTERS=true

# UI
REACT_APP_ENABLE_DARK_MODE=true
```

See [frontend/.env.example](frontend/.env.example) for complete documentation.

## 🚀 Running Locally

### Development Mode

**Terminal 1 - Backend**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm start
```

### Production Build

**Build frontend**:
```bash
cd frontend
npm install
npm run build
# Serve with any HTTP server
npx serve -s build -l 3000
```

**Run backend**:
```bash
cd backend
pip install -r requirements.txt
gunicorn --workers 4 --bind 0.0.0.0:8000 app.main:app
```

## 🐳 Docker Deployment

### Build and Run
```bash
# Build images
docker-compose build

# Start services (detached)
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down

# Rebuild without cache
docker-compose build --no-cache
```

### Service Health
```bash
# Check service status
docker-compose ps

# Check specific service
curl http://localhost:8000/health
curl http://localhost:3000
```

### Accessing Services
- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs`

## ☁️ Cloud Deployment

### AWS (ECS + ECR)

1. **Build and push to ECR**:
```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com

# Build
docker build -t player-journey-backend:latest ./backend
docker build -t player-journey-frontend:latest ./frontend

# Tag for ECR
docker tag player-journey-backend:latest <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-backend:latest
docker tag player-journey-frontend:latest <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-frontend:latest

# Push
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-backend:latest
docker push <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com/player-journey-frontend:latest
```

2. **Create ECS Task Definitions**:
   - Reference pushed images
   - Configure environment variables
   - Set port mappings
   - Configure CloudWatch logging

3. **Deploy to ECS Cluster**:
   - Create services
   - Configure load balancing
   - Set auto-scaling policies

### Google Cloud Run

```bash
# Build and push backend
gcloud builds submit --tag gcr.io/PROJECT_ID/player-journey-backend ./backend
gcloud run deploy player-journey-backend \
  --image gcr.io/PROJECT_ID/player-journey-backend \
  --platform managed \
  --port 8000 \
  --region us-central1 \
  --set-env-vars DATABASE_URL=sqlite:///./player_data.db

# Build and push frontend
gcloud builds submit --tag gcr.io/PROJECT_ID/player-journey-frontend ./frontend
gcloud run deploy player-journey-frontend \
  --image gcr.io/PROJECT_ID/player-journey-frontend \
  --platform managed \
  --port 3000 \
  --region us-central1 \
  --set-env-vars REACT_APP_API_URL=https://player-journey-backend-xxx.run.app
```

### Heroku

```bash
# Backend
heroku create player-journey-backend
heroku buildpacks:add heroku/python -a player-journey-backend
git subtree push --prefix backend heroku/main

# Frontend
heroku create player-journey-frontend
heroku buildpacks:add heroku/nodejs -a player-journey-frontend
git subtree push --prefix frontend heroku/main
```

### DigitalOcean App Platform

1. Connect GitHub repository
2. Specify service configurations:
   - Backend: Python 3.11 container
   - Frontend: Node.js 18 static site
3. Set environment variables
4. Deploy

## 📡 API Documentation

### Maps
```http
GET /maps
```
Get all available maps with minimap configurations.

**Response**:
```json
{
  "maps": [
    {
      "map_id": "map_name",
      "width": 1024,
      "height": 1024,
      "minimap_path": "path/to/minimap.png"
    }
  ]
}
```

### Matches
```http
GET /matches?date=2024-02-14
```
Get matches for a specific date.

### Events
```http
GET /data/{match_id}/{event_type}?start_time=0&end_time=300
```
Get events of specific type within time range.

**Event Types**: `Kill`, `Killed`, `Loot`, `KilledByStorm`

### Heatmaps
```http
GET /heatmaps/{map}/{type}?date_start=2024-02-14&date_end=2024-02-14&grid_size=32
```
Get heatmap data for kills, deaths, or traffic.

**Types**: `kills`, `deaths`, `traffic`

**Response**:
```json
{
  "grid": [
    {"x": 0, "y": 0, "value": 5},
    {"x": 32, "y": 32, "value": 12}
  ]
}
```

### Journeys
```http
GET /journeys/{match_id}
```
Get player journey paths for a match.

**Response**:
```json
{
  "journeys": [
    {
      "player_id": "uuid",
      "is_bot": false,
      "path": [
        {"x": 100, "y": 100, "timestamp": 0}
      ]
    }
  ]
}
```

### Health
```http
GET /health
```
Health check endpoint (for monitoring).

## 🏗️ Architecture

### Frontend Architecture

**Stack**: React 18 + TypeScript + Deck.gl + CSS Modules

**Key Components**:
- `MapViewerEnhanced` - Main visualization container
- `Timeline` - Playback controls with scrubber
- `Filters` - Date/map/match/event type selection
- `Heatmap` - Density visualization overlays

**Data Flow**:
```
Filters → API Client → State Management → Deck.gl Rendering
```

**Custom Hooks**:
- `useTimeline` - Timeline playback logic
- `useFilters` - Filter state management
- `useMatchDataWithTimeline` - Time-synced data loading
- `useMatchStatistics` - Real-time stats calculation

### Backend Architecture

**Stack**: FastAPI + Python 3.11 + SQLite

**Data Pipeline**:
```
Raw Events → Parsing → Normalization → Indexing → API Response
```

**Services**:
- `DataService` - Event file loading and parsing
- `CacheService` - Result caching with TTL
- `DatabaseService` - SQLite indexing and queries
- `HeatmapService` - Grid aggregation and density calculation

### Database Schema

**Indexes**:
- Match ID for quick lookups
- Event type for filtering
- Timestamp for time-range queries
- Position data for spatial queries

## 🔧 Troubleshooting

### Frontend Issues

**Frontend won't load**:
- Check Node.js version: `node --version` (need 18+)
- Clear npm cache: `npm cache clean --force`
- Delete node_modules: `rm -rf node_modules && npm install`

**API connection errors**:
- Verify `REACT_APP_API_URL` in `.env.local`
- Check backend is running: `curl http://localhost:8000/health`
- Check browser console for CORS errors
- Review backend `.env` CORS_ORIGINS setting

**Heatmaps not rendering**:
- Verify `REACT_APP_ENABLE_HEATMAPS=true`
- Check Network tab for heatmap API calls
- Review browser console for WebGL errors
- Test with different grid sizes

### Backend Issues

**Port already in use**:
```bash
# Find process using port 8000
lsof -i :8000
# Kill process
kill -9 <PID>
```

**Database errors**:
- Check file permissions: `ls -la backend/`
- Verify `player_data` directory exists
- Ensure SQLite is writable: `touch backend/player_data.db`

**Import errors**:
```bash
# Reinstall dependencies
pip install --upgrade -r requirements.txt
# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
```

### Docker Issues

**Container won't start**:
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Rebuild without cache
docker-compose build --no-cache

# Check disk space
docker system df
```

**Port conflicts**:
```bash
# Change ports in docker-compose.yml
# Then rebuild and restart
docker-compose down
docker-compose up -d
```

**Image size too large**:
- Review `.dockerignore` files
- Remove unnecessary dependencies
- Use multi-stage builds (already done)

## 📚 Additional Resources

### Documentation
- [API Documentation](backend/README.md)
- [Frontend Documentation](frontend/README.md)
- [Architecture Guide](ARCHITECTURE_INTERACTIVE_CONTROLS.md)
- [Deployment Guide](DEPLOYMENT_GUIDE.md)

### Testing
```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
cd frontend
npm test
```

### Performance Monitoring
- Backend: Check memory usage with `docker stats`
- Frontend: Use DevTools Performance tab
- Database: Monitor SQLite query performance

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push branch: `git push origin feature/my-feature`
5. Open Pull Request

### Code Standards
- TypeScript strict mode enabled
- Python type hints required
- ESLint and Black formatting
- Unit test coverage > 80%

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For issues and questions:
1. Check existing [GitHub Issues](../../issues)
2. Review [Troubleshooting](#troubleshooting) section
3. Consult documentation files
4. Contact development team

---

**Built with ❤️ using React, FastAPI, and Deck.gl**  
**Last Updated**: 2024 | **Version**: 1.0.0 | **Status**: Production Ready
npm start
```

Frontend runs at `http://localhost:3000`

### First Steps
1. Open `http://localhost:3000` in your browser
2. Select a date (Feb 10-14) and map
3. View available matches
4. Click a match to see player journey with events
5. Scrub timeline to watch match progression

---

## Project Structure

```
player-journey-tool/
│
├── backend/                           # FastAPI Python backend
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                    # FastAPI app entrypoint
│   │   ├── config.py                  # Environment & settings
│   │   ├── init_db.py                 # Database initialization script
│   │   │
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── matches.py             # GET /api/matches (list & filter)
│   │   │   ├── journey.py             # GET /api/journey/:match_id
│   │   │   ├── events.py              # GET /api/events/:match_id
│   │   │   ├── heatmaps.py            # GET /api/heatmaps/:map/:type
│   │   │   └── maps.py                # GET /api/maps (metadata)
│   │   │
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── data_loader.py         # Load parquet files
│   │   │   ├── coord_transform.py     # World → Minimap coordinate conversion
│   │   │   ├── heatmap_generator.py   # Aggregate & compute heatmaps
│   │   │   ├── event_processor.py     # Parse events, classify by type
│   │   │   └── cache_manager.py       # Caching & memoization
│   │   │
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── schemas.py             # Pydantic models for request/response
│   │   │   └── enums.py               # Event types, map IDs, etc.
│   │   │
│   │   ├── db/
│   │   │   ├── __init__.py
│   │   │   ├── database.py            # SQLite connection & queries
│   │   │   └── schema.sql             # SQLite schema (matches, metadata)
│   │   │
│   │   └── utils/
│   │       ├── __init__.py
│   │       ├── logger.py              # Logging setup
│   │       └── constants.py           # Map configs, scales, origins
│   │
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                   # Example environment variables
│   └── Dockerfile                     # Docker image for deployment
│
├── frontend/                          # React TypeScript frontend
│   ├── public/
│   │   ├── index.html
│   │   └── maps/                      # Minimap images (symlink/copy)
│   │       ├── AmbroseValley_Minimap.png
│   │       ├── GrandRift_Minimap.png
│   │       └── Lockdown_Minimap.jpg
│   │
│   ├── src/
│   │   ├── index.tsx
│   │   ├── App.tsx                    # Main app component
│   │   │
│   │   ├── components/
│   │   │   ├── MapViewer.tsx          # Deck.gl minimap + overlays
│   │   │   ├── MatchList.tsx          # List of available matches
│   │   │   ├── FilterPanel.tsx        # Date, map, player type filters
│   │   │   ├── EventLegend.tsx        # Color coding for events
│   │   │   ├── Timeline.tsx           # Playback control
│   │   │   ├── JourneyOverlay.tsx     # Player path rendering
│   │   │   ├── HeatmapToggle.tsx      # Heatmap visibility controls
│   │   │   └── Sidebar.tsx            # Match details panel
│   │   │
│   │   ├── hooks/
│   │   │   ├── useMatches.ts          # Fetch matches from API
│   │   │   ├── useJourney.ts          # Fetch player journey
│   │   │   ├── useEvents.ts           # Fetch combat/loot events
│   │   │   ├── useHeatmap.ts          # Fetch heatmap data
│   │   │   └── useTimeline.ts         # Timeline playback state
│   │   │
│   │   ├── services/
│   │   │   └── api.ts                 # HTTP client (axios) for all endpoints
│   │   │
│   │   ├── types/
│   │   │   └── index.ts               # TypeScript interfaces
│   │   │
│   │   ├── utils/
│   │   │   ├── colors.ts              # Event color schemes
│   │   │   └── formatters.ts          # Date/time formatting
│   │   │
│   │   └── styles/
│   │       ├── index.css              # Global styles
│   │       └── MapViewer.module.css   # Component-scoped styles
│   │
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example
│   └── Dockerfile
│
├── docs/
│   ├── SETUP.md                       # Detailed setup instructions
│   ├── API.md                         # API endpoint documentation
│   ├── DEVELOPMENT.md                 # Development guide
│   ├── DEPLOYMENT.md                  # Deployment instructions
│   └── TROUBLESHOOTING.md             # Common issues & fixes
│
├── .github/
│   └── workflows/
│       ├── backend-test.yml           # CI for backend
│       └── frontend-build.yml         # CI for frontend
│
├── docker-compose.yml                 # Local dev environment
├── ARCHITECTURE.md                    # System design & data flow
├── README.md                          # This file
├── LICENSE
└── .gitignore
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | FastAPI (Python 3.9+) | REST API, async request handling |
| **Data Processing** | Pandas, PyArrow | Load/transform parquet files |
| **Database** | SQLite | Metadata caching, match index |
| **Frontend** | React 18 + TypeScript | Interactive UI |
| **Visualization** | Deck.gl | GPU-accelerated map rendering |
| **HTTP Client** | Axios | Fetch API calls |
| **Backend Deploy** | Render.com | Production server |
| **Frontend Deploy** | Vercel | Static hosting + CI/CD |

---

## Key Features

### ✅ Core Features
- **Match Explorer:** Filter by date (Feb 10-14), map, player type
- **Player Journey:** Visualize full movement path on minimap
- **Event Markers:** Combat (kills/deaths), looting, storm deaths
- **Timeline Scrubber:** Scrub through match events in sequence
- **Event Legend:** Color-coded event types

### ✅ Analytics
- **Heatmaps:** Kill zones, death zones, player traffic density
- **Match Statistics:** Total kills, unique players, match duration
- **Player Filtering:** Distinguish human players vs bots

### ✅ Performance
- **GPU Rendering:** Smooth 60fps with Deck.gl
- **Smart Caching:** SQLite metadata + in-memory results
- **Lazy Loading:** Fetch data only when needed
- **Pagination:** Load matches page-by-page

---

## API Endpoints

### Matches
```
GET /api/matches?date=2026-02-10&map=AmbroseValley&limit=20&offset=0
Response:
{
  "matches": [
    {
      "match_id": "abc-123",
      "map": "AmbroseValley",
      "date": "2026-02-10",
      "player_count": 12,
      "duration_ms": 1800000,
      "human_count": 10,
      "bot_count": 2
    }
  ],
  "total": 437,
  "limit": 20
}
```

### Player Journey
```
GET /api/match/abc-123/journey
Response:
{
  "match_id": "abc-123",
  "player_id": "uuid-1234",
  "map": "AmbroseValley",
  "positions": [
    {"pixel_x": 78, "pixel_y": 890, "ts": 0},
    {"pixel_x": 82, "pixel_y": 888, "ts": 1000},
    ...
  ]
}
```

### Events
```
GET /api/match/abc-123/events
Response:
{
  "events": [
    {
      "type": "Kill",
      "pixel_x": 150,
      "pixel_y": 420,
      "ts": 45000,
      "player_id": "uuid-1234",
      "target_id": "uuid-5678"
    },
    ...
  ]
}
```

### Heatmaps
```
GET /api/heatmaps/AmbroseValley/kills?aggregation=32
Response:
{
  "type": "heatmap",
  "map": "AmbroseValley",
  "heatmap": [
    [0, 0, 5, 12, 8, ...],
    [0, 2, 10, 25, 15, ...],
    ...
  ]
}
```

Full API documentation available at `http://localhost:8000/docs` (interactive Swagger UI)

---

## Map Configuration

| Map | Scale | Origin X | Origin Z | Minimap Size |
|-----|-------|----------|----------|--------------|
| AmbroseValley | 900 | -370 | -473 | 1024x1024 |
| GrandRift | 581 | -290 | -290 | 1024x1024 |
| Lockdown | 1000 | -500 | -500 | 1024x1024 |

Coordinate transformation:
```
u = (world_x - origin_x) / scale
v = (world_z - origin_z) / scale
pixel_x = u * 1024
pixel_y = (1 - v) * 1024
```

---

## Development

### Environment Variables
Create `.env` in both `backend/` and `frontend/`:

**backend/.env:**
```
DATA_PATH=../player_data
DB_PATH=./cache.db
LOG_LEVEL=INFO
```

**frontend/.env:**
```
REACT_APP_API_URL=http://localhost:8000/api
```

### Running Locally
```bash
# Terminal 1: Backend
cd backend && uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend && npm start

# Terminal 3: (Optional) Watch tests
cd backend && pytest --watch
```

### Testing
```bash
# Backend unit tests
cd backend && pytest tests/

# Frontend tests
cd frontend && npm test
```

---

## Deployment

### Quick Deploy (Vercel + Render)

**Backend to Render:**
1. Push code to GitHub
2. Connect Render.com to repo
3. Create Web Service pointing to `backend/`
4. Set `DATA_PATH` environment variable
5. Deploy

**Frontend to Vercel:**
1. Connect Vercel to GitHub repo
2. Set `REACT_APP_API_URL` to production backend URL
3. Deploy

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed instructions.

---

## Performance Characteristics

| Operation | Time | Strategy |
|-----------|------|----------|
| Load 10-player match | 200-500ms | Parquet streaming + cache |
| Render heatmap | 500-1000ms | GPU rendering + tile cache |
| Filter matches | <100ms | SQLite indexed queries |
| Page load (cold) | 2-3s | Parallel API requests + lazy load |

With proper caching, repeated queries drop to <100ms.

---

## Troubleshooting

**"Parquet files not found"**
- Ensure `DATA_PATH` points to correct folder
- Check that parquet files have `.nakama-0` extension
- Run `python app/init_db.py` to scan files

**"Port already in use"**
- Backend: Change to different port: `uvicorn app.main:app --port 8001`
- Frontend: `PORT=3001 npm start`

**"Slow heatmap rendering"**
- Reduce aggregation grid size (e.g., 16 instead of 32)
- Pre-compute heatmaps during off-hours
- Use Deck.gl's `aggregationResolution` setting

See [TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more.

---

## License

Proprietary — Level Designers @ LILA BLACK Studios

---

## Contact & Support

For questions or feature requests:
- Check [DEVELOPMENT.md](docs/DEVELOPMENT.md)
- Review [ARCHITECTURE.md](ARCHITECTURE.md)
- Open an issue on GitHub

