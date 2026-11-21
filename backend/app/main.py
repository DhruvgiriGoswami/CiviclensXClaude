"""CivicLens Backend — FastAPI application entry point (v1.0.1)."""

import asyncio
import os
from contextlib import asynccontextmanager
import time

from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine, async_session_factory
from app.core.logging_config import setup_logging, logger
from app.api.v1.router import api_v1_router

# Initialize structured, CloudWatch-optimized logging
setup_logging()

# Import models so Alembic/SQLAlchemy can discover them
import app.models  # noqa: F401,E402  (after setup_logging on purpose)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup DB check and shutdown. Seeding lives in the civiclens-database repo."""
    logger.info("CivicLens backend starting (version=%s)...", settings.APP_VERSION)
    
    # Startup: verify DB connection (Alembic migrations are applied in start.sh)
    async with engine.begin() as conn:
        await conn.execute(text("SELECT 1"))

    async with async_session_factory() as session:
        try:
            # Ensure any submitted reviews have rating synced with average of sub-scores
            await session.execute(
                text("UPDATE leader_feedbacks SET rating = ROUND((responsiveness_score + transparency_score)::numeric / 2) WHERE responsiveness_score IS NOT NULL AND transparency_score IS NOT NULL")
            )
            await session.commit()
        except Exception as e:
            logger.warning("Startup DB maintenance note: %s", e)

    yield
    # Shutdown: dispose engine
    logger.info("CivicLens backend shutting down...")
    await engine.dispose()
    logger.info("CivicLens backend shut down cleanly.")


app = FastAPI(
    title=settings.APP_TITLE,
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# GZip Compression Middleware (compresses responses > 1KB)
app.add_middleware(GZipMiddleware, minimum_size=1000)

origins = [origin.strip() for origin in settings.BACKEND_CORS_ORIGINS.split(",") if origin.strip()]
default_origins = ["https://sit.myciviclens.in", "https://myciviclens.in", "http://sit.myciviclens.in"]
for o in default_origins:
    if o not in origins:
        origins.append(o)

# CORS — allow configured origins with restricted methods
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS", "HEAD"],
    allow_headers=["*"],
)


@app.middleware("http")
async def cloudwatch_error_and_latency_logging_middleware(request: Request, call_next):
    """
    Production CloudWatch logger:
    - Suppresses routine 2xx success logs and CORS OPTIONS.
    - Logs 4xx errors (e.g. 401, 403, 429) at WARNING level.
    - Logs 5xx errors and unhandled exceptions with full stack traces at ERROR level.
    - Sanitizes sensitive parameters and never logs credentials or raw payloads.
    """
    if request.method == "OPTIONS":
        return await call_next(request)

    start_time = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception:
        duration_ms = (time.perf_counter() - start_time) * 1000
        client_ip = request.client.host if request.client else "unknown"
        logger.exception(
            "HTTP 500 Unhandled Exception on %s %s (%.1fms) [client=%s]",
            request.method,
            request.url.path,
            duration_ms,
            client_ip,
        )
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal server error"},
        )

    duration_ms = (time.perf_counter() - start_time) * 1000
    status_code = response.status_code

    if status_code >= 500:
        client_ip = request.client.host if request.client else "unknown"
        logger.error(
            "HTTP %s %s -> %s (%.1fms) [client=%s]",
            request.method,
            request.url.path,
            status_code,
            duration_ms,
            client_ip,
        )
    elif status_code >= 400:
        path = request.url.path
        is_benign_404 = (
            status_code == 404 and (
                path in ("/favicon.ico", "/favicon.png", "/robots.txt")
            )
        )
        if not is_benign_404:
            client_ip = request.client.host if request.client else "unknown"
            logger.warning(
                "HTTP %s %s -> %s (%.1fms) [client=%s]",
                request.method,
                request.url.path,
                status_code,
                duration_ms,
                client_ip,
            )

    return response


