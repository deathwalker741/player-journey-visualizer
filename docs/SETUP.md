# Setup Instructions

## Quick Start (5 minutes)

### Prerequisites
- Python 3.9+ ([Download](https://www.python.org/downloads/))
- Node.js 16+ / npm 8+ ([Download](https://nodejs.org/))
- Git ([Download](https://git-scm.com/))

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database (scans data files and builds index)
python -m app.init_db

# Start server
uvicorn app.main:app --reload --port 8000
```

Backend will be running at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs` (interactive Swagger UI)
- Health Check: `http://localhost:8000/health`

### Step 2: Frontend Setup

In a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will open at `http://localhost:3000`

---

## Full Setup with Docker (Optional)

```bash
# From project root
docker-compose up

# Backend: http://localhost:8000
# Frontend: http://localhost:3000
```

---

## Environment Configuration

### Backend (.env)

Create `backend/.env`:

```bash
# Data paths (relative to backend/)
DATA_PATH=../player_data
MAPS_PATH=../player_data/minimaps
DB_PATH=./cache.db

# Server
DEBUG=True
LOG_LEVEL=INFO

# Optional: Cache settings
CACHE_MAX_SIZE_MB=500
HEATMAP_CACHE_TTL_HOURS=24
```

### Frontend (.env)

Create `frontend/.env`:

```bash
# API URL
REACT_APP_API_URL=http://localhost:8000/api

# Optional
REACT_APP_DEBUG=true
```

---

## Troubleshooting

### "ModuleNotFoundError: No module named 'fastapi'"

```bash
# Make sure venv is activated
which python  # Should show path inside venv/

# Reinstall requirements
pip install -r requirements.txt
```

### "Port 8000 already in use"

```bash
# Use different port
uvicorn app.main:app --port 8001

# Update frontend .env:
REACT_APP_API_URL=http://localhost:8001/api
```

### "Port 3000 already in use"

```bash
# On macOS/Linux:
PORT=3001 npm start

# On Windows (PowerShell):
$env:PORT=3001; npm start
```

### "Parquet files not found"

Ensure:
1. `DATA_PATH` in `.env` points to correct folder
2. Parquet files are in `data/February_10/`, `data/February_11/`, etc.
3. Files have `.nakama-0` extension (no `.parquet` suffix)

```bash
# Verify files exist:
# macOS/Linux:
ls -la ../player_data/February_10/ | head

# Windows PowerShell:
Get-ChildItem ../player_data/February_10/ | Select -First 5
```

### "CORS error: No 'Access-Control-Allow-Origin' header"

Frontend can't reach backend API. Check:
1. Backend is running on correct port
2. `REACT_APP_API_URL` in frontend `.env` is correct
3. Backend `ALLOWED_ORIGINS` in `config.py` includes frontend URL

---

## Verify Installation

### Backend Health Check

```bash
curl http://localhost:8000/health
# Should return: {"status":"ok","debug":true}
```

### Test API Endpoint

```bash
curl http://localhost:8000/docs
# Should open Swagger interactive docs
```

### Check Database

```bash
# From backend directory
sqlite3 cache.db ".tables"
# Should show: matches, files, cache_metadata
```

---

## Next Steps

1. **Explore the API:** Visit `http://localhost:8000/docs`
2. **Load data:** Backend will auto-scan data folder on startup
3. **Build UI:** Start with FilterPanel and MatchList components
4. **Add visualizations:** Integrate Deck.gl for map rendering

See [DEVELOPMENT.md](DEVELOPMENT.md) for detailed development guide.

