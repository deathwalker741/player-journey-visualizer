"""FastAPI application entrypoint."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.config import get_settings
from app.db.database import init_database

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Settings
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Startup and shutdown logic.
    """
    # Startup
    logger.info("🚀 Starting Player Journey Visualization Tool")
    try:
        init_database()
        logger.info("✓ Database initialized")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")

    yield

    # Shutdown
    logger.info("🛑 Shutting down")


# Create FastAPI app
app = FastAPI(
    title="Player Journey Visualization API",
    description="Web API for visualizing player behavior in LILA BLACK",
    version="0.1.0",
    lifespan=lifespan,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
from app.api import matches, journey, events, heatmaps, maps

app.include_router(maps.router, tags=["maps"])
app.include_router(matches.router, tags=["matches"])
app.include_router(journey.router, tags=["journey"])
app.include_router(events.router, tags=["events"])
app.include_router(heatmaps.router, tags=["heatmaps"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Player Journey Visualization API",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json",
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {
        "status": "ok",
        "debug": settings.DEBUG,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
    )
