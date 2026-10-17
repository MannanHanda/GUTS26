"""FastAPI application factory. Run with: uvicorn app.main:app --reload (from backend/)."""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app import __version__
from app.api.routes import router
from app.config import CORS_ORIGINS
from app.providers.repository import DataRepository

log = logging.getLogger(__name__)

# Maps HTTP status codes raised outside our routes (e.g. by routing) to contract error codes.
STATUS_CODES = {404: "not_found", 405: "method_not_allowed", 422: "validation_error", 503: "provider_unavailable"}


def _error_body(code: str, message: str, details: list[dict] | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or []}}


def create_app(repo: DataRepository | None = None) -> FastAPI:
    app = FastAPI(
        title="Uniwise API",
        version=__version__,
        description="Deterministic accommodation and commute decision engine for students moving to Glasgow.",
    )
    app.state.repo = repo or DataRepository()
    app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["GET", "POST"], allow_headers=["*"])
    app.include_router(router)

    @app.exception_handler(RequestValidationError)
    async def _validation(_: Request, exc: RequestValidationError) -> JSONResponse:
        details = [{"field": ".".join(str(p) for p in e["loc"][1:]) or None, "message": e["msg"]} for e in exc.errors()]
        return JSONResponse(
            status_code=422, content=_error_body("validation_error", "Request validation failed.", details)
        )

    # Registered on Starlette's base class so routing errors (unknown path, wrong method) are covered too.
    @app.exception_handler(StarletteHTTPException)
    async def _http(_: Request, exc: StarletteHTTPException) -> JSONResponse:
        if isinstance(exc.detail, dict) and "error" in exc.detail:
            return JSONResponse(status_code=exc.status_code, content=exc.detail)
        code = STATUS_CODES.get(exc.status_code, "internal_error")
        return JSONResponse(status_code=exc.status_code, content=_error_body(code, str(exc.detail)))

    @app.exception_handler(Exception)
    async def _unexpected(request: Request, exc: Exception) -> JSONResponse:
        log.exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse(status_code=500, content=_error_body("internal_error", "An unexpected error occurred."))

    return app


app = create_app()
