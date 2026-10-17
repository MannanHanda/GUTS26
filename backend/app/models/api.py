"""Request and response contracts for the public API (the source of truth for frontend types)."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import Field, field_validator, model_validator

from app.models.domain import (
    AccommodationOption,
    ConcessionScheme,
    CostBasis,
    DataStatus,
    Model,
    SourceStatus,
    TransportMode,
    TransportOption,
)

FactorId = Literal["monthly_cost", "commute_time", "upfront_cost", "evidence_confidence"]
RankingConfidence = Literal["clear", "close", "single_option", "none"]


# ----------------------------------------------------------------------------- errors
class ErrorDetail(Model):
    field: str | None = None
    message: str


class ErrorBody(Model):
    code: Literal["validation_error", "not_found", "method_not_allowed", "provider_unavailable", "internal_error"]
    message: str
    details: list[ErrorDetail] = Field(default_factory=list)


class ErrorResponse(Model):
    error: ErrorBody


# ----------------------------------------------------------------------------- request
class Constraints(Model):
    max_monthly_budget_gbp: float | None = Field(
        default=None, gt=0, le=10000, description="Maximum monthly rent + bills + commute, in GBP."
    )
    budget_is_hard: bool = Field(default=True, description="If true, options over budget are excluded.")
    max_upfront_gbp: float | None = Field(default=None, ge=0, le=20000, description="Always a hard limit when set.")
    max_commute_min: int | None = Field(default=None, ge=1, le=180, description="One-way commute limit in minutes.")
    commute_is_hard: bool = Field(default=False, description="If true, options over the commute limit are excluded.")
    require_ensuite: bool = False
    require_accessible: bool = False
    require_studio: bool = False
    exclude_shared_rooms: bool = False


class Priorities(Model):
    """Relative importance, 0-10. A zero weight removes the factor entirely."""

    monthly_cost: int = Field(default=5, ge=0, le=10)
    commute_time: int = Field(default=3, ge=0, le=10)
    upfront_cost: int = Field(default=1, ge=0, le=10)
    evidence_confidence: int = Field(default=1, ge=0, le=10)

    @model_validator(mode="after")
    def _at_least_one(self) -> Priorities:
        if self.monthly_cost + self.commute_time + self.upfront_cost + self.evidence_confidence == 0:
            raise ValueError("At least one priority must be greater than zero.")
        return self


class StudentProfile(Model):
    """The Glasgow Student Twin: the structured circumstances the engine personalises against."""

    student_category: Literal["scottish", "rest_of_uk", "international"] | None = None
    campus_id: str = Field(default="gilmorehill", min_length=1, max_length=64)
    move_in_date: date | None = None
    age_band: Literal["under_22", "22_or_over"] | None = None
    campus_days_per_week: int = Field(default=5, ge=1, le=7)
    allowed_modes: list[TransportMode] = Field(default=["walk", "cycle", "subway"], min_length=1)
    constraints: Constraints = Constraints()
    priorities: Priorities = Priorities()

    @field_validator("allowed_modes")
    @classmethod
    def _unique_modes(cls, v: list[TransportMode]) -> list[TransportMode]:
        if len(set(v)) != len(v):
            raise ValueError("allowed_modes must not contain duplicates")
        return v


class RecommendationRequest(Model):
    profile: StudentProfile
    limit: int = Field(default=10, ge=1, le=50, description="Maximum number of ranked options returned.")


# ----------------------------------------------------------------------------- response
class CostComponent(Model):
    component_id: str
    label: str
    category: Literal["recurring_monthly", "upfront"]
    amount_gbp: float | None = Field(description="null = unknown. Zero means genuinely zero or included elsewhere.")
    basis: CostBasis
    refundable: bool | None = None
    original_price: str | None = None
    notes: str | None = None


class CostBreakdown(Model):
    components: list[CostComponent]
    monthly_total_gbp: float | None = Field(description="null when any recurring component is unknown.")
    monthly_known_subtotal_gbp: float
    monthly_complete: bool
    upfront_total_gbp: float | None
    upfront_known_subtotal_gbp: float
    upfront_complete: bool
    contract_total_gbp: float
    assumptions: list[str]


class FactorScore(Model):
    factor: FactorId
    label: str
    raw_value: float | None
    unit: str
    normalised: float | None = Field(description="0-1, higher is better. null when the value is missing.")
    weight: float = Field(description="Effective weight after normalisation (sums to 1).")
    points: float = Field(description="weight x normalised x 100.")
    missing: bool
    explanation: str


class ConstraintViolation(Model):
    code: Literal[
        "over_budget",
        "budget_unverifiable",
        "over_upfront_limit",
        "upfront_unverifiable",
        "over_commute_limit",
        "commute_unverifiable",
        "not_ensuite",
        "ensuite_unverified",
        "not_accessible",
        "accessibility_unverified",
        "not_studio",
        "studio_unverified",
        "shared_room",
        "no_allowed_transport",
    ]
    message: str


class TransportAlternative(Model):
    mode: TransportMode
    duration_min: float | None
    monthly_cost_gbp: float | None
    score: float


class RankedCandidate(Model):
    rank: int
    candidate_id: str
    accommodation: AccommodationOption
    transport: TransportOption
    costs: CostBreakdown
    score: float = Field(description="0-100 overall fit relative to the other feasible options.")
    score_breakdown: list[FactorScore]
    evidence_confidence: float = Field(ge=0, le=1)
    reasons: list[str]
    compromises: list[str]
    unknowns: list[str]
    comparison: str | None
    soft_limit_flags: list[str]
    transport_alternatives: list[TransportAlternative]


class ExcludedCandidate(Model):
    accommodation_id: str
    residence_name: str
    room_type: str
    violations: list[ConstraintViolation]


class PriorityAlternative(Model):
    label: str
    candidate_id: str
    rank: int
    reason: str


class EligibilityNote(Model):
    scheme_id: str
    name: str
    status: Literal["potentially_eligible", "unknown", "not_eligible"]
    reason: str
    affects_cost_calculation: bool = False
    restrictions: list[str]
    source_url: str
    last_verified_at: datetime | None


class NextAction(Model):
    title: str
    detail: str
    url: str | None = None


class ProfileSummary(Model):
    campus_id: str
    campus_name: str
    budget: str
    commute: str
    allowed_modes: list[TransportMode]
    requirements: list[str]
    effective_weights: dict[FactorId, float]
    uncertainties: list[str]


class MethodNote(Model):
    normalisation: str
    evidence_weight_cap: float
    tie_threshold_points: float
    status_confidence: dict[str, float]
    assumptions: list[str]


class RecommendationResponse(Model):
    recommendation_id: str = Field(description="Deterministic hash of the request and dataset versions.")
    generated_at: datetime
    profile_summary: ProfileSummary
    feasibility: Literal["feasible", "no_feasible_options"]
    ranking_confidence: RankingConfidence
    summary: str
    recommended_candidate_id: str | None
    ranked: list[RankedCandidate]
    total_candidates_evaluated: int = Field(description="Room-and-transport combinations evaluated.")
    total_feasible: int = Field(description="Room-and-transport combinations that met every hard constraint.")
    alternatives: list[PriorityAlternative]
    excluded: list[ExcludedCandidate]
    relaxation_suggestions: list[str]
    eligibility: list[EligibilityNote]
    next_actions: list[NextAction]
    sources: list[SourceStatus]
    method: MethodNote


# ----------------------------------------------------------------------------- other endpoints
class HealthResponse(Model):
    status: Literal["ok", "degraded"]
    version: str
    datasets: dict[str, DataStatus]


class AccommodationList(Model):
    items: list[AccommodationOption]
    total: int
    sources: list[SourceStatus]


class BenefitList(Model):
    items: list[ConcessionScheme]
    total: int
    note: str = Field(description="How to read the list: schemes are potential benefits, not confirmed entitlements.")
    sources: list[SourceStatus]


class ResearchTable(Model):
    name: str = Field(description="Sheet name, or the file name for CSV files.")
    columns: list[str]
    rows: list[dict[str, str | None]]


ResearchStatus = Literal["unverified", "unavailable"]


class ResearchDataset(Model):
    id: str
    title: str
    status: ResearchStatus = Field(description="'unverified': raw research data with no verified provenance.")
    source_file: str
    notes: str
    error: str | None = None
    tables: list[ResearchTable] = Field(default_factory=list)


class ResearchDatasetList(Model):
    items: list[ResearchDataset]
    total: int
    note: str


class TransportOptionList(Model):
    accommodation_id: str
    campus_id: str
    campus_days_per_week: int
    items: list[TransportOption]
    generated_at: datetime
