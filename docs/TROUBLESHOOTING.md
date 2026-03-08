# Troubleshooting Guide

## Common Issues & Solutions

### Backend Issues

#### Python/Virtual Environment

**Error:** `ModuleNotFoundError: No module named 'fastapi'`

```bash
# Check if venv is activated
which python  # Should show path inside venv/

# If not activated:
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate     # Windows

# Reinstall requirements
pip install -r requirements.txt
```

**Error:** `bash: venv/bin/activate: No such file or directory`

```bash
# Create new virtual environment
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Port Issues

**Error:** `Address already in use: ('0.0.0.0', 8000)`

```bash
# Use different port
uvicorn app.main:app --port 8001

# Or kill process on port 8000
# macOS/Linux:
lsof -i :8000
kill <PID>

# Windows (PowerShell):
netstat -ano | findstr :8000
taskkill /PID <PID> /F
```

#### Data Loading

**Error:** `FileNotFoundError: ../player_data not found`

Check:
1. Verify `DATA_PATH` in `.env` is correct
2. Parquet files exist: `ls ../player_data/February_10/`
3. Files have `.nakama-0` extension

```bash
# Debug: list files
ls -la ../player_data/February_*/  | head

# Windows PowerShell:
Get-ChildItem ../player_data/February_10 | Select -First 5
```

**Error:** `pyarrow.lib.ArrowInvalid: Failed to parse table`

Parquet file is corrupted. Try:
1. Download data again
2. Check file size (should be > 1 KB)
3. Verify with: `python -c "import pyarrow.parquet as pq; pq.read_table('path/file.nakama-0')"`

#### Database Issues

**Error:** `sqlite3.OperationalError: database is locked`

```bash
# Another process is using it, close or wait
# Or restart the server
pkill -f "uvicorn"

# Remove lock file
rm cache.db-journal

# Reinitialize
python -m app.init_db
```

**Error:** `sqlite3.DatabaseError: database disk image is malformed`

```bash
# Database corruption, restore from backup or reinitialize
rm cache.db
python -m app.init_db
```

#### API Issues

**Error:** `502 Bad Gateway` on Render/production

Check backend logs:
```bash
# On Render dashboard → Logs
# Look for Python exceptions
```

Possible causes:
- Out of memory
- Unhandled exception
- Database connection lost

**Fix:**
```bash
# Add memory limits
# Restart service via Render dashboard
# Check error logs for specific error
```

---

### Frontend Issues

#### Node/NPM Issues

**Error:** `npm: command not found`

Install Node.js from https://nodejs.org/ (includes npm)

**Error:** `npm ERR! code ERESOLVE`

```bash
# Update npm
npm install -g npm@latest

# Or force legacy peer deps
npm install --legacy-peer-deps
npm start --legacy-peer-deps
```

#### Port Issues

**Error:** `Port 3000 already in use`

```bash
# macOS/Linux:
lsof -i :3000
kill <PID>

# Or use different port:
PORT=3001 npm start

# Windows PowerShell:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

#### API Connection Issues

**Error:** `Failed to fetch http://localhost:8000/api/matches`

**In browser console:** `CORS error: Access-Control-Allow-Origin`

Check:
1. Backend is running: `http://localhost:8000/health`
2. `REACT_APP_API_URL` in `.env` is correct
3. Backend `ALLOWED_ORIGINS` includes frontend URL

```javascript
// frontend/.env
REACT_APP_API_URL=http://localhost:8000/api

// or for production:
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

```python
# backend/app/config.py
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://your-frontend.vercel.app",
]
```

**Error:** `localhost:8000 refused to connect`

Backend not running:
```bash
cd backend
uvicorn app.main:app --reload
```

#### React Build Issues

**Error:** `npm ERR! code ENOENT` during build

```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error:** `TypeError: Cannot read property of undefined`

Check React Developer Tools (Chrome/Firefox extension) for component errors.

Most common: API data structure doesn't match component expectations.

```typescript
// Check types match API response
// API returns:
// { matches: [...] }

// Component expects:
// data.matches[0].match_id

// If doesn't match, fix in hooks or components
```

---

### Data Issues

**Problem:** Coordinate transformation looks wrong

