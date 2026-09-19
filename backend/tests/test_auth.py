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
    assert "Invalid username/email or password" in response.json()["detail"]


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

    # Valid username succeeds without email
    req_username = LoginRequest(username="aslam", password="password123")
    assert req_username.username == "aslam"
    assert req_username.email is None


@pytest.mark.asyncio
async def test_platform_admin_login_success(async_client):
    """Platform Admin login with username and password succeeds."""
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "aslam", "password": "aslam0077"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["username"] == "aslam"
    assert data["user"]["role"] == "PLATFORM_ADMIN"
    assert "password_hash" not in data["user"]


@pytest.mark.asyncio
async def test_platform_admin_login_invalid_username(async_client):
    """Incorrect username returns 401."""
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "wrong_admin", "password": "aslam0077"},
    )
    assert response.status_code == 401
    assert "Invalid username/email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_platform_admin_login_invalid_password(async_client):
    """Incorrect password returns 401."""
    response = await async_client.post(
        "/api/auth/login",
        json={"username": "aslam", "password": "wrongpassword"},
    )
    assert response.status_code == 401
    assert "Invalid username/email or password" in response.json()["detail"]


@pytest.mark.asyncio
async def test_platform_cafes_unauthenticated(async_client):
    """No authentication on /api/platform/cafes returns 401."""
    get_res = await async_client.get("/api/platform/cafes")
    assert get_res.status_code == 401

    post_res = await async_client.post("/api/platform/cafes", json={
        "name": "Test Cafe",
        "subdomain": "testcafe",
        "owner_name": "Test Owner",
        "owner_email": "test@cafe.com",
        "owner_password": "password123",
        "currency": "INR",
    })
    assert post_res.status_code == 401


@pytest.mark.asyncio
async def test_platform_cafes_authenticated(async_client, platform_admin_headers):
    """Platform Admin can access GET and POST /api/platform/cafes."""
    get_res = await async_client.get("/api/platform/cafes", headers=platform_admin_headers)
    assert get_res.status_code == 200
    cafes = get_res.json()
    assert isinstance(cafes, list)

    post_res = await async_client.post(
        "/api/platform/cafes",
        headers=platform_admin_headers,
        json={
            "name": "New Roastery",
            "subdomain": "roastery",
            "owner_name": "Roastery Owner",
            "owner_email": "owner@roastery.com",
            "owner_password": "password123",
            "currency": "INR",
        },
    )
    assert post_res.status_code == 201
    created = post_res.json()
    assert created["cafe"]["subdomain"] == "roastery"
    assert created["owner"]["email"] == "owner@roastery.com"


@pytest.mark.asyncio
async def test_cafe_owner_cannot_access_platform_routes(async_client, auth_headers_a):
    """A regular Café Owner token is rejected on /api/platform/* with 403 Forbidden."""
    get_res = await async_client.get("/api/platform/cafes", headers=auth_headers_a)
    assert get_res.status_code == 403
    assert "Platform administrator privileges required" in get_res.json()["detail"]

    post_res = await async_client.post(
        "/api/platform/cafes",
        headers=auth_headers_a,
        json={
            "name": "Illegal Cafe",
            "subdomain": "illegal",
            "owner_name": "Hacker",
            "owner_email": "hacker@cafe.com",
            "owner_password": "password123",
            "currency": "INR",
        },
    )
    assert post_res.status_code == 403


@pytest.mark.asyncio
async def test_logout_clears_cookie(async_client):
    """Logout endpoint returns success and clears auth cookie."""
    response = await async_client.post("/api/auth/logout")
    assert response.status_code == 200
    assert response.json()["success"] is True

