import pytest
from unittest.mock import patch
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from sqlalchemy import text

from app.core.config import settings
from app.core.postgres_database import (
    normalize_postgres_url,
    get_postgres_engine,
    check_postgres_connection,
    get_postgres_session,
    close_postgres_connection,
    pg_state,
)


def test_normalize_postgres_url():
    """Verify URL scheme transformation and SSL mode normalization for asyncpg."""
    # Standard postgres:// scheme
    url1, args1 = normalize_postgres_url("postgres://user:pass@localhost:5432/testdb")
    assert url1 == "postgresql+asyncpg://user:pass@localhost:5432/testdb"
    assert args1 == {}

    # Standard postgresql:// scheme
    url2, args2 = normalize_postgres_url("postgresql://user:pass@ep-pooler.region.neon.tech/neondb")
    assert url2 == "postgresql+asyncpg://user:pass@ep-pooler.region.neon.tech/neondb"
    assert args2 == {}

    # URL with sslmode=require (Neon / Supabase / AWS format)
    url3, args3 = normalize_postgres_url("postgresql://user:pass@host/db?sslmode=require")
    assert url3 == "postgresql+asyncpg://user:pass@host/db"
    assert args3.get("ssl") == "require"

    # URL with ssl=true
    url4, args4 = normalize_postgres_url("postgresql://user:pass@host/db?ssl=true")
    assert url4 == "postgresql+asyncpg://user:pass@host/db"
    assert args4.get("ssl") == "require"

    # URL with Neon query parameters: channel_binding=prefer&sslmode=require
    url5, args5 = normalize_postgres_url("postgresql://user:pass@ep-pooler.region.neon.tech/neondb?sslmode=require&channel_binding=prefer")
    assert url5 == "postgresql+asyncpg://user:pass@ep-pooler.region.neon.tech/neondb"
    assert "channel_binding" not in url5
    assert args5.get("ssl") == "require"


@pytest.mark.asyncio
async def test_postgres_unconfigured_behavior():
    """Verify graceful handling when POSTGRES_DATABASE_URL is not set."""
    with patch.object(settings, "POSTGRES_DATABASE_URL", None):
        # Reset state for isolation
        pg_state.engine = None
        pg_state.session_factory = None

        assert get_postgres_engine() is None

        status = await check_postgres_connection()
        assert status["connected"] is False
        assert status["status"] == "not_configured"

        with pytest.raises(RuntimeError) as exc_info:
            async for _ in get_postgres_session():
                pass
        assert "POSTGRES_DATABASE_URL" in str(exc_info.value)


@pytest.mark.asyncio
async def test_health_endpoint_reports_postgres_status(async_client):
    """Verify /health and /api/health report both MongoDB and PostgreSQL status cleanly."""
    with patch.object(settings, "POSTGRES_DATABASE_URL", None):
        res = await async_client.get("/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        # Preserves backward compatibility contract for monitoring
        assert data["database"] == "connected"
        assert data["mongodb"] == "connected"
        assert data["postgresql"] == "not_configured"

        # Also test /api/health alias
        res_alias = await async_client.get("/api/health")
        assert res_alias.status_code == 200
        assert res_alias.json()["postgresql"] == "not_configured"


@pytest.mark.asyncio
async def test_postgres_simulated_connection_check():
    """Verify check_postgres_connection correctly evaluates an active async engine."""
    # Test async connection execution logic using a mocked engine returning SELECT 1
    mock_engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        poolclass=NullPool,
    )
    
    pg_state.engine = mock_engine
    try:
        with patch.object(settings, "POSTGRES_DATABASE_URL", "postgresql://mock:mock@localhost/mock"):
            result = await check_postgres_connection()
            assert result["connected"] is True
            assert result["status"] == "connected"
            assert "pooling" in result
    finally:
        await mock_engine.dispose()
        pg_state.engine = None
        pg_state.session_factory = None


def test_alembic_ini_no_secrets():
    """Verify alembic.ini contains no hardcoded credentials."""
    import configparser
    import os

    ini_path = os.path.join(os.path.dirname(__file__), "..", "alembic.ini")
    assert os.path.exists(ini_path)

    config = configparser.ConfigParser()
    config.read(ini_path)

    # sqlalchemy.url must not be set or must be blank in alembic.ini
    if config.has_option("alembic", "sqlalchemy.url"):
        val = config.get("alembic", "sqlalchemy.url")
        assert "password" not in val.lower()
        assert "driver://" not in val
