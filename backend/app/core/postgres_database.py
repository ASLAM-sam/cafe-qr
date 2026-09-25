import logging
from typing import Optional, AsyncGenerator, Dict, Any
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import NullPool
from sqlalchemy import text
from app.core.config import settings

logger = logging.getLogger("cafe_qr.postgres")


def normalize_postgres_url(raw_url: str) -> tuple[str, Dict[str, Any]]:
    """
    Normalizes a standard PostgreSQL URL for asyncpg and serverless usage.
    Handles:
    - Scheme transformation: 'postgres://' or 'postgresql://' -> 'postgresql+asyncpg://'
    - SSL mode parameter translation for asyncpg (which prefers connect_args over sslmode query param)
    """
    if raw_url.startswith("sqlite"):
        return raw_url, {}

    parsed = urlparse(raw_url)
    scheme = parsed.scheme.lower()

    if scheme in ("postgres", "postgresql"):
        scheme = "postgresql+asyncpg"
    elif not scheme.startswith("sqlite") and scheme != "postgresql+asyncpg":
        scheme = "postgresql+asyncpg"

    query_params = parse_qs(parsed.query)
    connect_args: Dict[str, Any] = {}

    # Translate sslmode for asyncpg
    if "sslmode" in query_params:
        mode = query_params.pop("sslmode")[0].lower()
        if mode in ("require", "verify-ca", "verify-full"):
            connect_args["ssl"] = mode
        elif mode == "disable":
            connect_args["ssl"] = False
    elif "ssl" in query_params:
        ssl_val = query_params.pop("ssl")[0].lower()
        if ssl_val in ("true", "1", "require"):
            connect_args["ssl"] = "require"

    # Remove query parameters that asyncpg does not accept as connect() keyword arguments
    # (e.g. Neon connection strings often append channel_binding=prefer or channel_binding=require)
    query_params.pop("channel_binding", None)
    query_params.pop("gssencmode", None)

    clean_query = urlencode(query_params, doseq=True)
    clean_url = urlunparse((
        scheme,
        parsed.netloc,
        parsed.path,
        parsed.params,
        clean_query,
        parsed.fragment,
    ))

    return clean_url, connect_args


class PostgresDatabase:
    """Singleton state manager for PostgreSQL async engine and sessionmaker."""
    engine: Optional[AsyncEngine] = None
    session_factory: Optional[async_sessionmaker[AsyncSession]] = None


pg_state = PostgresDatabase()


def get_postgres_engine() -> Optional[AsyncEngine]:
    """
    Returns or lazily initializes the AsyncEngine for PostgreSQL.
    Configured with NullPool for serverless compatibility when using an upstream pooler (PgBouncer/Neon).
    """
    if not settings.POSTGRES_DATABASE_URL or not settings.POSTGRES_DATABASE_URL.strip():
        return None

    if pg_state.engine is None:
        clean_url, connect_args = normalize_postgres_url(settings.POSTGRES_DATABASE_URL.strip())
        
        # Serverless connection strategy:
        # NullPool delegates all connection reuse to the upstream provider pooler (Neon / Supabase PgBouncer).
        # It ensures connections are never leaked across frozen Lambda containers.
        pg_state.engine = create_async_engine(
            clean_url,
            poolclass=NullPool,
            connect_args=connect_args,
            echo=False,
        )
        pg_state.session_factory = async_sessionmaker(
            bind=pg_state.engine,
            class_=AsyncSession,
            expire_on_commit=False,
            autoflush=False,
        )
        logger.info("Initialized PostgreSQL AsyncEngine with NullPool for serverless resilience.")

    return pg_state.engine


def get_postgres_sessionmaker() -> Optional[async_sessionmaker[AsyncSession]]:
    """Returns the async sessionmaker if PostgreSQL is configured."""
    if pg_state.session_factory is None:
        get_postgres_engine()
    return pg_state.session_factory


async def get_postgres_session() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency yielding an async database session within a transaction context."""
    session_maker = get_postgres_sessionmaker()
    if session_maker is None:
        raise RuntimeError("PostgreSQL database is not configured. Set POSTGRES_DATABASE_URL.")

    async with session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def check_postgres_connection() -> Dict[str, Any]:
    """
    Performs a non-destructive connectivity check: SELECT 1.
    Returns status, version, and connection details without exposing credentials.
    """
    if not settings.POSTGRES_DATABASE_URL or not settings.POSTGRES_DATABASE_URL.strip():
        return {
            "status": "not_configured",
            "message": "POSTGRES_DATABASE_URL is not configured.",
            "connected": False,
        }

    try:
        engine = get_postgres_engine()
        if engine is None:
            return {
                "status": "not_configured",
                "connected": False,
            }

        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            version_str = "unknown"
            try:
                ver_res = await conn.execute(text("SELECT version()"))
                row = ver_res.first()
                if row:
                    version_str = str(row[0]).split(",")[0]
            except Exception:
                pass

            # Check SSL status
            ssl_active = False
            try:
                ssl_check = await conn.execute(text("SHOW ssl"))
                ssl_row = ssl_check.first()
                if ssl_row and str(ssl_row[0]).lower() in ("on", "true"):
                    ssl_active = True
            except Exception:
                ssl_active = True if "ssl" in str(engine.url) or "ssl" in getattr(engine.dialect, "connect_args", {}) else False

            return {
                "status": "connected",
                "connected": True,
                "version": version_str,
                "pooling": "serverless_nullpool (upstream pgbouncer)",
                "ssl": ssl_active,
            }
    except Exception as e:
        logger.warning(f"PostgreSQL connectivity check failed: {e}")
        return {
            "status": "unreachable",
            "connected": False,
            "error": str(e),
        }


async def close_postgres_connection():
    """Cleanly disposes the PostgreSQL engine on application shutdown."""
    if pg_state.engine is not None:
        await pg_state.engine.dispose()
        pg_state.engine = None
        pg_state.session_factory = None
        logger.info("Disposed PostgreSQL AsyncEngine.")
