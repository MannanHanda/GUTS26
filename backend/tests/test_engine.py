"""Decision-engine behaviour on the real curated data (deterministic, no network)."""

from app.decision_engine.commute import build_transport_options
from app.decision_engine.engine import run
from app.models.api import Constraints, Priorities, StudentProfile


def _transport_map(repo, modes):
    campus = repo.campus("gilmorehill")
    out = {}
    for a in repo.accommodations():
        if a.residence_id not in out:
            out[a.residence_id] = build_transport_options(
                repo, a.residence_id, a.residence_name, campus.campus_id, campus.name, 5, list(modes)
            )
    return out


def _run(repo, **kwargs):
    profile = StudentProfile(**kwargs)
    return run(profile, repo.accommodations(), _transport_map(repo, profile.allowed_modes))


def test_no_feasible_options_when_budget_is_impossible(repo):
    res = _run(repo, constraints=Constraints(max_monthly_budget_gbp=100, budget_is_hard=True))
    assert res.ranked == []
    assert res.ranking_confidence == "none"
    assert len(res.excluded) == len(repo.accommodations())


def test_hard_constraints_are_never_relaxed_into_a_recommendation(repo):
    res = _run(repo, constraints=Constraints(max_monthly_budget_gbp=600, budget_is_hard=True))
    assert res.ranked, "the budget admits at least one option"
    assert all(c.costs.monthly_total_gbp <= 600 for c in res.ranked)


def test_ranking_is_deterministic(repo):
    a = _run(repo, priorities=Priorities())
    b = _run(repo, priorities=Priorities())
    assert [c.candidate_id for c in a.ranked] == [c.candidate_id for c in b.ranked]
    assert [round(c.score, 6) for c in a.ranked] == [round(c.score, 6) for c in b.ranked]


def test_changing_priorities_changes_the_recommendation(repo):
    cost_led = _run(repo, priorities=Priorities(monthly_cost=10, commute_time=0, upfront_cost=0, evidence_confidence=0))
    commute_led = _run(
        repo, priorities=Priorities(monthly_cost=0, commute_time=10, upfront_cost=0, evidence_confidence=0)
    )
    assert cost_led.ranked[0].candidate_id != commute_led.ranked[0].candidate_id
    assert cost_led.ranked[0].costs.monthly_total_gbp <= commute_led.ranked[0].costs.monthly_total_gbp


def test_every_ranked_option_has_a_four_factor_breakdown(repo):
    res = _run(repo, constraints=Constraints(max_monthly_budget_gbp=800))
    assert res.ranked
    for c in res.ranked:
        assert len(c.breakdown) == 4


def test_transport_mode_restriction_is_respected(repo):
    res = _run(repo, allowed_modes=["walk"])
    assert res.ranked and all(c.transport.mode == "walk" for c in res.ranked)
