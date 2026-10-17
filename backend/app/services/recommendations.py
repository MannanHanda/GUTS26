"""Application service: loads data, runs the decision engine and builds the API response."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime

from app import __version__
from app.decision_engine import explain
from app.decision_engine.commute import build_transport_options
from app.decision_engine.costs import COST_ASSUMPTIONS
from app.decision_engine.engine import EngineResult, run
from app.decision_engine.scoring import (
    EVIDENCE_WEIGHT_CAP,
    STATUS_CONFIDENCE,
    TIE_THRESHOLD_POINTS,
    Candidate,
)
from app.models.api import (
    ExcludedCandidate,
    MethodNote,
    PriorityAlternative,
    ProfileSummary,
    RankedCandidate,
    RecommendationRequest,
    RecommendationResponse,
    StudentProfile,
    TransportAlternative,
)
from app.models.domain import TransportOption
from app.providers.repository import DataRepository


class CampusNotFound(LookupError):
    pass


class ProviderUnavailable(RuntimeError):
    pass


NORMALISATION = (
    "Each factor is min-max scaled across the feasible options (lower raw value = better, 0-1). "
    "Identical values score 1 for everyone. Missing values score 0. Weights are the student's priorities divided by "
    "their sum; evidence confidence is capped at 20% of the total weight."
)


def _budget_text(profile: StudentProfile) -> str:
    c = profile.constraints
    if c.max_monthly_budget_gbp is None:
        return "No monthly budget set"
    kind = "hard limit" if c.budget_is_hard else "preference"
    return f"£{c.max_monthly_budget_gbp:.0f} per month ({kind})"


def _commute_text(profile: StudentProfile) -> str:
    c = profile.constraints
    if c.max_commute_min is None:
        return "No commute limit set"
    kind = "hard limit" if c.commute_is_hard else "preference"
    return f"{c.max_commute_min} min one way ({kind})"


def _requirements(profile: StudentProfile) -> list[str]:
    c = profile.constraints
    out = []
    if c.require_ensuite:
        out.append("Ensuite room required")
    if c.require_accessible:
        out.append("Accessible room required")
    if c.require_studio:
        out.append("Studio required")
    if c.exclude_shared_rooms:
        out.append("Shared rooms excluded")
    if c.max_upfront_gbp is not None:
        out.append(f"Upfront cost up to £{c.max_upfront_gbp:.0f}")
    return out


class RecommendationService:
    def __init__(self, repo: DataRepository):
        self.repo = repo

    def recommend(self, request: RecommendationRequest) -> RecommendationResponse:
        profile = request.profile
        campus = self.repo.campus(profile.campus_id)
        if campus is None:
            raise CampusNotFound(profile.campus_id)
        accommodations = self.repo.accommodations()
        if not accommodations:
            raise ProviderUnavailable("No accommodation data is loaded.")

        transport_by_residence: dict[str, list[TransportOption]] = {}
        for accom in accommodations:
            if accom.residence_id not in transport_by_residence:
                transport_by_residence[accom.residence_id] = build_transport_options(
                    self.repo,
                    accom.residence_id,
                    accom.residence_name,
                    campus.campus_id,
                    campus.name,
                    profile.campus_days_per_week,
                    profile.allowed_modes,
                )

        result = run(profile, accommodations, transport_by_residence)
        return self._response(request, result, campus.name)

    # ------------------------------------------------------------------ assembly
    def _response(
        self, request: RecommendationRequest, result: EngineResult, campus_name: str
    ) -> RecommendationResponse:
        profile = request.profile
        now = datetime.now(UTC).replace(microsecond=0)
        n_rooms = len(result.ranked)
        n_feasible = n_rooms + sum(len(v) for v in result.alternatives_by_room.values())
        eligibility = explain.eligibility_notes(profile, self.repo.concessions())
        top = result.ranked[0] if result.ranked else None
        ranked = [
            self._ranked(i + 1, c, result, profile, n_rooms) for i, c in enumerate(result.ranked[: request.limit])
        ]

        alternatives = [
            PriorityAlternative(
                label=f"{r.accommodation.residence_name} - {r.accommodation.room_type} ({r.transport.mode})",
                candidate_id=r.candidate_id,
                rank=r.rank,
                reason=r.comparison or "Ranked next on overall score.",
            )
            for r in ranked[1:4]
        ]
        uncertainties = [
            "Room availability is not published by any source; no room is confirmed as available.",
        ]
        if eligibility:
            uncertainties.append("Concession eligibility is not confirmed; no concession is included in any cost.")
        if result.excluded:
            uncertainties.append(f"{len(result.excluded)} room option(s) were excluded; see the exclusion reasons.")

        return RecommendationResponse(
            recommendation_id=self._id(request),
            generated_at=now,
            profile_summary=ProfileSummary(
                campus_id=profile.campus_id,
                campus_name=campus_name,
                budget=_budget_text(profile),
                commute=_commute_text(profile),
                allowed_modes=profile.allowed_modes,
                requirements=_requirements(profile),
                effective_weights=result.weights,
                uncertainties=uncertainties,
            ),
            feasibility="feasible" if result.ranked else "no_feasible_options",
            ranking_confidence=result.ranking_confidence,
            summary=explain.summary(result),
            recommended_candidate_id=top.candidate_id if top else None,
            ranked=ranked,
            total_candidates_evaluated=result.total_evaluated,
            total_feasible=n_feasible,
            alternatives=alternatives,
            excluded=[
                ExcludedCandidate(
                    accommodation_id=e.accommodation.id,
                    residence_name=e.accommodation.residence_name,
                    room_type=e.accommodation.room_type,
                    violations=e.violations,
                )
                for e in explain.excluded_sorted(result)
            ],
            relaxation_suggestions=explain.relaxation_suggestions(profile, result),
            eligibility=eligibility,
            next_actions=explain.next_actions(top, eligibility),
            sources=self.repo.source_statuses(),
            method=MethodNote(
                normalisation=NORMALISATION,
                evidence_weight_cap=EVIDENCE_WEIGHT_CAP,
                tie_threshold_points=TIE_THRESHOLD_POINTS,
                status_confidence=dict(STATUS_CONFIDENCE),
                assumptions=COST_ASSUMPTIONS,
            ),
        )

    def _ranked(
        self, rank: int, c: Candidate, result: EngineResult, profile: StudentProfile, n_rooms: int
    ) -> RankedCandidate:
        # Other transport modes for the same room that also met every hard constraint.
        alt = [
            TransportAlternative(
                mode=o.transport.mode,
                duration_min=o.transport.duration_min,
                monthly_cost_gbp=o.costs.monthly_total_gbp,
                score=round(o.score, 2),
            )
            for o in result.alternatives_by_room.get(c.accommodation.id, [])
        ]
        return RankedCandidate(
            rank=rank,
            candidate_id=c.candidate_id,
            accommodation=c.accommodation,
            transport=c.transport,
            costs=c.costs,
            score=round(c.score, 2),
            score_breakdown=c.breakdown,
            evidence_confidence=c.evidence,
            reasons=explain.reasons(c, profile, n_rooms),
            compromises=explain.compromises(c, profile),
            unknowns=explain.unknowns(c),
            comparison=explain.comparison(c, result),
            soft_limit_flags=c.soft_flags,
            transport_alternatives=alt,
        )

    def _id(self, request: RecommendationRequest) -> str:
        digest = hashlib.sha256()
        digest.update(request.model_dump_json().encode())
        digest.update(self.repo.dataset_version().encode())
        digest.update(__version__.encode())
        return "rec_" + digest.hexdigest()[:16]
