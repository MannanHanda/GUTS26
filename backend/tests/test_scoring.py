"""Unit tests for weights, normalisation and the score breakdown."""

from types import SimpleNamespace

import pytest

from app.decision_engine.scoring import (
    EVIDENCE_WEIGHT_CAP,
    effective_weights,
    score_candidates,
)
from app.models.api import Priorities


def test_weights_sum_to_one():
    assert sum(effective_weights(Priorities()).values()) == pytest.approx(1.0)


def test_zero_priority_removes_factor_influence():
    w = effective_weights(Priorities(monthly_cost=0, commute_time=5, upfront_cost=0, evidence_confidence=0))
    assert w == {"monthly_cost": 0.0, "commute_time": 1.0, "upfront_cost": 0.0, "evidence_confidence": 0.0}


def test_evidence_weight_is_capped_and_others_rescaled():
    w = effective_weights(Priorities(monthly_cost=5, commute_time=5, upfront_cost=0, evidence_confidence=10))
    assert w["evidence_confidence"] == pytest.approx(EVIDENCE_WEIGHT_CAP)
    assert sum(w.values()) == pytest.approx(1.0)


def test_all_zero_priorities_rejected():
    with pytest.raises(ValueError):
        Priorities(monthly_cost=0, commute_time=0, upfront_cost=0, evidence_confidence=0)


class _Fake:
    """Stand-in exposing the attributes score_candidates reads."""

    def __init__(self, monthly, commute, upfront, evidence, cid):
        self.costs = SimpleNamespace(monthly_total_gbp=monthly, upfront_total_gbp=upfront)
        self.transport = SimpleNamespace(duration_min=commute)
        self.evidence = evidence
        self.candidate_id = cid
        self.breakdown = []
        self.score = 0.0

    def raw(self, factor):
        return {
            "monthly_cost": self.costs.monthly_total_gbp,
            "commute_time": self.transport.duration_min,
            "upfront_cost": self.costs.upfront_total_gbp,
            "evidence_confidence": self.evidence,
        }[factor]


def test_cheaper_candidate_scores_higher_on_cost():
    a, b = _Fake(500, 20, 0, 1, "a"), _Fake(600, 20, 0, 1, "b")
    score_candidates([a, b], Priorities(monthly_cost=5, commute_time=0, upfront_cost=0, evidence_confidence=0))
    assert a.score == pytest.approx(100.0)
    assert b.score == pytest.approx(0.0)


def test_identical_values_do_not_separate_candidates():
    a, b = _Fake(500, 20, 100, 1, "a"), _Fake(500, 20, 100, 1, "b")
    score_candidates([a, b], Priorities())
    assert a.score == pytest.approx(b.score)
    assert all(f.normalised == 1.0 for f in a.breakdown if not f.missing)


def test_missing_value_is_scored_zero_not_rewarded():
    known, unknown = _Fake(500, 20, 0, 1, "known"), _Fake(None, 20, 0, 1, "unknown")
    score_candidates(
        [known, unknown], Priorities(monthly_cost=10, commute_time=0, upfront_cost=0, evidence_confidence=0)
    )
    missing = next(f for f in unknown.breakdown if f.factor == "monthly_cost")
    assert missing.missing and missing.normalised is None and missing.points == 0
    assert unknown.score == pytest.approx(0.0)
    assert known.score == pytest.approx(100.0)


def test_scoring_is_deterministic():
    def run():
        cs = [_Fake(500, 20, 0, 1, "a"), _Fake(550, 10, 50, 0.6, "b"), _Fake(600, 5, 0, 1, "c")]
        score_candidates(cs, Priorities())
        return [round(c.score, 6) for c in cs]

    assert run() == run()
