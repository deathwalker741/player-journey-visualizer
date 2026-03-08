# Quick Reference Guide

Fast lookup for common tasks and commands.

## 🚀 Starting the Application

### Local Development (5 minutes)
```bash
# Terminal 1: Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --port 8000

# Terminal 2: Frontend
cd frontend
npm install
cp .env.example .env.local
npm start
```
**Access**: Frontend at `http://localhost:3000`, API at `http://localhost:8000`

### Docker Quick Start (2 minutes)
```bash
docker-compose build
docker-compose up -d
```
**Access**: Same URLs

### Stop Services
```bash
docker-compose down
```

## 📁 Key Files & Directories

| File/Directory | Purpose |
|---|---|
| `README.md` | Main documentation & getting started |
| `DEPLOYMENT_GUIDE.md` | Detailed deployment procedures |
| `PHASE_5_COMPLETION.md` | Phase 5 deliverables summary |
| `QUICK_REFERENCE.md` | This file - quick command lookup |
| `docker-compose.yml` | Service orchestration config |
| `frontend/src/components/` | React components |
| `backend/app/` | FastAPI application code |
| `player_data/` | Game event data files |

## 🔧 Common Configuration Tasks

### Change API URL (for frontend)
Edit `frontend/.env.local`:
```bash
REACT_APP_API_URL=https://your-api.com
```

### Change Logging Level (backend)
Edit `backend/.env`:
```bash
LOG_LEVEL=debug  # options: debug, info, warning, error
```

### Enable/Disable Features
Edit `frontend/.env.local`:
```bash
REACT_APP_ENABLE_HEATMAPS=true    # true or false
REACT_APP_ENABLE_TIMELINE=true
REACT_APP_ENABLE_FILTERS=true
REACT_APP_ENABLE_DARK_MODE=true
```

### Configure CORS Origins (backend)
Edit `backend/.env`:
```bash
CORS_ORIGINS=["http://localhost:3000", "https://your-domain.com"]
```

### Adjust Database Location (backend)
Edit `backend/.env`:
```bash
DATABASE_URL=sqlite:///./path/to/player_data.db
```

## 🐛 Troubleshooting Commands

### Check Service Status
```bash
docker-compose ps
```

### View Live Logs
```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Last 50 lines
docker-compose logs --tail=50 backend
```

### Test Endpoints
```bash
# Health check
curl http://localhost:8000/health

# Get maps
curl http://localhost:8000/maps

# Frontend
curl http://localhost:3000
```

### Rebuild Without Cache
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Reset Everything
```bash
# Remove containers, volumes, and images
docker-compose down -v
docker system prune -a

# Rebuild and start fresh
docker-compose build
docker-compose up -d
```

## 📊 Monitoring & Health

### Docker Resource Stats
```bash
docker stats
```

### Database Health Check
```bash
sqlite3 backend/player_data.db "PRAGMA integrity_check;"
```

### Database Size
```bash
sqlite3 backend/player_data.db "SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size();"
```

### Clear Cache (Force Rebuild)
```bash
rm backend/player_data.db
docker-compose restart backend
```

## 🗄️ Database Operations

### Backup Database
```bash
sqlite3 backend/player_data.db ".backup '/path/to/backup.db'"
```

### Restore Database
```bash
sqlite3 backend/player_data.db ".restore '/path/to/backup.db'"
```

### View Database Tables
```bash
sqlite3 backend/player_data.db ".tables"
```

### Compact Database
```bash
sqlite3 backend/player_data.db "VACUUM;"
```

## 🚀 Deployment Commands

### Build Production Images
```bash
docker-compose -f docker-compose.yml build --no-cache
```

### Push to Registry (Docker Hub example)
```bash
docker login
docker tag player-journey-backend:latest username/player-journey-backend:latest
docker tag player-journey-frontend:latest username/player-journey-frontend:latest
docker push username/player-journey-backend:latest
docker push username/player-journey-frontend:latest
```

### Deploy to AWS ECS
```bash
# See DEPLOYMENT_GUIDE.md for complete instructions
aws ecr create-repository --repository-name player-journey-backend
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <ACCOUNT>.dkr.ecr.us-east-1.amazonaws.com
```

