"""Deterministic overall-fit scoring.

score = 100 x sum_f( w_f x s_f )

* w_f  effective weight: the student's 0-10 priority divided by the sum of priorities.
       The evidence-confidence weight is capped at EVIDENCE_WEIGHT_CAP (excess redistributed
       proportionally to the other factors) so data quality can never outweigh requirements.
* s_f  normalised factor score in [0, 1], higher is better:
       - monthly cost, commute time, upfront cost: min-max over the FEASIBLE candidates,
         lower raw value = better. If every feasible candidate has the same value, all get 1.0
         (the factor then cannot change the order). A missing value gets 0.0 - missing data is
         never rewarded.
       - evidence confidence: absolute 0-1 value (mean of per-field status confidence).
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.models.api import CostBreakdown, FactorId, FactorScore, Priorities
from app.models.domain import (
    AccommodationOption,
    CostBasis,
    DataStatus,
    TransportOption,
)

EVIDENCE_WEIGHT_CAP = 0.2
TIE_THRESHOLD_POINTS = 1.0

STATUS_CONFIDENCE: dict[DataStatus, float] = {
    "live": 1.0,
    "curated": 1.0,
    "cached": 1.0,
    "estimated": 0.6,
    "stale": 0.5,
    "synthetic": 0.2,
    "unavailable": 0.0,
}
BASIS_CONFIDENCE: dict[CostBasis, float] = {
    "sourced": 1.0,
    "included": 1.0,
    "definitional": 1.0,
    "assumed": 0.7,
    "estimated": 0.6,
    "unknown": 0.0,
}

FACTOR_META: dict[FactorId, tuple[str, str]] = {
    "monthly_cost": ("Monthly cost", "GBP/month"),
    "commute_time": ("Commute time", "minutes"),
    "upfront_cost": ("Upfront cost", "GBP"),
    "evidence_confidence": ("Evidence confidence", "0-1"),
}


@dataclass
class Candidate:
    accommodation: AccommodationOption
    transport: TransportOption
    costs: CostBreakdown
    evidence: float
    soft_flags: list[str] = field(default_factory=list)
    score: float = 0.0
    breakdown: list[FactorScore] = field(default_factory=list)

    @property
    def candidate_id(self) -> str:
        return f"{self.accommodation.id}::{self.transport.mode}"

    def raw(self, factor: FactorId) -> float | None:
        return {
            "monthly_cost": self.costs.monthly_total_gbp,
            "commute_time": self.transport.duration_min,
            "upfront_cost": self.costs.upfront_total_gbp,
            "evidence_confidence": self.evidence,
        }[factor]

    def sort_key(self) -> tuple:
        inf = float("inf")
        return (
            -round(self.score, 6),
            self.costs.monthly_total_gbp if self.costs.monthly_total_gbp is not None else inf,
            self.transport.duration_min if self.transport.duration_min is not None else inf,
            self.candidate_id,
        )


def effective_weights(p: Priorities) -> dict[FactorId, float]:
    raw: dict[FactorId, float] = {
        "monthly_cost": p.monthly_cost,
        "commute_time": p.commute_time,
        "upfront_cost": p.upfront_cost,
        "evidence_confidence": p.evidence_confidence,
    }
    total = sum(raw.values())
    w = {k: v / total for k, v in raw.items()}
    others = 1 - w["evidence_confidence"]
    if w["evidence_confidence"] > EVIDENCE_WEIGHT_CAP and others > 0:
        scale = (1 - EVIDENCE_WEIGHT_CAP) / others
        w = {k: (EVIDENCE_WEIGHT_CAP if k == "evidence_confidence" else v * scale) for k, v in w.items()}
    return w


def evidence_confidence(accom: AccommodationOption, transport: TransportOption) -> float:
    """Mean confidence over the fields that drive the decision (availability is excluded: unknown for all)."""
    accom_conf = STATUS_CONFIDENCE[accom.provenance.status]
    transport_cost_conf = BASIS_CONFIDENCE[transport.monthly_cost_basis]
    if transport.monthly_cost_basis == "sourced" and any(p.status == "stale" for p in transport.provenance):
        transport_cost_conf = STATUS_CONFIDENCE["stale"]
    fields = [
        accom_conf,  # rent
        accom_conf if accom.bills_included else 0.0,  # bills
        accom_conf if accom.advance_payment_gbp is not None else 0.0,  # upfront payment
        STATUS_CONFIDENCE[transport.duration_status] if transport.duration_status else 0.0,
        transport_cost_conf,
    ]
    return round(sum(fields) / len(fields), 3)


def _minmax_lower_better(values: list[float | None]) -> tuple[list[float | None], float | None, float | None]:
    known = [v for v in values if v is not None]
    if not known:
        return [None] * len(values), None, None
    lo, hi = min(known), max(known)
    if hi - lo < 1e-9:
        return [None if v is None else 1.0 for v in values], lo, hi
    return [None if v is None else (hi - v) / (hi - lo) for v in values], lo, hi


def _fmt(factor: FactorId, v: float) -> str:
    if factor in ("monthly_cost", "upfront_cost"):
        return f"£{v:,.2f}"
    if factor == "commute_time":
        return f"{v:.0f} min"
    return f"{v:.2f}"


def score_candidates(candidates: list[Candidate], priorities: Priorities) -> dict[FactorId, float]:
    """Score candidates in place and return the effective weights used."""
    weights = effective_weights(priorities)
    factors: list[FactorId] = ["monthly_cost", "commute_time", "upfront_cost", "evidence_confidence"]
    normalised: dict[FactorId, list[float | None]] = {}
    ranges: dict[FactorId, tuple[float | None, float | None]] = {}
    for f in factors:
        values = [c.raw(f) for c in candidates]
        if f == "evidence_confidence":
            normalised[f], ranges[f] = values, (None, None)
        else:
            norm, lo, hi = _minmax_lower_better(values)
            normalised[f], ranges[f] = norm, (lo, hi)

    for idx, c in enumerate(candidates):
        breakdown: list[FactorScore] = []
        total = 0.0
        for f in factors:
            label, unit = FACTOR_META[f]
            raw, s = c.raw(f), normalised[f][idx]
            missing = s is None
            s_val = 0.0 if missing else s
            pts = weights[f] * s_val * 100
            total += pts
            lo, hi = ranges[f]
            if weights[f] == 0:
                expl = "Weight is zero, so this factor has no influence."
            elif missing:
                expl = "Value unknown - scored 0 so that missing data is never rewarded."
            elif f == "evidence_confidence":
                expl = (
                    f"Mean confidence of the key data fields is {raw:.2f} (1 = sourced, 0.6 = estimated, 0 = unknown)."
                )
            elif lo is not None and hi is not None and hi - lo < 1e-9:
                expl = (
                    f"All feasible options have the same value ({_fmt(f, lo)}), so this factor does not separate them."
                )
            else:
                expl = f"{_fmt(f, raw)}; feasible options range from {_fmt(f, lo)} (best) to {_fmt(f, hi)}."
            breakdown.append(
                FactorScore(
                    factor=f,
                    label=label,
                    raw_value=None if raw is None else round(raw, 3),
                    unit=unit,
                    normalised=None if missing else round(s_val, 4),
                    weight=round(weights[f], 4),
                    points=round(pts, 2),
                    missing=missing,
                    explanation=expl,
                )
            )
        c.score = round(total, 4)
        c.breakdown = breakdown
    return weights
