"""Personal Intelligence System – FastAPI application entry point."""

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from .config import settings
from .database import init_db
from .routers import (
    auth_router,
    profile_router,
    study_router,
    fitness_router,
    habits_router,
    finance_router,
    tasks_router,
    journal_router,
    goals_router,
    analytics_router,
    ai_router,
    backup_router,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialise database tables on startup."""
    init_db()
    yield


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# ── CORS Middleware ──────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Routers ──────────────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(study_router)
app.include_router(fitness_router)
app.include_router(habits_router)
app.include_router(finance_router)
app.include_router(tasks_router)
app.include_router(journal_router)
app.include_router(goals_router)
app.include_router(analytics_router)
app.include_router(ai_router)
app.include_router(backup_router)

# ── Static files & Frontend Single Page Application ─────────────────────────
frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "frontend")
css_dir = os.path.join(frontend_dir, "css")
js_dir = os.path.join(frontend_dir, "js")

if os.path.isdir(css_dir):
    app.mount("/css", StaticFiles(directory=css_dir), name="css")
if os.path.isdir(js_dir):
    app.mount("/js", StaticFiles(directory=js_dir), name="js")
if os.path.isdir(frontend_dir):
    app.mount("/frontend", StaticFiles(directory=frontend_dir), name="frontend")


@app.get("/manifest.json")
async def manifest():
    """Serve PWA Web App Manifest."""
    manifest_path = os.path.join(frontend_dir, "manifest.json")
    if os.path.isfile(manifest_path):
        return FileResponse(manifest_path, media_type="application/manifest+json")
    return {"name": settings.APP_NAME}


@app.get("/sw.js")
async def service_worker():
    """Serve PWA Service Worker."""
    sw_path = os.path.join(frontend_dir, "sw.js")
    if os.path.isfile(sw_path):
        return FileResponse(sw_path, media_type="application/javascript")
    return ""


@app.get("/icon-192.png")
async def icon_192():
    """Serve 192x192 app icon."""
    p = os.path.join(frontend_dir, "icon-192.png")
    if os.path.isfile(p):
        return FileResponse(p, media_type="image/png")
    return {}


@app.get("/icon-512.png")
async def icon_512():
    """Serve 512x512 app icon."""
    p = os.path.join(frontend_dir, "icon-512.png")
    if os.path.isfile(p):
        return FileResponse(p, media_type="image/png")
    return {}


@app.get("/")
async def root():
    """Serve the frontend SPA index page."""
    index_path = os.path.join(frontend_dir, "index.html")
    if os.path.isfile(index_path):
        return FileResponse(index_path)
    return {"message": f"{settings.APP_NAME} v{settings.APP_VERSION}"}


@app.get("/api/health")
async def health_check():
    """System health-check endpoint."""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "database": "connected",
    }
