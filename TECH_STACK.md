# Tech Stack & Dependencies Summary

## Backend Stack

### Framework & Server
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **API Framework** | FastAPI | 0.104.1 | Modern async REST framework, auto-generated docs |
| **ASGI Server** | Uvicorn | 0.24.0 | High-performance async server (~40k req/s) |
| **Data Validation** | Pydantic | 2.5.0 | Type validation, OpenAPI doc generation |

### Data Processing
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **Data Processing** | Pandas | 2.1.3 | DataFrame manipulation, aggregations |
| **Parquet I/O** | PyArrow | 13.0.0 | Fast columnar file reading |
| **Numerical Computing** | NumPy | 1.26.2 | Array operations for coordinate transforms |

### Database & Caching
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **Metadata Cache** | SQLite3 | Built-in | File indexing, match metadata |
| **In-Memory Cache** | cachetools | 5.3.2 | LRU cache for API responses |
| **Disk Cache** | diskcache | 5.6.3 | Persistent cache layer for heatmaps |

### Utilities
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **Environment Config** | python-dotenv | 1.0.0 | Load settings from .env |
| **Date Handling** | python-dateutil | 2.8.2 | Parse dates, timezones |
| **Logging** | python-json-logger | 2.0.7 | Structured JSON logs |

### Testing & Quality
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **Testing** | pytest | 7.4.3 | Unit & integration tests |
| **Async Tests** | pytest-asyncio | 0.21.1 | Test async FastAPI routes |
| **HTTP Testing** | httpx | 0.25.1 | Test HTTP client |
| **Type Checking** | mypy | 1.7.1 | Static type analysis |
| **Code Formatting** | black | 23.12.0 | Consistent code style |
| **Linting** | flake8 | 6.1.0 | Code quality checks |
| **Import Sorting** | isort | 5.13.2 | Organize imports |

---

## Frontend Stack

### Core Framework
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **UI Framework** | React | 18.2.0 | Component-based UI |
| **DOM Rendering** | React DOM | 18.2.0 | Browser DOM rendering |
| **Routing** | React Router | 6.20.0 | Client-side navigation |
| **Language** | TypeScript | 5.3.2 | Type-safe JavaScript |

### HTTP & State
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **HTTP Client** | Axios | 1.6.2 | Promise-based API requests |
| **State Management** | Zustand | 4.4.2 | Lightweight state management |
| **Date Utils** | date-fns | 2.30.0 | Date formatting & parsing |

### Visualization
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **GPU Rendering** | Deck.gl | 13.0.0 | High-performance map visualization |
| **Layers** | @deck.gl/layers | 13.0.0 | ScatterplotLayer, HeatmapLayer, ImageLayer |
| **React Integration** | @deck.gl/react | 13.0.0 | Deck.gl React wrapper |
| **GL Library** | luma.gl | 9.0.0 | WebGL abstractions |
| **Maps** | react-map-gl | 7.1.3 | Map utilities (optional) |

### Development Tools
| Component | Library | Version | Purpose |
|-----------|---------|---------|---------|
| **Build Tool** | react-scripts | 5.0.1 | Create React App build system |
| **Testing** | @testing-library/react | Latest | Component testing |
| **Linting** | ESLint | 8.55.0 | Code quality |

---

## DevOps & Deployment

### Containerization
| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Container Runtime** | Docker | Package & run services |
| **Orchestration** | docker-compose | Local multi-container development |

### Deployment Targets
| Component | Service | Purpose |
|-----------|---------|---------|
| **Backend** | Render.com | Production FastAPI hosting |
| **Frontend** | Vercel | Static React hosting + CDN |
| **Data Storage** | Local / S3 | Parquet files |
| **Database** | SQLite (local) / PostgreSQL (prod) | Metadata & caching |

---

## Architecture Highlights

### Why These Choices?

#### FastAPI ✅
- ✅ **ASGI async:** Handle many concurrent requests
- ✅ **Auto docs:** Swagger UI generated automatically
- ✅ **Pydantic integration:** Type-safe request/response
- ✅ **Performance:** 40k+ req/s
- ✅ **Modern Python:** Async/await, f-strings, type hints

**Alternatives considered:**
- Flask: Too lightweight for this scale
- Django: Overkill, heavier overhead
- FastAPI: Perfect balance

#### Pandas + PyArrow ✅
- ✅ **PyArrow:** Native parquet support, columnar I/O
- ✅ **Pandas:** Familiar DataFrame API
- ✅ **Performance:** Fast aggregations for heatmaps
- ✅ **Ecosystem:** Wide tool support

**Alternatives considered:**
- Pure PyArrow: More low-level
- Polars: Good but less mature
- DuckDB: Query-focused, less suitable

#### Deck.gl ✅
- ✅ **GPU rendering:** Smooth 60fps heatmaps
- ✅ **Layers:** Pre-built ScatterplotLayer, HeatmapLayer
- ✅ **React bindings:** Easy component integration
- ✅ **Interactive:** Zoom, pan, hover tooltips
- ✅ **Performance:** Handles 10k+ points effortlessly

**Alternatives considered:**
- Leaflet: Simpler but less powerful
- Mapbox GL JS: Great but expensive
- Folium: Python-focused, less interactive

#### React + TypeScript ✅
- ✅ **Component-based:** Reusable UI pieces
- ✅ **TypeScript:** Catch errors at compile-time
- ✅ **Hot reload:** Fast development
- ✅ **Ecosystem:** Rich library support

**Alternatives considered:**
- Vue: Good but smaller ecosystem
- Svelte: Interesting but less mature
- Next.js: Adds complexity for this use case

---

## Performance Specifications

### Backend
```
Parquet file parsing:  50-100 files/second
Coordinate transform:  100k+ coords/second
Heatmap generation:    ~500ms for 32x32 grid
API response time:     <500ms (cold), <100ms (cached)
```

### Frontend
```
Initial page load:     <3s
Map rendering:         <1s
Heatmap overlay:       <1s
Timeline scrubbing:    60fps
```

---

## Dependency Update Policy

### Critical (Update ASAP)
- Security vulnerabilities in core libs
- Major incompatibilities

### Important (Update Monthly)
- FastAPI, Pydantic
- React, TypeScript

### Nice to Have (Update Quarterly)
- Testing libraries
- Development tools

### Checking for Updates

```bash
# Backend
pip list --outdated

# Frontend
npm outdated
```

---

## Production Checklist

- [ ] All dependencies pinned to specific versions
- [ ] `requirements.txt` reviewed for conflicts
- [ ] `package.json` lock file committed
- [ ] Environment variables documented
- [ ] Error handling implemented
- [ ] Logging configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] HTTPS enforced
- [ ] Database backups configured
- [ ] Monitoring/alerting setup
- [ ] Security audit completed

