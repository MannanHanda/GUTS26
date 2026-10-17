"""Structured, data-derived explanations. Every sentence is built from record fields,
score contributions, constraint results or uncertainty states - never free text."""

from __future__ import annotations

from collections import Counter

from app.decision_engine.engine import EngineResult, Exclusion
from app.decision_engine.scoring import Candidate
from app.models.api import EligibilityNote, NextAction, StudentProfile
from app.models.domain import ConcessionScheme

MODE_NOUN = {"walk": "walking", "cycle": "cycling", "subway": "Subway"}


def reasons(c: Candidate, profile: StudentProfile, n_rooms: int) -> list[str]:
    out: list[str] = []
    cons = profile.constraints
    m, d = c.costs.monthly_total_gbp, c.transport.duration_min
    if cons.max_monthly_budget_gbp is not None and m is not None and m <= cons.max_monthly_budget_gbp:
        out.append(
            f"Estimated monthly cost of £{m:.2f} is £{cons.max_monthly_budget_gbp - m:.2f} within your "
            f"£{cons.max_monthly_budget_gbp:.0f} budget."
        )
    if cons.max_commute_min is not None and d is not None and d <= cons.max_commute_min:
        out.append(
            f"{MODE_NOUN[c.transport.mode].capitalize()} commute of about {d:.0f} min is within your "
            f"{cons.max_commute_min}-minute limit."
        )
    for f in sorted(c.breakdown, key=lambda f: -f.points):
        if f.weight == 0 or f.missing or f.normalised is None or f.normalised < 0.75 or n_rooms < 2:
            continue
        if f.factor == "monthly_cost":
            out.append(
                f"One of the lowest monthly costs among the {n_rooms} room options that meet your constraints "
                f"(£{f.raw_value:.2f})."
            )
        elif f.factor == "commute_time":
            out.append(
                f"One of the shortest commutes among the feasible options ({f.raw_value:.0f} min by "
                f"{MODE_NOUN[c.transport.mode]})."
            )
        elif f.factor == "upfront_cost" and f.normalised < 1.0:
            out.append(f"Low upfront cash requirement (£{f.raw_value:.2f}).")
    if c.accommodation.bills_included:
        out.append("Heating, utilities and Wi-Fi are included in the rent, so there are no separate bills to add.")
    return out


def compromises(c: Candidate, profile: StudentProfile) -> list[str]:
    out: list[str] = list(c.soft_flags)
    for f in c.breakdown:
        if f.weight == 0 or f.missing or f.normalised is None or f.normalised >= 0.5:
            continue
        if f.factor == "monthly_cost":
            out.append(f"Monthly cost (£{f.raw_value:.2f}) is in the more expensive half of the feasible options.")
        elif f.factor == "commute_time":
            out.append(f"Commute ({f.raw_value:.0f} min) is in the longer half of the feasible options.")
        elif f.factor == "upfront_cost":
            out.append(f"Upfront cost (£{f.raw_value:.2f}) is higher than most feasible options.")
    a = c.accommodation
    if a.shared_room:
        out.append("This is a shared (twin) room.")
    if a.contract_weeks > 45:
        out.append(f"{a.contract_weeks}-week contract (to {a.contract_end:%d %b %Y}) - you pay through the summer.")
    if profile.move_in_date and profile.move_in_date != a.contract_start:
        out.append(
            f"The contract starts on {a.contract_start:%d %b %Y}; your intended move-in date is "
            f"{profile.move_in_date:%d %b %Y}."
        )
    return out


def unknowns(c: Candidate) -> list[str]:
    a, t = c.accommodation, c.transport
    out = ["Room availability is not published by the source; it has not been verified."]
    if a.advance_payment_gbp is not None and a.advance_payment_refundable is None:
        out.append(f"Whether the £{a.advance_payment_gbp:.0f} advance payment is refundable is not stated.")
    if a.ensuite is None:
        out.append("The source does not state whether this room is ensuite.")
    if not c.costs.monthly_complete:
        out.append("At least one monthly cost component is unknown, so the monthly total is incomplete.")
    if t.duration_status == "estimated":
        out.append("Subway in-train time and waiting time are estimates, not timetable data.")
    stale = {p.source_name for p in [a.provenance, *t.provenance] if p.status == "stale"}
    for name in sorted(stale):
        out.append(f"{name}: data is older than its freshness window and may be out of date.")
    return out


