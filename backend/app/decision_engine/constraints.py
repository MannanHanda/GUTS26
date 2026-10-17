"""Hard constraints, applied before any preference scoring.

A hard requirement that cannot be verified because the value is unknown is treated as
NOT satisfied (``*_unverifiable`` / ``*_unverified``) - it is never assumed to pass.
"""

from __future__ import annotations

from app.models.api import Constraints, ConstraintViolation, CostBreakdown
from app.models.domain import AccommodationOption, TransportOption


def room_violations(c: Constraints, accom: AccommodationOption) -> list[ConstraintViolation]:
    out: list[ConstraintViolation] = []
    checks = [
        (c.require_ensuite, accom.ensuite, "not_ensuite", "ensuite_unverified", "ensuite"),
        (c.require_accessible, accom.accessible, "not_accessible", "accessibility_unverified", "an accessible room"),
        (c.require_studio, accom.studio, "not_studio", "studio_unverified", "a studio"),
    ]
    for required, value, fail_code, unknown_code, label in checks:
        if not required:
            continue
        if value is False:
            out.append(ConstraintViolation(code=fail_code, message=f"You require {label}; this room is not {label}."))
        elif value is None:
            out.append(
                ConstraintViolation(
                    code=unknown_code,
                    message=f"You require {label}; the source does not state whether this room is {label}.",
                )
            )
    if c.exclude_shared_rooms and accom.shared_room:
        out.append(ConstraintViolation(code="shared_room", message="This is a shared (twin) room, which you excluded."))
    return out


def combination_violations(
    c: Constraints, transport: TransportOption, costs: CostBreakdown
) -> list[ConstraintViolation]:
    out: list[ConstraintViolation] = []
    budget = c.max_monthly_budget_gbp
    if budget is not None and c.budget_is_hard:
        if costs.monthly_total_gbp is None:
            out.append(
                ConstraintViolation(
                    code="budget_unverifiable",
                    message=f"Monthly cost cannot be confirmed within £{budget:.0f}: a cost component is unknown.",
                )
            )
        elif costs.monthly_total_gbp > budget:
            out.append(
                ConstraintViolation(
                    code="over_budget",
                    message=f"Monthly cost £{costs.monthly_total_gbp:.2f} exceeds your £{budget:.0f} budget "
                    f"by £{costs.monthly_total_gbp - budget:.2f}.",
                )
            )
    if c.max_upfront_gbp is not None:
        if costs.upfront_total_gbp is None:
            out.append(
                ConstraintViolation(
                    code="upfront_unverifiable",
                    message=f"Upfront cost cannot be confirmed within £{c.max_upfront_gbp:.0f}: a value is unknown.",
                )
            )
        elif costs.upfront_total_gbp > c.max_upfront_gbp:
            out.append(
                ConstraintViolation(
                    code="over_upfront_limit",
                    message=f"Upfront cost £{costs.upfront_total_gbp:.2f} exceeds your £{c.max_upfront_gbp:.0f} limit.",
                )
            )
    if c.max_commute_min is not None and c.commute_is_hard:
        if transport.duration_min is None:
            out.append(
                ConstraintViolation(
                    code="commute_unverifiable", message=f"{transport.mode.title()} journey time is unknown."
                )
            )
        elif transport.duration_min > c.max_commute_min:
            out.append(
                ConstraintViolation(
                    code="over_commute_limit",
                    message=f"{transport.mode.title()} commute of {transport.duration_min:.0f} min exceeds your "
                    f"{c.max_commute_min}-minute limit.",
                )
            )
    return out


def soft_limit_flags(c: Constraints, transport: TransportOption, costs: CostBreakdown) -> list[str]:
    """Breaches of limits the student marked as preferences rather than hard requirements."""
    flags: list[str] = []
    budget = c.max_monthly_budget_gbp
    if (
        budget is not None
        and not c.budget_is_hard
        and costs.monthly_total_gbp is not None
        and costs.monthly_total_gbp > budget
    ):
        flags.append(f"Exceeds your preferred £{budget:.0f} monthly budget by £{costs.monthly_total_gbp - budget:.2f}.")
    if (
        c.max_commute_min is not None
        and not c.commute_is_hard
        and transport.duration_min is not None
        and transport.duration_min > c.max_commute_min
    ):
        flags.append(f"Commute of {transport.duration_min:.0f} min is over your preferred {c.max_commute_min} minutes.")
    return flags