# Security Headers & Cache-Control Middleware
@app.middleware("http")
async def apply_security_and_cache_headers(request: Request, call_next):
    response = await call_next(request)
    
    # OWASP Recommended Security Headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "0"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"

    # HTTP Cache-Control for read-heavy geography endpoints
    if request.method == "GET" and (
        request.url.path.startswith("/api/v1/geo-units") or
        request.url.path.startswith("/api/v1/map/wards")
    ):
        response.headers["Cache-Control"] = "public, max-age=86400, stale-while-revalidate=3600"
    return response


# S3 and local cache backed complaint media streaming endpoint
@app.get("/storage/complaints/{complaint_id}/{filename}", tags=["Media"])
async def get_complaint_image(complaint_id: int, filename: str):
    """
    Serve complaint images dynamically from AWS S3 or local container cache.
    Ensures images survive container lifecycle restarts and recycling.
    """
    from app.services.media import fetch_media_content

    # boto3 and file I/O are blocking; run them off the event loop so one slow S3 read can't stall every request.
    result = await asyncio.to_thread(fetch_media_content, complaint_id, filename)
    if not result:
        raise HTTPException(status_code=404, detail="Media not found")

    content, media_type = result
    return Response(
        content=content,
        media_type=media_type,
        headers={
            "Cache-Control": "public, max-age=31536000, immutable",
            "Content-Disposition": f'inline; filename="{filename}"',
        },
    )


# Mount static media storage
media_path = settings.MEDIA_STORAGE_PATH
if os.path.isdir(media_path):
    app.mount("/storage", StaticFiles(directory=media_path), name="storage")

# Include API routes
app.include_router(api_v1_router)


@app.get("/", tags=["Root"])
async def root():
    """Root entry point for the CivicLens API Gateway."""
    return {
        "application": "CivicLens",
        "title": settings.APP_TITLE,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "status": "operational",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/favicon.ico", include_in_schema=False)
@app.get("/favicon.png", include_in_schema=False)
async def favicon():
    """Return 204 No Content for browser icon probes."""
    return Response(status_code=204)


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint — verifies database connectivity without leaking internal errors."""
    try:
        async with async_session_factory() as session:
            await session.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception as e:
        logger.warning("Health check degraded: database connectivity check failed: %s", e)
        db_status = "disconnected"

    # 503 when the DB is down so the ALB and ECS health checks can see it.
    return JSONResponse(
        status_code=200 if db_status == "ok" else 503,
        content={"status": "ok" if db_status == "ok" else "degraded", "database": db_status},
    )


@app.get("/version", tags=["Version"])
@app.get("/api/v1/version", tags=["Version"])
async def version_info():
    """Returns application deployment version, commit SHA, build time, and active Alembic migration revision."""
    import os
    build_commit = os.getenv("BUILD_COMMIT", "unknown")
    build_time = os.getenv("BUILD_TIME", "unknown")
    commit_short = build_commit[:7] if len(build_commit) >= 7 else build_commit

    alembic_rev = "unknown"
    data_version = "v1.5.0"
    data_release = "civiclens-data-v1.5.0-2026-09-15"

    try:
        async with async_session_factory() as session:
            result = await session.execute(text("SELECT version_num FROM alembic_version LIMIT 1;"))
            row = result.scalar()
            if row:
                alembic_rev = str(row)
            else:
                alembic_rev = "none"

            data_res = await session.execute(text("SELECT version, release_id FROM data_releases WHERE status = 'ACTIVE' ORDER BY created_at DESC LIMIT 1;"))
            data_row = data_res.fetchone()
            if data_row:
                data_version = str(data_row[0])
                data_release = str(data_row[1])
    except Exception:
        alembic_rev = "disconnected"

    return {
        "application": "CivicLens",
        "component": "backend",
        "environment": os.getenv("ENVIRONMENT", settings.ENVIRONMENT),
        "commit": build_commit,
        "commit_short": commit_short,
        "build_time": build_time,
        "database": {
            "alembic_revision": alembic_rev,
            "data_version": data_version,
            "data_release": data_release,
        },
    }

