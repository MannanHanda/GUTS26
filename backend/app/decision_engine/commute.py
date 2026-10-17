"""Build comparable commute options from routing and fare data.

Only modes the data can support are produced. A mode with no route is returned as
``available=False`` with a reason - never with an invented duration.
"""

from __future__ import annotations

from typing import Protocol

from app.models.domain import (
    DAYS_PER_MONTH,
    WEEKS_PER_MONTH,
    JourneyLeg,
    RouteEstimate,
    SubwayFares,
    SubwayStation,
    TicketInfo,
    TransportMode,
    TransportOption,
)


class RouteSource(Protocol):
    def route(self, from_id: str, to_id: str, mode: TransportMode) -> RouteEstimate | None: ...
    def subway_stations(self) -> list[SubwayStation]: ...
    def subway_fares(self) -> SubwayFares | None: ...


def residence_point(residence_id: str) -> str:
    return f"residence:{residence_id}"


def campus_point(campus_id: str) -> str:
    return f"campus:{campus_id}"


def station_point(atco_code: str) -> str:
    return f"station:{atco_code}"


def _option_id(residence_id: str, campus_id: str, mode: TransportMode) -> str:
    return f"{residence_id}:{campus_id}:{mode}"


def _unavailable(residence_id: str, campus_id: str, mode: TransportMode, reason: str) -> TransportOption:
    return TransportOption(
        option_id=_option_id(residence_id, campus_id, mode),
        residence_id=residence_id,
        campus_id=campus_id,
        mode=mode,
        available=False,
        unavailable_reason=reason,
    )


def active_travel_option(
    src: RouteSource,
    residence_id: str,
    residence_name: str,
    campus_id: str,
    campus_name: str,
    mode: TransportMode,
) -> TransportOption:
    route = src.route(residence_point(residence_id), campus_point(campus_id), mode)
    if route is None:
        return _unavailable(residence_id, campus_id, mode, f"No {mode} route is available in the cached routing data.")
    if mode == "walk":
        basis, assumptions = "definitional", ["Walking has no fare."]
    else:
        basis = "assumed"
        assumptions = ["Assumes you already have access to a bicycle; purchase, maintenance and storage are excluded."]
    return TransportOption(
        option_id=_option_id(residence_id, campus_id, mode),
        residence_id=residence_id,
        campus_id=campus_id,
        mode=mode,
        available=True,
        duration_min=round(route.duration_min, 1),
        duration_status=route.provenance.status,
        distance_km=round(route.distance_km, 2),
        transfers=0,
        legs=[
            JourneyLeg(
                mode=mode,
                from_name=residence_name,
                to_name=campus_name,
                duration_min=round(route.duration_min, 1),
                distance_km=round(route.distance_km, 2),
                status=route.provenance.status,
            )
        ],
        monthly_cost_gbp=0.0,
        monthly_cost_basis=basis,
        upfront_cost_gbp=0.0,
        upfront_cost_basis=basis,
        assumptions=[
            *assumptions,
            "Route estimate from OpenStreetMap routing; it excludes traffic lights and weather.",
        ],
        provenance=[route.provenance],
    )


def subway_tickets(fares: SubwayFares, campus_days_per_week: int) -> tuple[TicketInfo, list[TicketInfo]]:
    """Return the cheapest ticket strategy for a regular commute and the alternatives considered."""
    per_day = min(2 * fares.adult_single_smartcard_gbp, fares.adult_daily_smartcard_gbp)
    payg_monthly = per_day * campus_days_per_week * WEEKS_PER_MONTH
    options = [
        TicketInfo(
            name="Smartcard pay-as-you-go (return journey, capped at the daily fare)",
            price_gbp=round(per_day, 2),
            validity="1 day",
            monthly_equivalent_gbp=round(payg_monthly, 2),
            calculation=(
                f"min(2 x £{fares.adult_single_smartcard_gbp:.2f}, daily cap £{fares.adult_daily_smartcard_gbp:.2f})"
                f" x {campus_days_per_week} days/week x 52/12 weeks"
            ),
        )
    ]
    for t in fares.season_tickets:
        options.append(
            TicketInfo(
                name=t.name,
                price_gbp=t.price_gbp,
                validity=f"{t.validity_days} days",
                monthly_equivalent_gbp=round(t.price_gbp * DAYS_PER_MONTH / t.validity_days, 2),
                calculation=f"£{t.price_gbp:.2f} x (365.25/12) / {t.validity_days} days",
            )
        )
    options.sort(key=lambda o: (o.monthly_equivalent_gbp, o.name))
    return options[0], options[1:]


