import time
from collections import defaultdict
from typing import Dict, List, Optional
from fastapi import Request, HTTPException, status


class InMemoryRateLimiter:
    """
    Lightweight in-memory sliding-window rate limiter.
    Provides protection against brute force and abusive request flooding
    on sensitive public endpoints (login, orders, QR resolution).
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.client_records: Dict[str, List[float]] = defaultdict(list)

    def check(self, request: Request, custom_limit: Optional[int] = None) -> None:
        limit = custom_limit or self.requests_per_minute
        client_ip = "unknown"

        # Check X-Forwarded-For first (from Vercel / reverse proxy)
        forwarded = request.headers.get("X-Forwarded-For")
        if forwarded:
            client_ip = forwarded.split(",")[0].strip()
        elif request.client and request.client.host:
            client_ip = request.client.host

        now = time.time()
        window_start = now - 60.0

        # Filter timestamps within the 60-second window
        recent_timestamps = [t for t in self.client_records[client_ip] if t > window_start]
        if len(recent_timestamps) >= limit:
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please wait a moment and try again.",
            )

        recent_timestamps.append(now)
        self.client_records[client_ip] = recent_timestamps


# Pre-configured rate limiters for critical endpoints
login_rate_limiter = InMemoryRateLimiter(requests_per_minute=15)
order_rate_limiter = InMemoryRateLimiter(requests_per_minute=30)
public_rate_limiter = InMemoryRateLimiter(requests_per_minute=120)