def comparison(c: Candidate, result: EngineResult) -> str | None:
    ranked = result.ranked
    if not ranked:
        return None
    top = ranked[0]
    if c is top:
        rival = next((x for x in ranked[1:] if x.accommodation.residence_id != top.accommodation.residence_id), None)
        if rival is None:
            return None
        winner, loser, prefix = (
            top,
            rival,
            f"Ranks above {rival.accommodation.residence_name} ({rival.accommodation.room_type})",
        )
    else:
        if c.accommodation.residence_id == top.accommodation.residence_id and abs(c.score - top.score) < 1e-6:
            return (
                f"Scores the same as the top option: same residence and identical modelled costs and commute; "
                f"only the room type differs ({c.accommodation.room_type})."
            )
        winner, loser, prefix = (
            top,
            c,
            f"Ranks below {top.accommodation.residence_name} ({top.accommodation.room_type})",
        )
    diffs = sorted(
        ((w.points - lo.points, w, lo) for w, lo in zip(winner.breakdown, loser.breakdown, strict=True)),
        key=lambda x: -x[0],
    )
    gap, wf, lf = diffs[0]
    total_gap = winner.score - loser.score
    if gap <= 0.005:
        return (
            f"{prefix}: the two options are tied on every weighted factor; the order uses the deterministic tie-break."
        )
    if c is top:
        return (
            f"{prefix} mainly on {wf.label.lower()}: {_val(wf)} here vs {_val(lf)} "
            f"({gap:.1f} of the {total_gap:.1f}-point gap)."
        )
    return (
        f"{prefix} mainly on {wf.label.lower()}: {_val(lf)} here vs {_val(wf)} for the top option "
        f"({gap:.1f} of the {total_gap:.1f}-point gap)."
    )


def _val(f) -> str:
    if f.raw_value is None:
        return "unknown"
    if "GBP" in f.unit:
        return f"£{f.raw_value:.2f}"
    return f"{f.raw_value:.0f} min" if f.unit == "minutes" else f"{f.raw_value:.2f}"


def eligibility_notes(profile: StudentProfile, schemes: list[ConcessionScheme]) -> list[EligibilityNote]:
    notes: list[EligibilityNote] = []
    for s in schemes:
        if s.scheme_id != "under22-free-bus":
            continue
        if profile.age_band == "22_or_over":
            status, reason = "not_eligible", "The scheme is for people aged 5 to 21."
        elif profile.age_band == "under_22":
            status = "potentially_eligible"
            reason = (
                "You indicated you are under 22. The scheme also requires living in Scotland; the official page "
                "does not explain how students from elsewhere living in Scotland during term are treated, so "
                "eligibility is not confirmed."
            )
        else:
            status, reason = "unknown", "Age band not provided. The scheme is for under-22s living in Scotland."
        notes.append(
            EligibilityNote(
                scheme_id=s.scheme_id,
                name=s.name,
                status=status,
                reason=reason + " Bus journeys are not modelled in this comparison, so it does not change any cost.",
                affects_cost_calculation=False,
                restrictions=s.restrictions,
                source_url=s.provenance.source_url,
                last_verified_at=s.provenance.last_verified_at,
            )
        )
    return notes


