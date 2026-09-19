import sys
import os

# Ensure parent directory (backend/) is in sys.path so 'app...' imports work regardless of entrypoint
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.core.config import settings
from app.core.database import connect_to_mongo, close_mongo_connection
from app.api import health, auth, cafes, categories, products, tables, orders, platform, realtime

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("cafe_qr")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan managing DB connection setup and teardown."""
    logger.info("Starting Café QR Ordering Backend...")
    await connect_to_mongo()
    yield
    logger.info("Shutting down Café QR Ordering Backend...")
    await close_mongo_connection()


app = FastAPI(
    title="Café QR Ordering SaaS API",
    description="Production-ready multi-tenant backend for café QR ordering platform.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Configuration
# Secure origin regex allowing dynamic cafe subdomains (*.mydomain.com)
clean_domain = (
    settings.APP_DOMAIN.replace("https://", "")
    .replace("http://", "")
    .split("/")[0]
    .split(":")[0]
    .strip()
    .lower()
)
if settings.ENVIRONMENT == "development":
    cors_origin_regex = r"^https?://([a-zA-Z0-9-]+\.)?(localhost|127\.0\.0\.1)(:[0-9]+)?$"
else:
    import re
    cors_origin_regex = rf"^https://([a-zA-Z0-9-]+\.)?{re.escape(clean_domain)}$"


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Tenant-Subdomain"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Inject production security headers on all responses."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "SAMEORIGIN"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response


# Global Exception Handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Format Pydantic validation errors cleanly without internal details."""
    errors = []
    for err in exc.errors():
        field = " -> ".join(str(loc) for loc in err["loc"] if loc != "body")
        errors.append(f"{field}: {err['msg']}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "; ".join(errors)},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler to prevent leaking internal stack traces or secrets."""
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Please try again later."},
    )


# Include Routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(cafes.router)
app.include_router(categories.router)
app.include_router(products.router)
app.include_router(tables.router)
app.include_router(orders.router)
app.include_router(platform.router)
app.include_router(realtime.router)
