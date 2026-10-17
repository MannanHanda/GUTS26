"""Decision engine orchestration: constraints -> costs -> scoring -> ranking.

Pure function of its inputs: identical inputs always give identical outputs.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from app.decision_engine.constraints import (
    combination_violations,
    room_violations,
    soft_limit_flags,
)
from app.decision_engine.costs import build_costs
from app.decision_engine.scoring import (
    TIE_THRESHOLD_POINTS,
    Candidate,
    effective_weights,
    evidence_confidence,
    score_candidates,
)
from app.models.api import ConstraintViolation, FactorId, RankingConfidence, StudentProfile
from app.models.domain import AccommodationOption, TransportOption


@dataclass
class Exclusion:
    accommodation: AccommodationOption
    violations: list[ConstraintViolation]


@dataclass
class EngineResult:
    ranked: list[Candidate]  # best candidate per room, in rank order
    alternatives_by_room: dict[str, list[Candidate]]  # other feasible modes for each room
    excluded: list[Exclusion]
    all_combinations: list[Candidate] = field(default_factory=list)  # every combo, feasible or not (for suggestions)
    weights: dict[FactorId, float] = field(default_factory=dict)
    total_evaluated: int = 0

    @property
    def ranking_confidence(self) -> RankingConfidence:
        if not self.ranked:
            return "none"
        rival = next(
            (c for c in self.ranked[1:] if c.accommodation.residence_id != self.ranked[0].accommodation.residence_id),
            None,
        )
        if rival is None:
            return "single_option"
        return "close" if self.ranked[0].score - rival.score < TIE_THRESHOLD_POINTS else "clear"


def run(
    profile: StudentProfile,
    accommodations: list[AccommodationOption],
    transport_by_residence: dict[str, list[TransportOption]],
) -> EngineResult:
    c = profile.constraints
    allowed = set(profile.allowed_modes)
    feasible: list[Candidate] = []
    every: list[Candidate] = []
    excluded: list[Exclusion] = []
    evaluated = 0

    for accom in sorted(accommodations, key=lambda a: a.id):
        room_v = room_violations(c, accom)
        options = [t for t in transport_by_residence.get(accom.residence_id, []) if t.available and t.mode in allowed]
        if not options:
            room_v = [
                *room_v,
                ConstraintViolation(
                    code="no_allowed_transport",
                    message="No route is available for any of your allowed transport modes.",
                ),
            ]
            excluded.append(Exclusion(accom, room_v))
            evaluated += 1
            continue
        room_feasible = False
        violations: list[ConstraintViolation] = []
        for t in sorted(options, key=lambda o: o.mode):
            evaluated += 1
            costs = build_costs(accom, t)
            cand = Candidate(accom, t, costs, evidence_confidence(accom, t), soft_limit_flags(c, t, costs))
            every.append(cand)
            v = room_v + combination_violations(c, t, costs)
            if v:
                seen_codes = {x.code for x in violations}
                violations.extend(x for x in v if x.code not in seen_codes)
            else:
                feasible.append(cand)
                room_feasible = True
        if not room_feasible:
            excluded.append(Exclusion(accom, violations))

    weights = score_candidates(feasible, profile.priorities) if feasible else effective_weights(profile.priorities)
    feasible.sort(key=Candidate.sort_key)

    ranked: list[Candidate] = []
    alternatives: dict[str, list[Candidate]] = {}
    seen: set[str] = set()
    for cand in feasible:
        if cand.accommodation.id in seen:
            alternatives.setdefault(cand.accommodation.id, []).append(cand)
        else:
            seen.add(cand.accommodation.id)
            ranked.append(cand)

    return EngineResult(ranked, alternatives, excluded, every, weights, evaluated)