### Deploy to Google Cloud Run
```bash
# See DEPLOYMENT_GUIDE.md for complete instructions
gcloud builds submit --tag gcr.io/PROJECT_ID/player-journey-backend ./backend
gcloud run deploy player-journey-backend --image gcr.io/PROJECT_ID/player-journey-backend --platform managed
```

### Deploy to Heroku
```bash
# See DEPLOYMENT_GUIDE.md for complete instructions
heroku login
heroku create player-journey-backend
git subtree push --prefix backend heroku/main
```

## 📦 Dependency Management

### Frontend Package Updates
```bash
# Check outdated packages
npm outdated

# Update all packages
npm update

# Security audit
npm audit
npm audit fix
```

### Backend Package Updates
```bash
# List installed packages
pip list

# Freeze dependencies
pip freeze > requirements.txt

# Security check
pip install safety
safety check
```

## 🎯 API Endpoints Quick Reference

| Endpoint | Method | Purpose | Example |
|----------|--------|---------|---------|
| `/health` | GET | Health check | `curl http://localhost:8000/health` |
| `/maps` | GET | Get all maps | `curl http://localhost:8000/maps` |
| `/matches` | GET | Get matches | `curl "http://localhost:8000/matches?date=2024-02-14"` |
| `/data/{match_id}/{type}` | GET | Get events | `curl "http://localhost:8000/data/xxx/Kill"` |
| `/journeys/{match_id}` | GET | Get journeys | `curl http://localhost:8000/journeys/xxx` |
| `/heatmaps/{map}/{type}` | GET | Get heatmap | `curl "http://localhost:8000/heatmaps/map/kills"` |

## 🎨 UI Feature Reference

### Timeline Control
- **Play/Pause**: Playback control
- **Scrubber**: Timeline position indicator
- **Current Time**: Shows match progress
- **Duration**: Match length

### Filters
- **Date Picker**: Select match date
- **Map Selector**: Choose game map
- **Match Selector**: Select specific match
- **Event Type**: Filter kill/death/loot/storm
- **Player Type**: Human vs Bot

### Heatmaps
- **Kills Button** (Red): Kill density visualization
- **Deaths Button** (Black): Death density visualization
- **Traffic Button** (Blue): Player movement patterns
- **Toggle**: Click to show/hide each heatmap

## 🔐 Security Best Practices

- ✅ Never commit `.env` files to git
- ✅ Use `.env.example` for templates
- ✅ Restrict CORS_ORIGINS to trusted domains
- ✅ Enable HTTPS in production
- ✅ Store secrets in environment variables
- ✅ Regular security updates: `npm audit`, `pip check`
- ✅ Keep Docker images updated
- ✅ Use strong database passwords
- ✅ Enable database backups
- ✅ Monitor logs for suspicious activity

## 🆘 Emergency Recovery

### Service Won't Start
```bash
# Check logs
docker-compose logs backend

# Try rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Check disk space
df -h

# Clear Docker cache if needed
docker system prune -a
```

### High Memory Usage
```bash
# Monitor usage
docker stats

# Identify process
docker-compose logs backend | tail -100

# Restart service
docker-compose restart backend

# Scale up if needed (edit docker-compose.yml)
```

### Database Corrupted
```bash
# Check integrity
sqlite3 backend/player_data.db "PRAGMA integrity_check;"

# Restore from backup
sqlite3 backend/player_data.db ".restore '/backups/backup.db'"

# Or rebuild
rm backend/player_data.db
docker-compose restart backend
```

### Complete System Reset
```bash
# Remove everything
docker-compose down -v

# Clean system
docker system prune -a --volumes

# Rebuild from scratch
docker-compose build
docker-compose up -d

# Restore from backup if needed
sqlite3 backend/player_data.db ".restore '/backups/backup.db'"
```

## 📋 Maintenance Schedule

### Daily
- [ ] Check service health: `docker-compose ps`
- [ ] Review recent errors: `docker-compose logs backend | tail -50`

### Weekly
- [ ] Test backup/restore procedure
- [ ] Review performance metrics
- [ ] Check disk usage: `df -h`

### Monthly
- [ ] Full database backup
- [ ] Security updates: `npm audit`, `pip check`
- [ ] Dependency updates
- [ ] Performance optimization review

### Quarterly
- [ ] Full security audit
- [ ] Load testing
- [ ] Disaster recovery test
- [ ] Documentation review