Test with known values from README:
```python
from app.utils.coord_transform import world_to_minimap_pixel

# Example from README
x, y = world_to_minimap_pixel(-301.45, -355.55, "AmbroseValley")
print(f"Expected: 78, 890. Got: {x}, {y}")
```

Should be approximately (78, 890).

**Problem:** Bot/Human classification wrong

Check `user_id` format in files:
```bash
# Should see:
# Humans: f4e072fa-b7af-4761-... (UUID format)
# Bots: 1440, 382, ... (numeric)
```

```python
# Test in Python
from app.services.data_loader import is_bot_user

print(is_bot_user("f4e072fa-b7af-4761-b567-1d95b7ad0108"))  # False
print(is_bot_user("1440"))  # True
```

---

### Deployment Issues

#### Render.com

**Build fails with `pip install` error:**

Check `requirements.txt` syntax and package versions. Pin specific versions:
```
fastapi==0.104.1
uvicorn==0.24.0
```

**App crashes after deploy:**

1. Check logs: Dashboard → Logs
2. Ensure environment variables are set
3. Verify `DATA_PATH` points to correct location

**Slow startup:**

Parquet file scanning takes time on first load. Add this to requirements:
```
python-dotenv==1.0.0
```

And in `.env`:
```
LOG_LEVEL=INFO  # Not DEBUG
```

#### Vercel

**Build fails:**

```bash
# Check locally
npm install
npm run build

# If works locally, check build settings in Vercel dashboard
# - Root Directory: frontend
# - Build Command: npm run build
# - Output Directory: build
```

**Site shows blank page:**

1. Check browser console for JS errors
2. Verify `REACT_APP_API_URL` environment variable
3. Try hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

### Performance Issues

#### Slow API Responses

```python
# Add logging to backend
import time

@app.get("/api/matches")
async def get_matches():
    start = time.time()
    # ... do work ...
    elapsed = time.time() - start
    logger.info(f"Request took {elapsed}s")
```

**If parquet loading is slow:**
- Reduce date range
- Filter by specific map
- Implement file caching

**If heatmap generation is slow:**
- Reduce `aggregation` parameter (e.g., 16 instead of 32)
- Pre-compute heatmaps
- Use background job

#### High Memory Usage

```bash
# Check memory (macOS/Linux)
top

# Windows (PowerShell)
Get-Process python | Sort-Object WorkingSet | Format-Table
```

**Solutions:**
- Reduce `CACHE_MAX_SIZE_MB`
- Use `pd.read_parquet(..., columns=[...])` to load only needed columns
- Migrate to Redis for external caching
- Use database pagination instead of loading all matches

---

### Docker Issues

**Error:** `docker: command not found`

Install Docker from https://docker.com

**Error:** `docker-compose: command not found`

```bash
# Upgrade docker (includes docker-compose v2)
docker --version

# Or install standalone:
pip install docker-compose
```

**Containers won't start:**

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Reset
docker-compose down
docker-compose up --build

# Remove all containers
docker system prune -a
```

---

## Debug Mode

### Enable verbose logging

**Backend:**
```python
# app/config.py
LOG_LEVEL=DEBUG

# Or in code
import logging
logging.basicConfig(level=logging.DEBUG)
```

**Frontend:**
```typescript
// Add to App.tsx
useEffect(() => {
  console.log('DEBUG: App mounted');
  console.log('API URL:', process.env.REACT_APP_API_URL);
}, []);
```

### Browser DevTools

1. **Open DevTools:** F12 or Cmd+Opt+I (Mac)
2. **Network Tab:** See API requests/responses
3. **Console Tab:** See JS errors
4. **Storage Tab:** Check cookies/local storage

### Python Debugger

```python
# In backend code
import pdb; pdb.set_trace()

# Then interact in terminal
(Pdb) n  # next
(Pdb) s  # step into
(Pdb) c  # continue
(Pdb) p <variable>  # print
```

---

## Getting Help

1. **Check logs first:**
   - Backend: Terminal output or Render logs
   - Frontend: Browser console (F12)

2. **Verify setup:**
   - Run [SETUP.md](SETUP.md) checklist
   - Test health endpoints

3. **Search docs:**
   - Check [ARCHITECTURE.md](../ARCHITECTURE.md)
   - Review [API.md](API.md) for expected responses

4. **Minimal reproduction:**
   - Create simple test case
   - Use curl to test backend API
   - Check with sample data

