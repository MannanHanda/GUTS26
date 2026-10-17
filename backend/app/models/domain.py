"""Provider-independent domain models shared by the data layer and the decision engine."""

from __future__ import annotations

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field

# Source-status vocabulary (see docs/data-sources.md):
#   live        retrieved from the provider during this server session
#   curated     transcribed by hand from an official source page, with a verification date
#   cached      retrieved programmatically from a provider API at a recorded time and stored
#   estimated   derived from a documented calculation or assumption
#   synthetic   demonstration-only record
#   stale       older than its freshness window
#   unavailable the source could not be loaded
DataStatus = Literal["live", "curated", "cached", "estimated", "synthetic", "stale", "unavailable"]

# How an individual cost figure was obtained.
CostBasis = Literal["sourced", "included", "estimated", "assumed", "definitional", "unknown"]

TransportMode = Literal["walk", "cycle", "subway"]

WEEKS_PER_MONTH = 52 / 12
DAYS_PER_MONTH = 365.25 / 12


class Model(BaseModel):
    model_config = ConfigDict(extra="forbid")


class Provenance(Model):
    source_id: str
    source_name: str
    source_url: str
    status: DataStatus
    retrieved_at: datetime | None = None
    last_verified_at: datetime | None = None
    notes: str | None = None


class AccommodationOption(Model):
    """One bookable room type in one residence, as published by the source."""

    id: str = Field(description="Stable identifier: '<residence_id>--<room-type-slug>'.")
    residence_id: str
    residence_name: str
    operator: str
    room_type: str
    address: str
    postcode: str
    latitude: float | None = None
    longitude: float | None = None
    weekly_rent_gbp: float = Field(gt=0)
    contract_weeks: int = Field(gt=0)
    contract_start: date
    contract_end: date
    contract_total_gbp: float = Field(gt=0)
    bills_included: bool
    included_services: list[str]
    advance_payment_gbp: float | None = Field(default=None, ge=0)
    advance_payment_refundable: bool | None = None
    ensuite: bool | None = Field(default=None, description="null = not stated by the source.")
    accessible: bool | None = Field(default=None, description="true only where the source names an accessible room.")
    studio: bool | None = None
    shared_room: bool = False
    availability: Literal["unknown"] = Field(
        default="unknown", description="Availability is never published by the source, so it is always unknown."
    )
    published_walk_to_campus: str | None = None
    profile_url: str
    provenance: Provenance

    @computed_field  # type: ignore[prop-decorator]
    @property
    def monthly_rent_equivalent_gbp(self) -> float:
        """Weekly rent normalised to an average calendar month (x 52 / 12)."""
        return round(self.weekly_rent_gbp * WEEKS_PER_MONTH, 2)


class RouteEstimate(Model):
    duration_min: float = Field(ge=0)
    distance_km: float = Field(ge=0)
    provenance: Provenance


class SubwayStation(Model):
    atco_code: str
    name: str
    latitude: float
    longitude: float


class SeasonTicket(Model):
    ticket_id: str
    name: str
    price_gbp: float = Field(gt=0)
    validity_days: int = Field(gt=0)


class SubwayFares(Model):
    smartcard_cost_gbp: float
    adult_single_smartcard_gbp: float
    adult_daily_smartcard_gbp: float
    season_tickets: list[SeasonTicket]
    network_order: list[str]
    minutes_per_segment: float
    average_wait_min: float
    fares_provenance: Provenance
    timing_provenance: Provenance


class JourneyLeg(Model):
    mode: TransportMode
    from_name: str
    to_name: str
    duration_min: float | None
    distance_km: float | None
    status: DataStatus


class TicketInfo(Model):
    name: str
    price_gbp: float
    validity: str
    monthly_equivalent_gbp: float
    calculation: str


class TransportOption(Model):
    option_id: str
    residence_id: str
    campus_id: str
    mode: TransportMode
    available: bool
    unavailable_reason: str | None = None
    duration_min: float | None = Field(default=None, description="One-way door-to-door estimate.")
    duration_status: DataStatus | None = None
    distance_km: float | None = None
    transfers: int | None = None
    legs: list[JourneyLeg] = []
    monthly_cost_gbp: float | None = None
    monthly_cost_basis: CostBasis = "unknown"
    upfront_cost_gbp: float | None = None
    upfront_cost_basis: CostBasis = "unknown"
    ticket: TicketInfo | None = None
    alternative_tickets: list[TicketInfo] = []
    assumptions: list[str] = []
    provenance: list[Provenance] = []


class ConcessionScheme(Model):
    scheme_id: str
    name: str
    modes: list[str]
    potential_value: str
    eligibility_summary: str
    restrictions: list[str]
    apply_url: str
    provenance: Provenance


class Campus(Model):
    campus_id: str
    name: str
    postcode: str
    latitude: float | None = None
    longitude: float | None = None


class SourceStatus(Model):
    source_id: str
    name: str
    source_url: str
    retrieval_method: Literal["manual_curation", "public_api_snapshot"]
    status: DataStatus
    retrieved_at: datetime | None = None
    last_verified_at: datetime | None = None
    freshness_window_days: int | None = None
    record_count: int = 0
    notes: str | None = None
    error: str | None = None
