import pytest


@pytest.mark.asyncio
async def test_login_success(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"email": "owner_a@brewhouse.com", "password": "Secret123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == "owner_a@brewhouse.com"
    assert "password_hash" not in data["user"]


@pytest.mark.asyncio
async def test_login_invalid_password(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"email": "owner_a@brewhouse.com", "password": "WrongPassword"}
    )
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_login_unknown_email(async_client):
    response = await async_client.post(
        "/api/auth/login",
        json={"email": "nonexistent@cafe.com", "password": "Secret123!"}
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_without_auth(async_client):
    response = await async_client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_auth(async_client, auth_headers_a):
    response = await async_client.get("/api/auth/me", headers=auth_headers_a)
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["email"] == "owner_a@brewhouse.com"
    assert data["cafe"]["name"] == "Brew House"


def test_login_request_email_validation():
    """Regression test ensuring email-validator dependency is functional with LoginRequest."""
    from pydantic import ValidationError
    from app.schemas.auth import LoginRequest

    # Valid email succeeds
    req = LoginRequest(email="valid.user@example.com", password="password123")
    assert str(req.email) == "valid.user@example.com"

    # Invalid email raises ValidationError
    with pytest.raises(ValidationError):
        LoginRequest(email="not-an-email", password="password123")
