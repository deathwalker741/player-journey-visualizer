# Deployment Guide

## Local Deployment (Docker)

### Quick Start with Docker Compose

```bash
# Build and run all services
docker-compose up --build

# Backend: http://localhost:8000
# Frontend: http://localhost:3000

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop services
docker-compose down
```

---

## Production Deployment

### Option 1: Backend on Render + Frontend on Vercel (Recommended)

#### Backend Deployment (Render.com)

**Step 1: Prepare Repository**

```bash
# Push to GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/player-journey-tool.git
git push -u origin main
```

**Step 2: Deploy Backend to Render**

1. Go to [render.com](https://render.com)
2. Sign up / Log in
3. Click "New +" → "Web Service"
4. Connect GitHub repository
5. Configure:
   - **Name:** `player-journey-api`
   - **Root Directory:** `backend`
   - **Runtime:** Python 3.11
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port 8000`

6. Set Environment Variables:
   ```
   DATA_PATH = ./player_data
   DB_PATH = ./cache.db
   DEBUG = False
   LOG_LEVEL = INFO
   ALLOWED_ORIGINS = https://yourdomain.vercel.app
   ```

7. Click "Create Web Service"
8. Copy the deployed URL (e.g., `https://player-journey-api.onrender.com`)

**Step 3: Deploy Frontend to Vercel**

1. Go to [vercel.com](https://vercel.com)
2. Sign up / Log in
3. Click "Add New..." → "Project"
4. Import GitHub repository
5. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `frontend`

6. Set Environment Variables:
   ```
   REACT_APP_API_URL = https://player-journey-api.onrender.com/api
   ```

7. Click "Deploy"
8. Access at `https://yourdomain.vercel.app`

---

### Option 2: Both on Heroku (Legacy)

**Note:** Heroku free tier was discontinued. Use Render instead.

---

### Option 3: Self-Hosted (AWS, DigitalOcean, etc.)

#### Using Docker on DigitalOcean App Platform

**Step 1: Create App**

1. Go to DigitalOcean
2. Create App
3. Select "GitHub" as source
4. Configure:
   - **Service 1 (Backend)**
     - Dockerfile: `backend/Dockerfile`
     - Port: 8000
     - HTTP Routes: `/`
   
   - **Service 2 (Frontend)**
     - Dockerfile: `frontend/Dockerfile`
     - Port: 3000
     - HTTP Routes: `/`

**Step 2: Set Environment Variables**

Backend:
```
DATA_PATH = ./player_data
DB_PATH = ./cache.db
```

Frontend:
```
REACT_APP_API_URL = https://<your-backend-domain>/api
```

**Step 3: Deploy**

DigitalOcean will automatically build and deploy on push to main.

---

## Data Deployment Strategy

### Option 1: Include in Backend

Commit parquet files to repository:
```bash
git add player_data/
git commit -m "Add player data"
```

**Pros:** Simple, self-contained  
**Cons:** Large repo size (~8 MB for 5 days)

### Option 2: S3 Storage (Recommended for Production)

```python
# backend/app/services/data_loader.py
import boto3

s3 = boto3.client('s3')

def load_from_s3(bucket, key):
    obj = s3.get_object(Bucket=bucket, Key=key)
    return pd.read_parquet(obj['Body'])
```

**Setup:**
1. Create S3 bucket
2. Upload data files
3. Set AWS credentials as environment variables

### Option 3: CDN (CloudFront + S3)

Cache minimap images on CloudFront for faster delivery.

---

## Environment Variables

### Backend (.env)

```bash
# Data
DATA_PATH = ./player_data
MAPS_PATH = ./player_data/minimaps
DB_PATH = ./cache.db

# Server
DEBUG = False
LOG_LEVEL = INFO

# CORS
ALLOWED_ORIGINS = https://yourdomain.vercel.app

# Cache
CACHE_MAX_SIZE_MB = 500
HEATMAP_CACHE_TTL_HOURS = 24
```

### Frontend (.env)

```bash
REACT_APP_API_URL = https://api.yourdomain.com
```

---

## Monitoring & Logging

### Backend Logs

**Render.com:**
- View in Dashboard → Logs

**Self-hosted:**
```bash
docker logs player-journey-tool_backend_1
```

### Frontend Errors

**Vercel:**
- Automatic error tracking
- View in Dashboard → Monitoring

**Self-hosted:**
```bash
docker logs player-journey-tool_frontend_1
```

### Performance Monitoring

Add to backend:
```python
# app/main.py
from prometheus_client import Counter, Histogram

request_count = Counter(
    'requests_total',
    'Total requests',
    ['method', 'endpoint']
)

request_duration = Histogram(
    'request_duration_seconds',
    'Request duration'
)
```

---

## Database Backup

### SQLite Backup

```bash
# Backup
sqlite3 cache.db ".backup backup.db"

# Restore
sqlite3 cache.db ".restore backup.db"
```

### Automated Backups (Render.com)

Use Render's backup feature or:
```bash
# Daily backup script
0 2 * * * sqlite3 /app/cache.db ".backup /backups/cache-$(date +\%Y\%m\%d).db"
```

---

## Scaling Considerations

### For Larger Datasets

1. **Database:** Migrate from SQLite to PostgreSQL
   ```python
   from sqlalchemy import create_engine
   engine = create_engine('postgresql://user:pass@host/db')
   ```

2. **Caching:** Use Redis
   ```python
   from redis import Redis
   cache = Redis(host='redis.yourdomain.com')
   ```

3. **File Storage:** Use S3 + CloudFront
   ```python
   import boto3
   s3 = boto3.client('s3')
   ```

4. **API Optimization:** Add CDN layer
   - Cloudflare
   - CloudFront
   - Fastly

---

## Security

### For Production

1. **HTTPS Only**
   ```python
   # Redirect HTTP to HTTPS
   @app.middleware("http")
   async def https_redirect(request, call_next):
       if request.url.scheme == "http":
           return RedirectResponse(url=request.url.replace(scheme="https"))
       return await call_next(request)
   ```

2. **Authentication**
   ```python
   from fastapi_security import HTTPBearer
   security = HTTPBearer()
   
   @app.get("/api/matches")
   async def get_matches(credentials = Depends(security)):
       ...
   ```

3. **Rate Limiting**
   ```python
   from slowapi import Limiter
   limiter = Limiter(key_func=get_remote_address)
   
   @app.get("/api/matches")
   @limiter.limit("100/minute")
   async def get_matches():
       ...
   ```

4. **CORS Configuration**
   ```python
   ALLOWED_ORIGINS = [
       "https://yourdomain.vercel.app",
       "https://yourdomain.com",
   ]
   ```

---

## Troubleshooting

### Backend crashes on startup
```
Check if DATA_PATH exists and contains .nakama-0 files
Verify database initialization: python app/init_db.py
```

### Frontend can't reach backend
```
Check REACT_APP_API_URL in environment
Verify backend ALLOWED_ORIGINS includes frontend domain
Check CORS headers in browser network tab
```

### Out of memory
```
Reduce CACHE_MAX_SIZE_MB in backend
Enable file streaming instead of loading all at once
Migrate to Redis for caching
```

### Slow heatmap generation
```
Pre-compute heatmaps during off-hours
Reduce aggregation grid size (16 instead of 32)
Add background job worker
```

---

## Maintenance

### Regular Tasks

- **Weekly:** Monitor logs for errors
- **Monthly:** Review performance metrics
- **Quarterly:** Update dependencies
- **Annually:** Audit security

### Update Dependencies

```bash
# Backend
pip list --outdated
pip install --upgrade <package>

# Frontend
npm outdated
npm update
```

