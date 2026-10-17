'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Building2, ExternalLink, Footprints } from 'lucide-react';
import { uniwiseApi, type AccommodationFilters } from '@shared/api/client';
import { gbp } from '@shared/api/profile';
import type { AccommodationOption } from '@shared/api/types';
import { useApi } from '@shared/api/useApi';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import { SkeletonCard } from '@/components/LoadingSkeleton';

const TOGGLES: { key: 'ensuite' | 'accessible' | 'studio'; label: string }[] = [
  { key: 'ensuite', label: 'Ensuite' },
  { key: 'accessible', label: 'Accessible room' },
  { key: 'studio', label: 'Studio' },
];

export default function AccommodationPage() {
  const [filters, setFilters] = useState<AccommodationFilters>({ sort: 'weekly_rent' });
  const { data, error, loading, retry } = useApi(JSON.stringify(filters), () => uniwiseApi.accommodations(filters));

  if (error) return <ErrorScreen kind={error.kind} details={error.details} onRetry={retry} />;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Housing &amp; bills</h1>
          <p className="mt-1 text-xs text-slate-500">
            University of Glasgow residences for 2026/27, from the official fees pages. Filters use the published
            record values; a room counts as ensuite or accessible only where the source says so.
          </p>
        </header>

        <section aria-label="Filters" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
          <fieldset className="flex flex-wrap gap-2">
            <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-800">Must have</legend>
            {TOGGLES.map((t) => (
              <label key={t.key} className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 has-[:checked]:border-slate-900 has-[:checked]:bg-slate-900 has-[:checked]:text-white">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={filters[t.key] === true}
                  onChange={(e) => setFilters((f) => ({ ...f, [t.key]: e.target.checked ? true : undefined }))}
                />
                {t.label}
              </label>
            ))}
          </fieldset>
          <div className="flex-1">
            <label htmlFor="max-rent" className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-800">
              Max weekly rent <span className="normal-case text-slate-900">{filters.maxWeeklyRentGbp ? gbp(filters.maxWeeklyRentGbp) : 'Any'}</span>
            </label>
            <input
              id="max-rent"
              type="range"
              min={120}
              max={250}
              step={5}
              value={filters.maxWeeklyRentGbp ?? 250}
              onChange={(e) => setFilters((f) => ({ ...f, maxWeeklyRentGbp: Number(e.target.value) >= 250 ? undefined : Number(e.target.value) }))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
            />
          </div>
          <div>
            <label htmlFor="sort" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-800">Sort</label>
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value as AccommodationFilters['sort'] }))}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
            >
              <option value="weekly_rent">Lowest rent</option>
              <option value="name">Residence name</option>
            </select>
          </div>
        </section>

        <p aria-live="polite" className="text-xs text-slate-500">
          {loading ? 'Loading rooms…' : `${data?.total ?? 0} room types match. Availability is not published, so no room is shown as available.`}
        </p>

        {!data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : data.items.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
            No rooms match these filters. Try removing a requirement or raising the maximum rent.
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 ${loading ? 'opacity-60' : ''}`}>
            {data.items.map((a) => (
              <RoomCard key={a.id} room={a} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function yesNo(v: boolean | null | undefined) {
  return v === null || v === undefined ? 'Not stated' : v ? 'Yes' : 'No';
}

function RoomCard({ room: a }: { room: AccommodationOption }) {
  return (
    <article className="card-hover-lift flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div>
        <div className="mb-1 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{a.residence_name}</h2>
            <p className="text-[11px] text-slate-500">{a.room_type}</p>
          </div>
          <Building2 className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mt-2 text-xl font-black text-slate-900">
          {gbp(a.weekly_rent_gbp)} <span className="text-xs font-medium text-slate-400">/ week</span>
        </div>
        <p className="text-[11px] text-slate-500">≈ {gbp(a.monthly_rent_equivalent_gbp)} / month · {a.contract_weeks}-week contract ({gbp(a.contract_total_gbp)})</p>

        <dl className="mt-3 space-y-1 border-t border-slate-100 pt-2 text-xs">
          <Item label="Bills" value={a.bills_included ? 'Included' : 'Not included'} />
          <Item label="Ensuite" value={yesNo(a.ensuite)} />
          <Item label="Accessible" value={yesNo(a.accessible)} />
          <Item label="Advance payment" value={a.advance_payment_gbp !== null && a.advance_payment_gbp !== undefined ? `${gbp(a.advance_payment_gbp)} (refund terms not stated)` : 'Not stated'} />
          <Item label="Availability" value="Not verified" />
        </dl>
        {a.published_walk_to_campus && (
          <p className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <Footprints className="h-3 w-3" aria-hidden="true" /> University states: {a.published_walk_to_campus} to campus
          </p>
        )}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2 text-xs">
        <a href={a.profile_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline">
          Official page <ExternalLink className="h-3 w-3" />
        </a>
        <Link href="/transport" className="inline-flex items-center gap-1 font-bold text-slate-900 hover:underline">
          Commute options <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </article>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-semibold text-slate-800">{value}</dd>
    </div>
  );
}
