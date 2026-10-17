'use client';

import { useMemo, useState } from 'react';
import { Bike, Footprints, TrainFront, ExternalLink } from 'lucide-react';
import { uniwiseApi } from '@shared/api/client';
import { gbp } from '@shared/api/profile';
import type { TransportOption } from '@shared/api/types';
import { useApi } from '@shared/api/useApi';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import { SkeletonCard } from '@/components/LoadingSkeleton';

const MODE = {
  walk: { label: 'Walking', Icon: Footprints },
  cycle: { label: 'Cycling', Icon: Bike },
  subway: { label: 'Subway', Icon: TrainFront },
} as const;

export default function TransportPage() {
  const rooms = useApi('residences', () => uniwiseApi.accommodations({ sort: 'name' }));
  // One entry per residence: routes depend on the building, not the room type.
  const residences = useMemo(() => {
    const seen = new Map<string, { id: string; name: string }>();
    for (const r of rooms.data?.items ?? []) if (!seen.has(r.residence_id)) seen.set(r.residence_id, { id: r.id, name: r.residence_name });
    return [...seen.values()];
  }, [rooms.data]);

  const [chosen, setChosen] = useState<string | null>(null);
  const [days, setDays] = useState(5);
  const accommodationId = chosen ?? residences[0]?.id ?? null;
  const options = useApi(accommodationId ? `${accommodationId}|${days}` : null, () =>
    uniwiseApi.transportOptions({ accommodationId: accommodationId!, campusDaysPerWeek: days }),
  );

  const error = rooms.error ?? options.error;
  if (error) return <ErrorScreen kind={error.kind} details={error.details} onRetry={rooms.error ? rooms.retry : options.retry} />;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">Commute options</h1>
          <p className="mt-1 text-xs text-slate-500">
            Walking and cycling times from OpenStreetMap routing; Subway fares from SPT. Bus and rail are not modelled yet.
          </p>
        </header>

        <section aria-label="Journey settings" className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
          <div className="flex-1">
            <label htmlFor="residence" className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-800">From residence</label>
            <select
              id="residence"
              value={accommodationId ?? ''}
              onChange={(e) => setChosen(e.target.value)}
              disabled={!residences.length}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800"
            >
              {residences.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label htmlFor="days" className="mb-2 flex justify-between text-xs font-bold uppercase tracking-wider text-slate-800">
              Campus days per week <span className="text-slate-900">{days}</span>
            </label>
            <input
              id="days"
              type="range"
              min={1}
              max={7}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
            />
            <p className="mt-1 text-[10px] text-slate-400">Changes which Subway ticket is cheapest.</p>
          </div>
        </section>

        {!options.data ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className={`grid grid-cols-1 gap-4 md:grid-cols-3 ${options.loading ? 'opacity-60' : ''}`}>
            {options.data.items.map((t) => (
              <ModeCard key={t.option_id} option={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeCard({ option: t }: { option: TransportOption }) {
  const { label, Icon } = MODE[t.mode];
  if (!t.available) {
    return (
      <article className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 font-bold text-slate-900">
          <Icon className="h-4 w-4" aria-hidden="true" /> {label}
        </h2>
        Unavailable: {t.unavailable_reason}
      </article>
    );
  }
  return (
    <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-bold text-slate-900">
          <Icon className="h-4 w-4" aria-hidden="true" /> {label}
        </h2>
        <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600">{t.duration_status}</span>
      </div>
      <div>
        <div className="text-2xl font-black text-slate-900">
          {t.duration_min !== null && t.duration_min !== undefined ? `${Math.round(t.duration_min)} min` : 'Unknown'}
          <span className="ml-1 text-xs font-medium text-slate-400">one way</span>
        </div>
        <p className="text-[11px] text-slate-500">
          {gbp(t.monthly_cost_gbp ?? 0)} / month · {gbp(t.upfront_cost_gbp ?? 0)} upfront
          {t.distance_km ? ` · ${t.distance_km} km` : ''}
        </p>
      </div>
      {t.legs && t.legs.length > 1 && (
        <ol className="space-y-1 border-t border-slate-100 pt-2 text-xs">
          {t.legs.map((leg, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span className="text-slate-600">
                {MODE[leg.mode].label} to {i === t.legs!.length - 1 ? 'campus' : leg.to_name}
              </span>
              <span className="font-semibold text-slate-800">
                {leg.duration_min !== null && leg.duration_min !== undefined ? `${Math.round(leg.duration_min)} min` : '?'}
                {leg.status === 'estimated' ? '*' : ''}
              </span>
            </li>
          ))}
        </ol>
      )}
      {t.ticket && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
          <span className="font-semibold text-slate-900">Cheapest ticket: {t.ticket.name}</span>
          <p className="mt-0.5 text-slate-600">
            {gbp(t.ticket.price_gbp)} per {t.ticket.validity} → {gbp(t.ticket.monthly_equivalent_gbp)} / month
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-slate-500">{t.ticket.calculation}</p>
          {t.alternative_tickets?.map((alt) => (
            <p key={alt.name} className="mt-1 text-[11px] text-slate-500">
              Also considered: {alt.name} ({gbp(alt.monthly_equivalent_gbp)} / month)
            </p>
          ))}
        </div>
      )}
      <ul className="list-disc space-y-0.5 pl-4 text-[11px] text-slate-500">
        {t.assumptions?.map((a) => (
          <li key={a}>{a}</li>
        ))}
      </ul>
      <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 border-t border-slate-100 pt-2 text-[11px]">
        {t.provenance?.map((p) => (
          <a key={p.source_id} href={p.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline">
            {p.source_name.split(' - ')[0]} ({p.status}) <ExternalLink className="h-3 w-3" />
          </a>
        ))}
      </div>
    </article>
  );
}
