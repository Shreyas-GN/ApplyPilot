from datetime import UTC, datetime

import redis
from fastapi import FastAPI, HTTPException

from app.config import settings
from app.resume_parsing.schemas import ParseResumeRequest, ResumeParsedData
from app.resume_parsing.service import parse_resume

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


@app.post(
    "/parse-resume",
    response_model=ResumeParsedData,
    response_model_by_alias=True,
    # The Zod schema on the Node side treats these fields as optional
    # (absent-or-undefined), not nullable — so unset fields must be omitted
    # from the JSON entirely rather than serialized as `null`.
    response_model_exclude_none=True,
)
def parse_resume_endpoint(request: ParseResumeRequest) -> ResumeParsedData:
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="text must not be empty")
    try:
        return parse_resume(request.text, settings)
    except Exception as exc:  # noqa: BLE001 - normalize any provider error to a 502
        raise HTTPException(status_code=502, detail="Resume parsing provider failed") from exc