## 📚 Documentation Links

- **Main README**: [README.md](README.md) - Getting started, features, configuration
- **Deployment Guide**: [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) - Platform-specific deployment
- **Phase 5 Summary**: [PHASE_5_COMPLETION.md](PHASE_5_COMPLETION.md) - What was delivered
- **Backend README**: [backend/README.md](backend/README.md) - API documentation
- **Frontend README**: [frontend/README.md](frontend/README.md) - Component architecture

## 🔄 Git Common Commands

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make changes and commit
git add .
git commit -m "Add my feature"

# Push to remote
git push origin feature/my-feature

# Merge to main
git checkout main
git pull
git merge feature/my-feature
git push

# Rollback if needed
git revert <commit-hash>
git push
```

## 💡 Performance Tips

### Frontend
- Use timeline to reduce visible markers
- Enable dark mode (less GPU usage)
- Close unused browser tabs
- Use Chrome DevTools Performance tab to profile

### Backend
- Enable caching: `CACHE_ENABLED=true`
- Adjust workers: `WORKERS=4` (match CPU cores)
- Monitor query performance with EXPLAIN
- Archive old data periodically

### Database
- Create indexes for frequent queries
- Run VACUUM periodically
- Monitor slow queries
- Regular backups

## ✅ Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Environment files configured (.env, .env.local)
- [ ] No console errors or warnings
- [ ] API endpoints responding
- [ ] Database integrity verified
- [ ] Backups created
- [ ] Documentation updated
- [ ] Team notified
- [ ] Rollback plan documented

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**For Full Details**: See README.md and DEPLOYMENT_GUIDE.md  
**API Documentation**: http://localhost:8000/docs (when running locally)

# Initialize database (first time only)
python -m app.init_db

# Start development server (auto-reload on file changes)
uvicorn app.main:app --reload --port 8000

# Access:
# - API:     http://localhost:8000/api
# - Docs:    http://localhost:8000/docs
# - Health:  http://localhost:8000/health
```

### Frontend Setup & Run

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start development server (with hot reload)
npm start

# Access: http://localhost:3000
```

### Docker Setup

```bash
# Start all services
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Clean everything
docker-compose down -v
```

---

## Project Structure Quick Map

### Backend Directories

```
backend/
├── app/main.py              → FastAPI app entrypoint
├── app/config.py            → Environment settings
├── app/api/                 → Route handlers (/api/matches, etc)
├── app/services/            → Business logic (data loading, transforms)
├── app/models/schemas.py    → Request/response models
├── app/db/database.py       → SQLite setup
├── app/utils/               → Utilities & constants
└── requirements.txt         → Python dependencies
```

### Frontend Directories

```
frontend/
├── src/App.tsx              → Root component
├── src/components/          → React components
├── src/hooks/               → Custom data-fetching hooks
├── src/services/api.ts      → HTTP client (axios)
├── src/types/               → TypeScript interfaces
├── public/                  → Static assets
└── package.json             → Node dependencies
```

---

## Common Operations

### Debug Parquet Files

```python
# Python REPL
import pyarrow.parquet as pq
import pandas as pd

# Read file
table = pq.read_table("../player_data/February_10/file.nakama-0")
df = table.to_pandas()

# Decode events
df['event'] = df['event'].apply(lambda x: x.decode('utf-8'))

# Inspect
print(df.head())
print(df.columns)
print(df.dtypes)
```

### Test Coordinate Transformation

```python
from app.utils.coord_transform import world_to_minimap_pixel

# From README example
x, y = world_to_minimap_pixel(-301.45, -355.55, "AmbroseValley")
print(f"Expected: (78, 890), Got: ({x}, {y})")
```

### Query Database

```bash
sqlite3 cache.db

# Inside sqlite3 prompt:
> SELECT * FROM matches LIMIT 5;
> SELECT COUNT(*) FROM files;
> .schema
> .quit
```

### Check API Health

```bash
# Quick test
curl http://localhost:8000/health

# Get all maps
curl http://localhost:8000/api/maps

