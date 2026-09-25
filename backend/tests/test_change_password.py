import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app


@pytest.mark.asyncio
async def test_platform_admin_change_password_lifecycle():
    """
    Comprehensive test for Platform Admin password change:
    1. Verify unauthenticated call to /api/platform/change-password is rejected (401).
    2. Verify current login works with aslam / aslam0077.
    3. Verify invalid current password is rejected (400).
    4. Verify mismatched confirmation is rejected by schema validator (422).
    5. Verify password too short (< 8 chars) is rejected (422).
    6. Verify identical new password is rejected (422).
    7. Successfully change password to a new temporary password.
    8. Verify old password is now rejected (401).
    9. Verify new password successfully authenticates (200).
    10. Change password back to aslam0077 and confirm success.
    """
    transport = ASGITransport(app=app)
    
    # 1. Unauthenticated call rejected (401)
    async with AsyncClient(transport=transport, base_url="http://test") as unauth_client:
        unauth_res = await unauth_client.post(
            "/api/platform/change-password",
            json={
                "current_password": "any",
                "new_password": "NewSecretPass123",
                "confirm_password": "NewSecretPass123"
            }
        )
        assert unauth_res.status_code == 401
        assert "Authentication required" in unauth_res.json()["detail"]

    # 2. Login with aslam / aslam0077
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        login_res = await client.post(
            "/api/auth/login",
            json={"username": "aslam", "password": "aslam0077"}
        )
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        data = login_res.json()
        token = data["access_token"]
        assert data["user"]["role"] == "PLATFORM_ADMIN"
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Invalid current password rejected (400)
        wrong_curr_res = await client.post(
            "/api/platform/change-password",
            headers=headers,
            json={
                "current_password": "WrongPassword999",
                "new_password": "NewSecretPass123",
                "confirm_password": "NewSecretPass123"
            }
        )
        assert wrong_curr_res.status_code == 400
        assert "Current password is incorrect" in wrong_curr_res.json()["detail"]

        # 4. Mismatched confirmation rejected (422)
        mismatch_res = await client.post(
            "/api/platform/change-password",
            headers=headers,
            json={
                "current_password": "aslam0077",
                "new_password": "NewSecretPass123",
                "confirm_password": "DifferentPass123"
            }
        )
        assert mismatch_res.status_code == 422

        # 5. Password too short rejected (422)
        short_res = await client.post(
            "/api/platform/change-password",
            headers=headers,
            json={
                "current_password": "aslam0077",
                "new_password": "short",
                "confirm_password": "short"
            }
        )
        assert short_res.status_code == 422

        # 6. Identical password rejected (422)
        same_res = await client.post(
            "/api/platform/change-password",
            headers=headers,
            json={
                "current_password": "aslam0077",
                "new_password": "aslam0077",
                "confirm_password": "aslam0077"
            }
        )
        assert same_res.status_code == 422

        # 7. Successfully change password to TempNewPass2026!
        temp_pass = "TempNewPass2026!"
        change_res = await client.post(
            "/api/platform/change-password",
            headers=headers,
            json={
                "current_password": "aslam0077",
                "new_password": temp_pass,
                "confirm_password": temp_pass
            }
        )
        assert change_res.status_code == 200, f"Change failed: {change_res.text}"
        assert change_res.json()["success"] is True

    # 8. Verify old password no longer works
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        old_login_res = await client.post(
            "/api/auth/login",
            json={"username": "aslam", "password": "aslam0077"}
        )
        assert old_login_res.status_code == 401

        # 9. Verify new password works
        new_login_res = await client.post(
            "/api/auth/login",
            json={"username": "aslam", "password": temp_pass}
        )
        assert new_login_res.status_code == 200
        new_token = new_login_res.json()["access_token"]
        new_headers = {"Authorization": f"Bearer {new_token}"}
        assert new_login_res.json()["user"]["role"] == "PLATFORM_ADMIN"

        # 10. Revert / Set password back to aslam0077 as requested by user
        revert_res = await client.post(
            "/api/platform/change-password",
            headers=new_headers,
            json={
                "current_password": temp_pass,
                "new_password": "aslam0077",
                "confirm_password": "aslam0077"
            }
        )
        assert revert_res.status_code == 200
        assert revert_res.json()["success"] is True

    # 11. Confirm final login with aslam / aslam0077
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        final_login = await client.post(
            "/api/auth/login",
            json={"username": "aslam", "password": "aslam0077"}
        )
        assert final_login.status_code == 200
        assert final_login.json()["user"]["role"] == "PLATFORM_ADMIN"