def next_actions(top: Candidate | None, eligibility: list[EligibilityNote]) -> list[NextAction]:
    acts: list[NextAction] = []
    if top:
        a, t = top.accommodation, top.transport
        acts.append(
            NextAction(
                title=f"Check availability for {a.residence_name} - {a.room_type}",
                detail="Availability is not published. Contact UofG Accommodation Services or apply to confirm a room.",
                url=a.profile_url,
            )
        )
        if a.advance_payment_gbp:
            acts.append(
                NextAction(
                    title=f"Set aside the £{a.advance_payment_gbp:.0f} advance payment",
                    detail="Needed to confirm a booking. Ask whether it is refundable before paying.",
                    url="https://www.gla.ac.uk/undergraduate/accommodation/fees/",
                )
            )
        if t.mode == "subway" and t.ticket:
            acts.append(
                NextAction(
                    title="Get a personalised Subway Smartcard",
                    detail=f"£{t.upfront_cost_gbp:.0f} one-off. Cheapest ticket for your "
                    f"pattern: {t.ticket.name} (£{t.ticket.price_gbp:.2f} per {t.ticket.validity}).",
                    url="https://www.spt.co.uk/tickets/subway-tickets/",
                )
            )
        if t.mode == "cycle":
            acts.append(
                NextAction(
                    title="Confirm bike storage at the residence",
                    detail="Bike storage is not recorded in our data; ask the residence before relying on cycling.",
                    url=a.profile_url,
                )
            )
        acts.append(
            NextAction(
                title="Re-check fees before committing",
                detail="The fees page states rates are subject to revision without notice.",
                url="https://www.gla.ac.uk/undergraduate/accommodation/fees/",
            )
        )
    for e in eligibility:
        if e.status in ("potentially_eligible", "unknown"):
            acts.append(NextAction(title=f"Check eligibility: {e.name}", detail=e.reason, url=e.source_url))
    return acts


def relaxation_suggestions(profile: StudentProfile, result: EngineResult) -> list[str]:
    if result.ranked:
        return []
    cons = profile.constraints
    codes = Counter(v.code for e in result.excluded for v in e.violations)
    out: list[str] = []
    combos = result.all_combinations
    if codes.get("over_budget") and cons.max_monthly_budget_gbp is not None:
        totals = [c.costs.monthly_total_gbp for c in combos if c.costs.monthly_total_gbp is not None]
        if totals:
            out.append(
                f"The lowest monthly cost of any option in the data is £{min(totals):.2f}; your budget is "
                f"£{cons.max_monthly_budget_gbp:.0f}. Raising it, or making it a preference, would broaden the search."
            )
    if codes.get("over_commute_limit") and cons.max_commute_min is not None:
        durations = [c.transport.duration_min for c in combos if c.transport.duration_min is not None]
        if durations:
            out.append(
                f"The shortest commute available is about {min(durations):.0f} min; your hard limit is "
                f"{cons.max_commute_min} min. Raise the limit or make it a preference."
            )
    if codes.get("over_upfront_limit") and cons.max_upfront_gbp is not None:
        ups = [c.costs.upfront_total_gbp for c in combos if c.costs.upfront_total_gbp is not None]
        if ups:
            out.append(f"The lowest upfront cost is £{min(ups):.2f}; your limit is £{cons.max_upfront_gbp:.0f}.")
    for code, label in (
        ("ensuite_unverified", "ensuite"),
        ("accessibility_unverified", "accessible"),
        ("studio_unverified", "studio"),
    ):
        if codes.get(code):
            out.append(
                f"{codes[code]} room(s) were excluded only because the source does not state whether they are "
                f"{label}; contact the provider to check."
            )
    if codes.get("no_allowed_transport"):
        out.append("Allow more transport modes to include residences without a route for your current selection.")
    if not out:
        out.append("No option meets every hard requirement. Try relaxing one requirement at a time.")
    return out


def summary(result: EngineResult) -> str:
    if not result.ranked:
        return (
            "No option in the current data meets all of your hard constraints. Nothing is recommended; see the "
            "suggestions for which constraint to relax."
        )
    c = result.ranked[0]
    a, t = c.accommodation, c.transport
    m = f"£{c.costs.monthly_total_gbp:.2f}" if c.costs.monthly_total_gbp is not None else "an incomplete monthly total"
    u = f"£{c.costs.upfront_total_gbp:.2f}" if c.costs.upfront_total_gbp is not None else "an incomplete upfront total"
    d = f"a commute of about {t.duration_min:.0f} minutes" if t.duration_min is not None else "an unknown commute"
    n = len(result.ranked)
    return (
        f"{a.residence_name} ({a.room_type}) with a {MODE_NOUN[t.mode]} commute is the best overall fit among {n} "
        f"room option(s) that meet your constraints: {m} per month all-in, {u} upfront, {d}."
    )


def excluded_sorted(result: EngineResult) -> list[Exclusion]:
    return sorted(result.excluded, key=lambda e: e.accommodation.id)
