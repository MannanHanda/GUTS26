"""Hard constraints: applied before scoring, never silently relaxed, unknowns never pass."""

from app.decision_engine.constraints import combination_violations, room_violations
from app.decision_engine.costs import build_costs
from app.models.api import Constraints
from app.models.domain import TransportOption


def _walk(accom, minutes=17.0):
    return TransportOption(
        option_id="x",
        residence_id=accom.residence_id,
        campus_id="gilmorehill",
        mode="walk",
        available=True,
        duration_min=minutes,
        monthly_cost_gbp=0.0,
        monthly_cost_basis="definitional",
        upfront_cost_gbp=0.0,
        upfront_cost_basis="definitional",
    )


def _room(repo, residence_id, room_type):
    return next(a for a in repo.accommodations() if a.residence_id == residence_id and a.room_type == room_type)


def test_over_budget_is_excluded_when_hard(repo):
    a = _room(repo, "cairncross-house", "Single")  # about GBP 728 per month
    t = _walk(a)
    v = combination_violations(Constraints(max_monthly_budget_gbp=600, budget_is_hard=True), t, build_costs(a, t))
    assert [x.code for x in v] == ["over_budget"]


def test_over_budget_is_not_a_violation_when_soft(repo):
    a = _room(repo, "cairncross-house", "Single")
    t = _walk(a)
    assert (
        combination_violations(Constraints(max_monthly_budget_gbp=600, budget_is_hard=False), t, build_costs(a, t))
        == []
    )


def test_unknown_monthly_cost_cannot_satisfy_hard_budget(repo):
    a = _room(repo, "cairncross-house", "Shared")
    t = _walk(a).model_copy(update={"monthly_cost_gbp": None, "monthly_cost_basis": "unknown"})
    v = combination_violations(Constraints(max_monthly_budget_gbp=2000), t, build_costs(a, t))
    assert [x.code for x in v] == ["budget_unverifiable"]


def test_required_ensuite_unknown_is_excluded(repo):
    a = _room(repo, "cairncross-house", "Single")  # the source does not state ensuite for this room
    assert a.ensuite is None
    assert [x.code for x in room_violations(Constraints(require_ensuite=True), a)] == ["ensuite_unverified"]


def test_required_ensuite_known_true_passes(repo):
    a = _room(repo, "maclay-residences", "Standard Ensuite")
    assert a.ensuite is True
    assert room_violations(Constraints(require_ensuite=True), a) == []


def test_required_accessible_fails_for_non_accessible_room(repo):
    a = _room(repo, "maclay-residences", "Standard Ensuite")
    v = room_violations(Constraints(require_accessible=True), a)
    assert v and v[0].code in {"not_accessible", "accessibility_unverified"}


def test_shared_room_exclusion(repo):
    a = _room(repo, "cairncross-house", "Shared")
    assert [x.code for x in room_violations(Constraints(exclude_shared_rooms=True), a)] == ["shared_room"]


def test_upfront_limit_is_hard(repo):
    a = _room(repo, "cairncross-house", "Single")
    t = _walk(a)
    assert [x.code for x in combination_violations(Constraints(max_upfront_gbp=100), t, build_costs(a, t))] == [
        "over_upfront_limit"
    ]


def test_commute_limit_hard_vs_soft(repo):
    a = _room(repo, "cairncross-house", "Shared")
    t = _walk(a, minutes=45)
    hard = combination_violations(Constraints(max_commute_min=30, commute_is_hard=True), t, build_costs(a, t))
    soft = combination_violations(Constraints(max_commute_min=30, commute_is_hard=False), t, build_costs(a, t))
    assert [x.code for x in hard] == ["over_commute_limit"]
    assert soft == []
