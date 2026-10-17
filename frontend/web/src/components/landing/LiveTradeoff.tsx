'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { uniwiseApi } from '@shared/api/client';
import { gbp, toRecommendationRequest, type PriorityPreset } from '@shared/api/profile';
import type { RankedCandidate } from '@shared/api/types';
import { useApi } from '@shared/api/useApi';

// Two real recommendations from the decision engine for the same default student:
// one where cost matters most, one where commute matters most. Nothing here is hardcoded.
const SCENARIOS: { preset: PriorityPreset; label: string }[] = [
  { preset: 'lowest_cost', label: 'Option A: cost matters most' },
  { preset: 'shortest_commute', label: 'Option B: commute matters most' },
];
const MODE_LABEL: Record<string, string> = { walk: 'walking', cycle: 'cycling', subway: 'Subway' };
const EXAMPLE_BUDGET = 1000; // generous monthly limit so the comparison is driven by priorities, not exclusions

function useScenario(preset: PriorityPreset) {
  const conversion = toRecommendationRequest(null, { monthlyBudgetGbp: EXAMPLE_BUDGET, preset });
  const request = conversion.ok ? conversion.request : null;
  return useApi(request ? JSON.stringify(request) : null, () => uniwiseApi.recommend(request!));
}

export function LiveTradeoff() {
  const [active, setActive] = useState(0);
  const cost = useScenario('lowest_cost');
  const commute = useScenario('shortest_commute');
  const results = [cost, commute];
  const current = results[active];
  const top = current.data?.ranked[0];
  const sameChoice =
    cost.data?.recommended_candidate_id && cost.data.recommended_candidate_id === commute.data?.recommended_candidate_id;

  return (
    <section className="border-b border-slate-200 bg-white py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <span className="rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-800">
            Live from the decision engine
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Same student, two priorities</h2>
          <p className="mt-1 text-xs text-slate-600 sm:text-sm">
            Real University of Glasgow rooms and real commutes. Switch priority to see what the recommendation trades off.
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
          <div role="tablist" aria-label="Priority" className="flex gap-1 border-b border-slate-200 bg-white p-2">
            {SCENARIOS.map((s, i) => (
              <button
                key={s.preset}
                type="button"
                role="tab"
                aria-selected={active === i}
                onClick={() => setActive(i)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  active === i ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div role="tabpanel" className="p-6" aria-live="polite">
            {current.error ? (
              <div className="text-center text-sm text-slate-600">
                The live example is unavailable right now ({current.error.message}).
                <button type="button" onClick={current.retry} className="ml-2 inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline">
                  <RefreshCw className="h-3.5 w-3.5" /> Try again
                </button>
              </div>
            ) : !top ? (
              <div className="h-40 animate-shimmer rounded-xl" aria-label="Loading live example" />
            ) : (
              <Scenario top={top} />
            )}
          </div>

          <div className="flex flex-col items-center justify-between gap-2 border-t border-slate-200 bg-white px-6 py-3 text-[11px] text-slate-500 sm:flex-row">
            <span>
              {sameChoice
                ? 'Both priorities lead to the same choice for this student.'
                : `Example student: ${gbp(EXAMPLE_BUDGET)}/month limit, 5 campus days a week. Sources: UofG fees, SPT fares, OpenStreetMap routing.`}
            </span>
            <Link href="/onboarding" className="inline-flex items-center gap-1 font-bold text-slate-900 hover:underline">
              Get your own recommendation <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Scenario({ top }: { top: RankedCandidate }) {
  const part = (id: string) => top.costs.components.find((c) => c.component_id === id)?.amount_gbp;
  const monthly = top.costs.monthly_total_gbp;
  const cells = [
    { label: 'Rent (monthly)', value: part('rent') },
    { label: 'Bills', value: part('bills'), note: top.accommodation.bills_included ? 'included' : undefined },
    { label: 'Commute fare', value: part('transport') },
  ];
  return (
    <div>
      <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <div className="text-lg font-bold text-slate-900">{top.accommodation.residence_name}</div>
          <div className="text-xs text-slate-500">
            {top.accommodation.room_type} · {MODE_LABEL[top.transport.mode]} to campus
          </div>
        </div>
        <div className="sm:text-right">
          <span className="block text-[10px] font-bold uppercase text-slate-500">True monthly cost</span>
          <span className="text-2xl font-black text-slate-900">{monthly !== null && monthly !== undefined ? gbp(monthly) : 'Incomplete'}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[10px] font-bold uppercase text-slate-500">{c.label}</div>
            <div className="text-lg font-black text-slate-900">{c.value !== null && c.value !== undefined ? gbp(c.value) : 'Unknown'}</div>
            {c.note && <div className="text-[10px] text-emerald-700">{c.note}</div>}
          </div>
        ))}
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="text-[10px] font-bold uppercase text-slate-500">Commute</div>
          <div className="text-lg font-black text-slate-900">
            {top.transport.duration_min !== null && top.transport.duration_min !== undefined ? `${Math.round(top.transport.duration_min)} min` : 'Unknown'}
          </div>
          <div className="text-[10px] text-slate-500">one way{top.transport.duration_status === 'estimated' ? ', estimated' : ''}</div>
        </div>
      </div>
      {top.compromises[0] && <p className="mt-3 text-xs text-amber-800">Trade-off: {top.compromises[0]}</p>}
    </div>
  );
}
