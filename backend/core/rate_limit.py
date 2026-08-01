"""Simple in-process sliding-window rate limiter (single worker)."""

from __future__ import annotations

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request

_buckets: dict[str, deque[float]] = defaultdict(deque)


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def check_rate_limit(key: str, max_calls: int, window_seconds: int = 60) -> None:
    now = time.monotonic()
    q = _buckets[key]
    while q and now - q[0] > window_seconds:
        q.popleft()
    if len(q) >= max_calls:
        raise HTTPException(
            status_code=429,
            detail="Too many requests. Please try again later.",
        )
    q.append(now)


def reset_rate_limits() -> None:
    """Test helper — clear all buckets."""
    _buckets.clear()
