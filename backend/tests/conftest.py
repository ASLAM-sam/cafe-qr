import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import asyncio
import copy
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.dependencies import get_db
from app.core.security import hash_password, create_access_token


class MockAsyncCursor:
    def __init__(self, docs: List[Dict[str, Any]]):
        self.docs = docs
        self._skip = 0
        self._limit = len(docs)

    def sort(self, key_or_list, direction=1):
        if isinstance(key_or_list, str):
            key = key_or_list
            reverse = direction == -1
            self.docs.sort(key=lambda d: d.get(key, 0), reverse=reverse)
        return self

    def skip(self, n: int):
        self._skip = n
        return self

    def limit(self, n: int):
        self._limit = n
        return self

    async def to_list(self, length: int):
        sliced = self.docs[self._skip : self._skip + self._limit]
        return [copy.deepcopy(d) for d in sliced[:length]]


class MockAsyncCollection:
    def __init__(self, name: str):
        self.name = name
        self.data: List[Dict[str, Any]] = []

    def _match(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k == "$and":
                if not all(self._match(doc, subq) for subq in v):
                    return False
                continue
            if isinstance(v, dict):
                if "$in" in v:
                    if doc.get(k) not in v["$in"]:
                        return False
                if "$gte" in v:
                    if doc.get(k) is None or doc.get(k) < v["$gte"]:
                        return False
            else:
                if doc.get(k) != v:
                    return False
        return True

    def find(self, query: Dict[str, Any] = None, projection: Dict[str, Any] = None):
        q = query or {}
        matched = [d for d in self.data if self._match(d, q)]
        return MockAsyncCursor(matched)

    async def find_one(self, query: Dict[str, Any], projection: Dict[str, Any] = None) -> Optional[Dict[str, Any]]:
        for d in self.data:
            if self._match(d, query):
                return copy.deepcopy(d)
        return None

    async def insert_one(self, doc: Dict[str, Any]):
        copied = copy.deepcopy(doc)
        self.data.append(copied)
        class InsertResult:
            inserted_id = "mock_obj_id"
        return InsertResult()

    async def find_one_and_update(
        self, query: Dict[str, Any], update: Dict[str, Any], return_document: bool = True, projection: Dict[str, Any] = None
    ) -> Optional[Dict[str, Any]]:
        for i, d in enumerate(self.data):
            if self._match(d, query):
                if "$set" in update:
                    d.update(copy.deepcopy(update["$set"]))
                return copy.deepcopy(d)
        return None

    async def delete_one(self, query: Dict[str, Any]):
        for i, d in enumerate(self.data):
            if self._match(d, query):
                del self.data[i]
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class DeleteResultZero:
            deleted_count = 0
        return DeleteResultZero()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return sum(1 for d in self.data if self._match(d, query))

    async def create_indexes(self, indexes):
        pass


class MockAsyncDatabase:
    def __init__(self):
        self.cafes = MockAsyncCollection("cafes")
        self.users = MockAsyncCollection("users")
        self.categories = MockAsyncCollection("categories")
        self.products = MockAsyncCollection("products")
        self.tables = MockAsyncCollection("tables")
        self.orders = MockAsyncCollection("orders")

    async def command(self, cmd, *args, **kwargs):
        if cmd == "ping":
            return {"ok": 1.0}
        return {}


@pytest.fixture
def mock_db():
    db = MockAsyncDatabase()

    # Seed Cafe A (Brew House)
    now = datetime.now(timezone.utc)
    db.cafes.data.append({
        "cafe_id": "cafe_001",
        "name": "Brew House",
        "slug": "brewhouse",
        "subdomain": "brewhouse",
        "currency": "INR",
        "tax_settings": {"tax_enabled": True, "tax_rate_percent": 5.0},
        "primary_color": "#0f172a",
        "status": "ACTIVE",
        "created_at": now,
        "updated_at": now,
    })

    # Seed Cafe B (Mocha Cafe)
    db.cafes.data.append({
        "cafe_id": "cafe_002",
        "name": "Mocha Cafe",
        "slug": "mochacafe",
        "subdomain": "mochacafe",
        "currency": "INR",
        "tax_settings": {"tax_enabled": False, "tax_rate_percent": 0.0},
        "primary_color": "#1e293b",
        "status": "ACTIVE",
        "created_at": now,
        "updated_at": now,
    })

    # Seed Owner A
    db.users.data.append({
        "user_id": "user_001",
        "cafe_id": "cafe_001",
        "name": "Ahmed Owner",
        "email": "owner_a@brewhouse.com",
        "password_hash": hash_password("Secret123!"),
        "role": "OWNER",
        "status": "ACTIVE",
        "created_at": now,
    })

    # Seed Owner B
    db.users.data.append({
        "user_id": "user_002",
        "cafe_id": "cafe_002",
        "name": "Mocha Owner",
        "email": "owner_b@mochacafe.com",
        "password_hash": hash_password("Secret123!"),
        "role": "OWNER",
        "status": "ACTIVE",
        "created_at": now,
    })

    return db


@pytest.fixture
def auth_headers_a():
    token = create_access_token({"sub": "user_001", "cafe_id": "cafe_001", "role": "OWNER"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def auth_headers_b():
    token = create_access_token({"sub": "user_002", "cafe_id": "cafe_002", "role": "OWNER"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def platform_admin_headers(mock_db):
    now = datetime.now(timezone.utc)
    admin_user = {
        "user_id": "user_platform_admin",
        "cafe_id": "platform",
        "username": "aslam",
        "name": "Platform Administrator",
        "password_hash": hash_password("aslam0077"),
        "role": "PLATFORM_ADMIN",
        "status": "ACTIVE",
        "created_at": now,
    }
    mock_db.users.data.append(admin_user)
    token = create_access_token({"sub": "user_platform_admin", "cafe_id": "platform", "role": "PLATFORM_ADMIN"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
async def async_client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        yield client
    app.dependency_overrides.clear()
