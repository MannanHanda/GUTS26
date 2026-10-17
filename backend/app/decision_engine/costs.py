"""Auditable cost model.

monthly_total = monthly rent equivalent + monthly bills (0 when included in rent) + monthly transport
upfront_total = accommodation advance payment + transport set-up cost

Unknown components are ``None`` and make the corresponding total ``None`` (incomplete);
they are never silently treated as zero.
"""

from __future__ import annotations

from app.models.api import CostBreakdown, CostComponent
from app.models.domain import AccommodationOption, TransportOption

COST_ASSUMPTIONS = [
    "Monthly rent equivalent = weekly rent x 52 / 12; it applies for the months you hold the contract.",
    "Mobile, food, course materials and other living costs are not included in this comparison.",
    "Conditional discounts and unconfirmed concessions are never subtracted from costs.",
]

MODE_LABEL = {"walk": "Walking", "cycle": "Cycling", "subway": "Subway"}


def _sum_known(components: list[CostComponent]) -> tuple[float | None, float, bool]:
    known = round(sum(c.amount_gbp for c in components if c.amount_gbp is not None), 2)
    complete = all(c.amount_gbp is not None for c in components)
    return (known if complete else None), known, complete


def build_costs(accom: AccommodationOption, transport: TransportOption) -> CostBreakdown:
    recurring: list[CostComponent] = [
        CostComponent(
            component_id="rent",
            label="Rent (monthly equivalent)",
            category="recurring_monthly",
            amount_gbp=accom.monthly_rent_equivalent_gbp,
            basis="sourced",
            original_price=(
                f"£{accom.weekly_rent_gbp:.2f}/week for {accom.contract_weeks} weeks "
                f"(contract total £{accom.contract_total_gbp:,.2f})"
            ),
        ),
        CostComponent(
            component_id="bills",
            label="Bills",
            category="recurring_monthly",
            amount_gbp=0.0 if accom.bills_included else None,
            basis="included" if accom.bills_included else "unknown",
            notes=("Included in rent: " + ", ".join(s.replace("_", " ") for s in accom.included_services))
            if accom.bills_included
            else "Bills are not included and have not been sourced.",
        ),
        CostComponent(
            component_id="transport",
            label=f"{MODE_LABEL[transport.mode]} commute",
            category="recurring_monthly",
            amount_gbp=transport.monthly_cost_gbp,
            basis=transport.monthly_cost_basis,
            original_price=(
                f"{transport.ticket.name}: £{transport.ticket.price_gbp:.2f} per {transport.ticket.validity}"
                if transport.ticket
                else None
            ),
            notes=transport.ticket.calculation
            if transport.ticket
            else (transport.assumptions[0] if transport.assumptions else None),
        ),
    ]
    upfront: list[CostComponent] = [
        CostComponent(
            component_id="advance_payment",
            label="Accommodation advance payment",
            category="upfront",
            amount_gbp=accom.advance_payment_gbp,
            basis="sourced" if accom.advance_payment_gbp is not None else "unknown",
            refundable=accom.advance_payment_refundable,
            notes="Required to confirm a booking. The source does not say whether it is refundable or credited.",
        ),
        CostComponent(
            component_id="transport_setup",
            label=f"{MODE_LABEL[transport.mode]} set-up",
            category="upfront",
            amount_gbp=transport.upfront_cost_gbp,
            basis=transport.upfront_cost_basis,
            notes="Personalised Subway Smartcard" if transport.mode == "subway" else None,
        ),
    ]
    monthly_total, monthly_known, monthly_complete = _sum_known(recurring)
    upfront_total, upfront_known, upfront_complete = _sum_known(upfront)
    return CostBreakdown(
        components=recurring + upfront,
        monthly_total_gbp=monthly_total,
        monthly_known_subtotal_gbp=monthly_known,
        monthly_complete=monthly_complete,
        upfront_total_gbp=upfront_total,
        upfront_known_subtotal_gbp=upfront_known,
        upfront_complete=upfront_complete,
        contract_total_gbp=accom.contract_total_gbp,
        assumptions=COST_ASSUMPTIONS + transport.assumptions,
    )
