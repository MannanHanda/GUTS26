"""HTTP routes. Thin: validate, call the service/repository, return contract models."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Depends, Query, Request
from fastapi.exceptions import HTTPException

from app import __version__
from app.decision_engine.commute import build_transport_options
from app.models.api import (
    AccommodationList,
    BenefitList,
    ErrorResponse,
    HealthResponse,
    RecommendationRequest,
    RecommendationResponse,
    TransportOptionList,
)
from app.models.domain import AccommodationOption, SourceStatus, TransportMode
from app.providers.repository import DataRepository
from app.services.recommendations import (
    CampusNotFound,
    ProviderUnavailable,
    RecommendationService,
)

router = APIRouter(prefix="/api/v1")

ERROR_RESPONSES = {
    404: {"model": ErrorResponse, "description": "Resource not found"},
    422: {"model": ErrorResponse, "description": "Validation error"},
    500: {"model": ErrorResponse, "description": "Unexpected server error"},
    503: {"model": ErrorResponse, "description": "A required data source is unavailable"},
}


def get_repo(request: Request) -> DataRepository:
    return request.app.state.repo


def get_service(repo: DataRepository = Depends(get_repo)) -> RecommendationService:
    return RecommendationService(repo)


@router.get("/health", response_model=HealthResponse, tags=["system"])
def health(repo: DataRepository = Depends(get_repo)) -> HealthResponse:
    datasets = {s.source_id: s.status for s in repo.source_statuses()}
    degraded = any(s == "unavailable" for s in datasets.values())
    return HealthResponse(status="degraded" if degraded else "ok", version=__version__, datasets=datasets)


@router.get("/sources/status", response_model=list[SourceStatus], tags=["system"])
def sources_status(repo: DataRepository = Depends(get_repo)) -> list[SourceStatus]:
    return repo.source_statuses()


@router.get("/accommodations", response_model=AccommodationList, responses=ERROR_RESPONSES, tags=["accommodation"])
def list_accommodations(
    ensuite: bool | None = Query(
        default=None,
        description="Matches only rooms whose ensuite value equals this. Rooms where the source is silent never match.",
    ),
    accessible: bool | None = Query(default=None),
    studio: bool | None = Query(default=None),
    max_weekly_rent_gbp: float | None = Query(default=None, gt=0, le=1000),
    sort: Literal["weekly_rent", "name"] = "weekly_rent",
    repo: DataRepository = Depends(get_repo),
) -> AccommodationList:
    items = repo.accommodations()
    if not items:
        raise HTTPException(503, detail=_err("provider_unavailable", "Accommodation data is unavailable."))
    if ensuite is not None:
        items = [a for a in items if a.ensuite is ensuite]
    if accessible is not None:
        items = [a for a in items if a.accessible is accessible]
    if studio is not None:
        items = [a for a in items if a.studio is studio]
    if max_weekly_rent_gbp is not None:
        items = [a for a in items if a.weekly_rent_gbp <= max_weekly_rent_gbp]
    key = (
        (lambda a: (a.weekly_rent_gbp, a.id)) if sort == "weekly_rent" else (lambda a: (a.residence_name, a.room_type))
    )
    items = sorted(items, key=key)
    return AccommodationList(items=items, total=len(items), sources=repo.source_statuses())


@router.get(
    "/accommodations/{accommodation_id}",
    response_model=AccommodationOption,
    responses=ERROR_RESPONSES,
    tags=["accommodation"],
)
def get_accommodation(accommodation_id: str, repo: DataRepository = Depends(get_repo)) -> AccommodationOption:
    found = repo.accommodation(accommodation_id)
    if found is None:
        raise HTTPException(404, detail=_err("not_found", f"No accommodation with id {accommodation_id!r}."))
    return found


@router.get("/transport/options", response_model=TransportOptionList, responses=ERROR_RESPONSES, tags=["transport"])
def transport_options(
    accommodation_id: str,
    campus_id: str = Query(default="gilmorehill", min_length=1, max_length=64),
    campus_days_per_week: int = Query(default=5, ge=1, le=7),
    modes: list[TransportMode] = Query(default=["walk", "cycle", "subway"]),
    repo: DataRepository = Depends(get_repo),
) -> TransportOptionList:
    accom = repo.accommodation(accommodation_id)
    if accom is None:
        raise HTTPException(404, detail=_err("not_found", f"No accommodation with id {accommodation_id!r}."))
    campus = repo.campus(campus_id)
    if campus is None:
        raise HTTPException(404, detail=_err("not_found", f"No campus with id {campus_id!r}."))
    items = build_transport_options(
        repo,
        accom.residence_id,
        accom.residence_name,
        campus.campus_id,
        campus.name,
        campus_days_per_week,
        list(dict.fromkeys(modes)),
    )
    return TransportOptionList(
        accommodation_id=accom.id,
        campus_id=campus.campus_id,
        campus_days_per_week=campus_days_per_week,
        items=items,
        generated_at=datetime.now(UTC).replace(microsecond=0),
    )


@router.get("/benefits", response_model=BenefitList, responses=ERROR_RESPONSES, tags=["benefits"])
def benefits(repo: DataRepository = Depends(get_repo)) -> BenefitList:
    schemes = repo.concessions()
    status = {s.source_id: s for s in repo.source_statuses()}.get("transport_scotland_concessions")
    if not schemes:
        raise HTTPException(503, detail=_err("provider_unavailable", "Benefit data is unavailable."))
    return BenefitList(
        items=schemes,
        total=len(schemes),
        note="Potential benefits only. Eligibility depends on rules each provider applies; none is confirmed here.",
        sources=[status] if status else [],
    )


@router.post(
    "/recommendations/setup", response_model=RecommendationResponse, responses=ERROR_RESPONSES, tags=["recommendations"]
)
def recommend(
    request: RecommendationRequest, service: RecommendationService = Depends(get_service)
) -> RecommendationResponse:
    try:
        return service.recommend(request)
    except CampusNotFound as exc:
        raise HTTPException(404, detail=_err("not_found", f"No campus with id {exc.args[0]!r}.")) from exc
    except ProviderUnavailable as exc:
        raise HTTPException(503, detail=_err("provider_unavailable", str(exc))) from exc


def _err(code: str, message: str, details: list | None = None) -> dict:
    return {"error": {"code": code, "message": message, "details": details or []}}
