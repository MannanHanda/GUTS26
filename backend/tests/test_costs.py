"""Cost model: recurring vs upfront separation, no double counting, unknowns stay unknown."""

import pytest

from app.decision_engine.commute import subway_tickets
from app.decision_engine.costs import build_costs
from app.models.domain import DAYS_PER_MONTH, WEEKS_PER_MONTH, TransportOption


def _accom(repo, residence_id="cairncross-house", room="Single"):
    return next(a for a in repo.accommodations() if a.residence_id == residence_id and a.room_type == room)


def _walk(accom) -> TransportOption:
    return TransportOption(
        option_id="x",
        residence_id=accom.residence_id,
        campus_id="gilmorehill",
        mode="walk",
        available=True,
        duration_min=17,
        monthly_cost_gbp=0.0,
        monthly_cost_basis="definitional",
        upfront_cost_gbp=0.0,
        upfront_cost_basis="definitional",
    )


def test_monthly_rent_uses_weeks_per_month(repo):
    a = _accom(repo)
    assert a.monthly_rent_equivalent_gbp == pytest.approx(168.00 * WEEKS_PER_MONTH, abs=0.01)


def test_bills_included_are_not_added_again(repo):
    a = _accom(repo)
    assert a.bills_included
    costs = build_costs(a, _walk(a))
    bills = next(c for c in costs.components if c.component_id == "bills")
    assert bills.amount_gbp == 0.0 and bills.basis == "included"
    assert costs.monthly_total_gbp == pytest.approx(a.monthly_rent_equivalent_gbp, abs=0.01)


def test_advance_payment_is_upfront_not_monthly(repo):
    a = _accom(repo)
    costs = build_costs(a, _walk(a))
    assert costs.upfront_total_gbp == 200.0
    assert costs.monthly_total_gbp == pytest.approx(a.monthly_rent_equivalent_gbp, abs=0.01)


def test_refundability_is_unknown_not_assumed(repo):
    assert _accom(repo).advance_payment_refundable is None


def test_unknown_transport_cost_makes_total_none_not_zero(repo):
    a = _accom(repo)
    t = _walk(a).model_copy(update={"monthly_cost_gbp": None, "monthly_cost_basis": "unknown"})
    costs = build_costs(a, t)
    assert costs.monthly_total_gbp is None
    assert costs.monthly_complete is False
    assert costs.monthly_known_subtotal_gbp == pytest.approx(a.monthly_rent_equivalent_gbp, abs=0.01)


def test_subway_ticket_choice_is_cheapest_and_keeps_original_price(repo):
    best, alts = subway_tickets(repo.subway_fares(), campus_days_per_week=5)
    everything = [best, *alts]
    assert best.monthly_equivalent_gbp == min(t.monthly_equivalent_gbp for t in everything)
    season = next(t for t in everything if t.name.startswith("Adult 28-day season (bought online)"))
    assert season.price_gbp == 55.0
    assert season.monthly_equivalent_gbp == pytest.approx(55.0 * DAYS_PER_MONTH / 28, abs=0.01)


def test_payg_monthly_scales_with_campus_days(repo):
    fares = repo.subway_fares()
    payg5 = next(t for t in [*subway_tickets(fares, 5)[1], subway_tickets(fares, 5)[0]] if "pay-as-you-go" in t.name)
    payg1 = next(t for t in [*subway_tickets(fares, 1)[1], subway_tickets(fares, 1)[0]] if "pay-as-you-go" in t.name)
    assert payg5.monthly_equivalent_gbp == pytest.approx(payg1.monthly_equivalent_gbp * 5, abs=0.02)
