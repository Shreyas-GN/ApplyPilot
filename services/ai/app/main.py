from datetime import UTC, datetime

import redis
from fastapi import FastAPI

from app.config import settings

app = FastAPI(title="ApplyPilot AI Service")


@app.get("/health")
def health() -> dict:
    redis_status = "ok"
    try:
        client = redis.Redis.from_url(settings.redis_url, socket_connect_timeout=1)
        client.ping()
    except redis.RedisError:
        redis_status = "error"

    status = "ok" if redis_status == "ok" else "degraded"
    return {
        "status": status,
        "checks": {"redis": redis_status},
        "timestamp": datetime.now(UTC).isoformat(),
    }