# Interactive docs
# Open browser to: http://localhost:8000/docs
```

---

## Key Files to Implement

### Backend (Priority Order)

1. **`app/api/maps.py`** — Return constants from `utils/constants.py`
   ```python
   @router.get("/api/maps")
   async def get_maps():
       return {"maps": [...]}
   ```

2. **`app/api/matches.py`** — Query SQLite for matches
   ```python
   @router.get("/api/matches")
   async def list_matches(date: str, map: str):
       # Query database
   ```

3. **`app/api/journey.py`** — Load parquet + transform coords
   ```python
   @router.get("/api/match/{match_id}/journey")
   async def get_journey(match_id: str):
       # Load parquet, transform coords
   ```

4. **`app/services/heatmap_generator.py`** — Aggregate data
   ```python
   def generate_heatmap(events, grid_size=32):
       # Create 2D histogram
   ```

### Frontend (Priority Order)

1. **`src/services/api.ts`** — HTTP client
   ```typescript
   export const api = {
       getMatches: (date?, map?) => axios.get(`${API}/matches`),
       getJourney: (id) => axios.get(`${API}/match/${id}/journey`),
   }
   ```

2. **`src/hooks/useMatches.ts`** — Fetch matches
   ```typescript
   export function useMatches(date?, map?) {
       const [data, setData] = useState(null);
       // fetch and return
   }
   ```

3. **`src/components/FilterPanel.tsx`** — Date/map filters
   ```typescript
   export function FilterPanel({ onFilter }) {
       // Date input, map select
   }
   ```

4. **`src/components/MapViewer.tsx`** — Deck.gl map
   ```typescript
   export function MapViewer({ journeys, events }) {
       // Deck.gl with ScatterplotLayer
   }
   ```

---

## Environment Variables Checklist

### Backend (.env)

```
✓ DATA_PATH=../player_data
✓ MAPS_PATH=../player_data/minimaps
✓ DB_PATH=./cache.db
✓ DEBUG=True (dev) or False (prod)
✓ LOG_LEVEL=INFO (or DEBUG)
```

### Frontend (.env)

```
✓ REACT_APP_API_URL=http://localhost:8000/api (dev)
✓ REACT_APP_API_URL=https://api.yourdomain.com (prod)
```

---

## Testing & Debugging

### Python Unit Tests

```bash
cd backend

# Run all tests
pytest tests/

# Run specific test
pytest tests/test_coord_transform.py -v

# With coverage
pytest --cov=app tests/

# Watch mode
pytest-watch tests/
```

### React Component Tests

```bash
cd frontend

# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Browser DevTools

1. **F12** - Open DevTools
2. **Network** tab - See API requests/responses
3. **Console** tab - Check for JS errors
4. **React DevTools** extension - Inspect components

---

## Common Problems

| Problem | Solution |
|---------|----------|
| `ModuleNotFoundError: fastapi` | Activate venv: `source venv/bin/activate` |
| Port 8000 in use | `uvicorn app.main:app --port 8001` |
| Port 3000 in use | `PORT=3001 npm start` |
| Parquet files not found | Check `DATA_PATH` in .env |
| API connection fails | Check `REACT_APP_API_URL` & backend running |
| CORS error | Update `ALLOWED_ORIGINS` in backend config |

See [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) for more.

---

## Documentation Map

| Document | Purpose |
|----------|---------|
| [README.md](README.md) | Overview & quick start |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System design & data flow |
| [TECH_STACK.md](TECH_STACK.md) | Dependencies & choices |
| [docs/SETUP.md](docs/SETUP.md) | Installation steps |
| [docs/API.md](docs/API.md) | REST API endpoints |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Development guide |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Production deployment |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Common issues |

---

## Useful Links

- FastAPI: https://fastapi.tiangolo.com/docs
- Pandas: https://pandas.pydata.org/docs/
- Deck.gl: https://deck.gl/docs
- React: https://react.dev/
- SQLite: https://www.sqlite.org/docs.html
- Docker: https://docs.docker.com/

---

## Next Steps

1. Copy `.env.example` → `.env` in both backend & frontend
2. Run backend setup (see above)
3. Run frontend setup (see above)
4. Visit http://localhost:3000 in browser
5. Implement API endpoints (see "Key Files to Implement" above)
6. Build React components
7. Test with real parquet data
8. Deploy to Render + Vercel

---

Last Updated: March 2026  
Version: 0.1.0 (MVP Scaffold)