def subway_option(
    src: RouteSource,
    residence_id: str,
    residence_name: str,
    campus_id: str,
    campus_name: str,
    campus_days_per_week: int,
) -> TransportOption:
    fares, stations = src.subway_fares(), src.subway_stations()
    if fares is None or len(stations) < 2:
        return _unavailable(residence_id, campus_id, "subway", "Subway fare or station data is unavailable.")
    origin, dest = residence_point(residence_id), campus_point(campus_id)
    n = len(stations)
    access_legs = [src.route(origin, station_point(s.atco_code), "walk") for s in stations]
    egress_legs = [src.route(station_point(s.atco_code), dest, "walk") for s in stations]
    best: tuple[float, int, int, RouteEstimate, RouteEstimate] | None = None
    for i, access in enumerate(access_legs):
        if access is None:
            continue
        for j, egress in enumerate(egress_legs):
            if i == j or egress is None:
                continue
            segments = min(abs(i - j), n - abs(i - j))  # the circle runs in both directions
            total = (
                access.duration_min
                + fares.average_wait_min
                + segments * fares.minutes_per_segment
                + egress.duration_min
            )
            if best is None or total < best[0] - 1e-9:
                best = (total, i, j, access, egress)
    if best is None:
        return _unavailable(residence_id, campus_id, "subway", "No walking route to a Subway station is available.")

    total, i, j, access, egress = best
    segments = min(abs(i - j), n - abs(i - j))
    ride_min = segments * fares.minutes_per_segment + fares.average_wait_min
    ticket, alternatives = subway_tickets(fares, campus_days_per_week)
    walk_status = access.provenance.status
    return TransportOption(
        option_id=_option_id(residence_id, campus_id, "subway"),
        residence_id=residence_id,
        campus_id=campus_id,
        mode="subway",
        available=True,
        duration_min=round(total, 1),
        duration_status="estimated",
        distance_km=None,
        transfers=0,
        legs=[
            JourneyLeg(
                mode="walk",
                from_name=residence_name,
                to_name=f"{stations[i].name} station",
                duration_min=round(access.duration_min, 1),
                distance_km=round(access.distance_km, 2),
                status=walk_status,
            ),
            JourneyLeg(
                mode="subway",
                from_name=stations[i].name,
                to_name=stations[j].name,
                duration_min=round(ride_min, 1),
                distance_km=None,
                status="estimated",
            ),
            JourneyLeg(
                mode="walk",
                from_name=f"{stations[j].name} station",
                to_name=campus_name,
                duration_min=round(egress.duration_min, 1),
                distance_km=round(egress.distance_km, 2),
                status=walk_status,
            ),
        ],
        monthly_cost_gbp=ticket.monthly_equivalent_gbp,
        monthly_cost_basis="sourced",
        upfront_cost_gbp=fares.smartcard_cost_gbp,
        upfront_cost_basis="sourced",
        ticket=ticket,
        alternative_tickets=alternatives,
        assumptions=[
            (
                f"{segments} station-to-station segment(s) at an estimated {fares.minutes_per_segment:.1f} min each, "
                f"plus an average wait of {fares.average_wait_min:.0f} min (estimated, not timetable data)."
            ),
            f"Ticket cost assumes {campus_days_per_week} campus day(s) per week, every week (52/12 weeks per month).",
            "Priced at adult fares: SPT publishes no student or young-person Subway fare.",
            "A personalised Smartcard (one-off cost) is needed for season tickets and Smartcard fares.",
        ],
        provenance=[access.provenance, fares.fares_provenance, fares.timing_provenance],
    )


def build_transport_options(
    src: RouteSource,
    residence_id: str,
    residence_name: str,
    campus_id: str,
    campus_name: str,
    campus_days_per_week: int,
    modes: list[TransportMode],
) -> list[TransportOption]:
    out: list[TransportOption] = []
    for mode in modes:
        if mode == "subway":
            out.append(subway_option(src, residence_id, residence_name, campus_id, campus_name, campus_days_per_week))
        else:
            out.append(active_travel_option(src, residence_id, residence_name, campus_id, campus_name, mode))
    return out
