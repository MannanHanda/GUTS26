'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Bus,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  HelpCircle,
  ListChecks,
  Repeat,
  ShieldCheck,
  Sliders,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ApiError, uniwiseApi } from '@shared/api/client';
import {
  PRIORITY_PRESETS,
  gbp,
  initialChoices,
  saveProfile,
  toRecommendationRequest,
  useStoredProfile,
  type PriorityPreset,
  type ProfileChoices,
} from '@shared/api/profile';
import type { RankedCandidate, RecommendationResponse, SourceStatus } from '@shared/api/types';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import { CalculatingBadge, SkeletonDashboard } from '@/components/LoadingSkeleton';
import { Toast } from '@/components/Toast';
import { DictionaryTooltip } from '@/components/DictionaryTooltip';

const MODE_LABEL: Record<string, string> = { walk: 'Walking', cycle: 'Cycling', subway: 'Subway' };
const FACTOR_COLOURS: Record<string, string> = {
  monthly_cost: '#0f172a',
  commute_time: '#0284c7',
  upfront_cost: '#d97706',
  evidence_confidence: '#059669',
};
const STATUS_STYLE: Record<string, string> = {
  live: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  curated: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  cached: 'bg-sky-50 text-sky-800 border-sky-200',
  estimated: 'bg-amber-50 text-amber-800 border-amber-200',
  stale: 'bg-amber-50 text-amber-800 border-amber-200',
  synthetic: 'bg-rose-50 text-rose-800 border-rose-200',
  unavailable: 'bg-rose-50 text-rose-800 border-rose-200',
};

type Result =
  | { key: string; data: RecommendationResponse; previousTop: RankedCandidate | null }
  | { key: string; error: ApiError };

export default function DashboardPage() {
  const stored = useStoredProfile();
  const [overrides, setOverrides] = useState<Partial<ProfileChoices>>({});
  const choices: ProfileChoices = { ...initialChoices(stored), ...overrides };
  const conversion = toRecommendationRequest(stored, choices);
  const requestKey = conversion.ok ? JSON.stringify(conversion.request) : '';

  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0); // bumped by Try again to re-run the same request
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  // Re-run the real decision engine whenever the request changes (debounced for the slider).
  useEffect(() => {
    if (!requestKey) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      uniwiseApi
        .recommend(JSON.parse(requestKey), controller.signal)
        .then((data) =>
          setResult((prev) => ({
            key: requestKey,
            data,
            previousTop: prev && 'data' in prev ? (prev.data.ranked[0] ?? null) : null,
          })),
        )
        .catch((err) => {
          if (controller.signal.aborted) return;
          setResult({ key: requestKey, error: err instanceof ApiError ? err : new ApiError('internal_error', String(err), null) });
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [requestKey, attempt]);

  const updateChoices = (next: Partial<ProfileChoices>) => {
    setOverrides((o) => ({ ...o, ...next }));
    setSelectedId(null);
    if (stored) {
      saveProfile({
        ...stored,
        ...(next.preset ? { tradeoffPreference: next.preset } : {}),
        ...(next.monthlyBudgetGbp ? { maxAccommodationBudget: Math.round((next.monthlyBudgetGbp * 12) / 52) } : {}),
      });
    }
  };

  const recalculating = result !== null && result.key !== requestKey;
  const data = result && 'data' in result ? result.data : null;
  const active = useMemo(
    () => data?.ranked.find((r) => r.candidate_id === selectedId) ?? data?.ranked[0] ?? null,
    [data, selectedId],
  );

  if (!conversion.ok) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-lg font-bold text-amber-900">{conversion.university} is not covered yet</h1>
          <p className="mt-2 text-sm text-amber-800">
            Uniwise currently has verified accommodation and route data for the University of Glasgow only. Support for
            other Glasgow universities is planned. Choose the University of Glasgow in your profile to see a recommendation.
          </p>
          <Link href="/onboarding" className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white">
            <Sliders className="h-3.5 w-3.5" /> Edit profile
          </Link>
        </div>
      </div>
    );
  }

  if (result && 'error' in result && !recalculating) {
    return (
      <ErrorScreen
        kind={result.error.kind}
        details={result.error.details}
        onRetry={() => {
          setResult(null);
          setAttempt((a) => a + 1);
        }}
      />
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-end">
          <CalculatingBadge label="Comparing Glasgow rooms and commutes..." />
        </div>
        <SkeletonDashboard />
      </div>
    );
  }

  const handleCopy = () => {
    if (!active) return;
    const c = active.costs;
    const text = [
      'Uniwise living cost plan',
      `• ${active.accommodation.residence_name} (${active.accommodation.room_type}), ${MODE_LABEL[active.transport.mode]} commute`,
      `• Monthly: ${c.monthly_total_gbp !== null && c.monthly_total_gbp !== undefined ? gbp(c.monthly_total_gbp) : 'incomplete'} (rent, bills, commute)`,
      `• Upfront: ${c.upfront_total_gbp !== null && c.upfront_total_gbp !== undefined ? gbp(c.upfront_total_gbp) : 'incomplete'}`,
      `• Commute: about ${Math.round(active.transport.duration_min ?? 0)} min one way`,
      `• Room availability: not verified - check with the provider`,
    ].join('\n');
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setToastOpen(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center">
          <div>
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
                {data.profile_summary.campus_name}
              </span>
              <span className="text-[11px] font-medium text-slate-500">• {data.profile_summary.commute}</span>
              <span className="text-[11px] text-emerald-700">• Live decision engine</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">True Living Cost Dashboard</h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Monthly and upfront costs for rent, bills and commuting, ranked against your priorities.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5 text-slate-500" />}
              {copied ? 'Copied plan' : 'Share plan'}
            </button>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <Sliders className="h-3.5 w-3.5 text-slate-300" /> Edit profile
            </Link>
          </div>
        </div>

        {/* Signature control: change a preference, watch the real ranking update */}
        <section aria-label="Adjust your preferences" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between gap-2">
                <label htmlFor="budget" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-800">
                  <Wallet className="h-4 w-4 text-slate-700" /> Monthly budget (rent + bills + commute)
                </label>
                <div className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-lg border border-slate-300 focus-within:border-slate-900 focus-within:ring-1 focus-within:ring-slate-900">
                  <span className="text-xs font-bold text-slate-500">£</span>
                  <input
                    id="manual-budget-input"
                    type="number"
                    min={350}
                    max={2000}
                    step={10}
                    value={choices.monthlyBudgetGbp}
                    onChange={(e) => updateChoices({ monthlyBudgetGbp: Math.max(300, Number(e.target.value)) })}
                    className="w-20 bg-transparent text-sm font-extrabold text-slate-900 focus:outline-none text-right"
                    aria-label="Enter exact monthly budget"
                  />
                  <span className="text-[11px] font-medium text-slate-500">/ mo</span>
                </div>
              </div>
              <input
                id="budget"
                type="range"
                min={400}
                max={1400}
                step={10}
                value={choices.monthlyBudgetGbp}
                onChange={(e) => updateChoices({ monthlyBudgetGbp: Number(e.target.value) })}
                className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-200 accent-slate-900"
              />
              
              {/* Range Markers for Strict, Average, High */}
              <div className="mt-1.5 flex justify-between items-center text-[10px] font-bold text-slate-500 px-0.5">
                <button
                  type="button"
                  onClick={() => updateChoices({ monthlyBudgetGbp: 550 })}
                  className={`hover:text-slate-900 transition flex items-center gap-1 ${choices.monthlyBudgetGbp <= 650 ? 'text-teal-700 font-extrabold underline' : ''}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Strict (£550/mo)
                </button>
                <button
                  type="button"
                  onClick={() => updateChoices({ monthlyBudgetGbp: 850 })}
                  className={`hover:text-slate-900 transition flex items-center gap-1 ${choices.monthlyBudgetGbp > 650 && choices.monthlyBudgetGbp <= 1000 ? 'text-teal-700 font-extrabold underline' : ''}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  Average (£850/mo)
                </button>
                <button
                  type="button"
                  onClick={() => updateChoices({ monthlyBudgetGbp: 1200 })}
                  className={`hover:text-slate-900 transition flex items-center gap-1 ${choices.monthlyBudgetGbp > 1000 ? 'text-teal-700 font-extrabold underline' : ''}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  High (£1,200/mo)
                </button>
              </div>
              <p className="mt-1 text-[10px] text-slate-400">Hard limit: options above it are excluded, never quietly included.</p>
            </div>
            <div>
              <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-800">What matters most</span>
              <div role="radiogroup" aria-label="Priority" className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                {(Object.keys(PRIORITY_PRESETS) as PriorityPreset[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    role="radio"
                    aria-checked={choices.preset === p}
                    onClick={() => updateChoices({ preset: p })}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                      choices.preset === p ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {PRIORITY_PRESETS[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div aria-live="polite" className="mt-3 min-h-5 text-xs">
            {recalculating ? (
              <CalculatingBadge label="Re-running the decision engine..." />
            ) : (
              result && 'data' in result && <ChangeNote result={result} />
            )}
          </div>
        </section>

        {data.feasibility === 'no_feasible_options' || !active ? (
          <NoFeasible data={data} />
        ) : (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
              <Metric
                label="Monthly cost"
                value={active.costs.monthly_total_gbp !== null && active.costs.monthly_total_gbp !== undefined ? gbp(active.costs.monthly_total_gbp) : 'Incomplete'}
                note={`Contract total ${gbp(active.costs.contract_total_gbp)} (${active.accommodation.contract_weeks} weeks)`}
              />
              <Metric
                label="Upfront cash"
                value={active.costs.upfront_total_gbp !== null && active.costs.upfront_total_gbp !== undefined ? gbp(active.costs.upfront_total_gbp) : 'Incomplete'}
                note="Advance payment and travel set-up"
              />
              <Metric
                label="Commute"
                value={active.transport.duration_min !== null && active.transport.duration_min !== undefined ? `${Math.round(active.transport.duration_min)} min` : 'Unknown'}
                note={`${MODE_LABEL[active.transport.mode]}, one way${active.transport.duration_status === 'estimated' ? ' (estimated)' : ''}`}
              />
              <Metric
                label="Money left over"
                value={active.costs.monthly_total_gbp !== null && active.costs.monthly_total_gbp !== undefined ? gbp(choices.monthlyBudgetGbp - active.costs.monthly_total_gbp) : '—'}
                note="Money left over each month within your limit"
                positive
              />
            </div>

            {/* Recommendation spotlight */}
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="flex flex-col justify-between gap-4 bg-slate-900 p-5 text-white sm:flex-row sm:items-center sm:p-6">
                <div>
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-teal-300">
                    <Sparkles className="h-3 w-3" />
                    {active.rank === 1 ? 'Top recommendation' : `Option #${active.rank}`}
                    {active.rank === 1 && data.ranking_confidence === 'close' && ' · close call'}
                  </div>
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{active.accommodation.residence_name}</h2>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {active.accommodation.room_type} • {MODE_LABEL[active.transport.mode]} to {data.profile_summary.campus_name}
                  </p>
                </div>
                <div className="sm:text-right">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Overall fit</span>
                  <div className="text-2xl font-black sm:text-3xl">{Math.round(active.score)} / 100</div>
                  <span className="text-[10px] text-slate-400">relative to the other options within your limits</span>
                </div>
              </div>

              <div className="space-y-6 p-5 sm:p-7">
                {active.reasons.length > 0 && (
                  <List icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} title="Why this option" items={active.reasons} tone="slate" />
                )}
                {active.comparison && <p className="text-xs italic text-slate-600">{active.comparison}</p>}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <Pillar title="1. Housing" icon={<Building2 className="h-3.5 w-3.5 text-slate-400" />} link={{ href: '/accommodation', label: 'Compare housing' }}>
                    <Row label="Rent" value={`${gbp(active.accommodation.weekly_rent_gbp)}/wk`} />
                    <Row label="Bills" value={active.accommodation.bills_included ? 'Included' : 'Not included'} good={active.accommodation.bills_included} />
                    <Row label="Contract" value={`${active.accommodation.contract_weeks} weeks`} />
                    <Row label="Ensuite" value={active.accommodation.ensuite === null || active.accommodation.ensuite === undefined ? 'Not stated' : active.accommodation.ensuite ? 'Yes' : 'No'} />
                  </Pillar>
                  <Pillar title="2. Commute" icon={<Bus className="h-3.5 w-3.5 text-slate-400" />} link={{ href: '/transport', label: 'Compare commutes' }}>
                    {active.transport.legs?.map((leg, i) => (
                      <Row key={i} label={`${MODE_LABEL[leg.mode]} to ${leg.to_name === data.profile_summary.campus_name ? 'campus' : leg.to_name}`} value={leg.duration_min !== null && leg.duration_min !== undefined ? `${Math.round(leg.duration_min)} min` : '?'} />
                    ))}
                    <Row label="Monthly fare" value={gbp(active.transport.monthly_cost_gbp ?? 0)} />
                    {active.transport.ticket && <p className="pt-1 text-[10px] text-slate-500">{active.transport.ticket.name}</p>}
                  </Pillar>
                  <Pillar title="3. What we don't know" icon={<HelpCircle className="h-3.5 w-3.5 text-slate-400" />}>
                    <ul className="list-disc space-y-1 pl-4 text-[11px] text-slate-600">
                      {active.unknowns.map((u) => (
                        <li key={u}>{u}</li>
                      ))}
                    </ul>
                  </Pillar>
                </div>

                {active.compromises.length > 0 && (
                  <List icon={<AlertCircle className="h-3.5 w-3.5 text-amber-600" />} title="Trade-offs (what you give up)" items={active.compromises} tone="amber" />
                )}
              </div>
            </article>

            {/* Score breakdown and alternatives */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
                <h3 className="text-sm font-bold text-slate-900 sm:text-base">Why it scored {Math.round(active.score)}</h3>
                <p className="text-xs text-slate-500">Points each factor contributed, weighted by your priorities.</p>
                <div className="mt-3 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={active.score_breakdown.map((f) => ({ name: f.label, points: f.points, factor: f.factor }))}
                      layout="vertical"
                      margin={{ top: 5, right: 25, left: 10, bottom: 5 }}
                    >
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 11, fill: '#0f172a', fontWeight: 600 }} />
                      <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} points`, 'Contribution']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                      <Bar dataKey="points" radius={[0, 6, 6, 0]} isAnimationActive={false}>
                        {active.score_breakdown.map((f) => (
                          <Cell key={f.factor} fill={FACTOR_COLOURS[f.factor]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-2 space-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
                  {active.score_breakdown.map((f) => (
                    <li key={f.factor}>
                      <span className="font-semibold text-slate-800">{f.label}:</span> {f.explanation}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="mb-1 text-sm font-bold text-slate-900 sm:text-base">Ranked options</h3>
                <p className="mb-3 text-xs text-slate-500">Select one to inspect it.</p>
                <div className="space-y-2">
                  {data.ranked.map((c) => (
                    <button
                      key={c.candidate_id}
                      type="button"
                      onClick={() => setSelectedId(c.candidate_id)}
                      aria-pressed={c.candidate_id === active.candidate_id}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left transition ${
                        c.candidate_id === active.candidate_id
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="overflow-hidden pr-2">
                        <div className="truncate text-xs font-bold text-slate-900">
                          #{c.rank} {c.accommodation.residence_name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {c.accommodation.room_type} • {MODE_LABEL[c.transport.mode]}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xs font-extrabold text-slate-900">
                          {c.costs.monthly_total_gbp !== null && c.costs.monthly_total_gbp !== undefined ? gbp(c.costs.monthly_total_gbp) : '—'}/mo
                        </div>
                        <div className="text-[10px] text-slate-500">{Math.round(c.score)} pts</div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            </div>

            {/* Upfront checklist from the real cost components */}
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-slate-800" /> Cash needed before moving in
              </h3>
              <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                {active.costs.components
                  .filter((c) => c.category === 'upfront')
                  .map((c) => (
                    <div key={c.component_id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <span className="block text-[10px] font-bold uppercase text-slate-500">{c.label}</span>
                      <span className="text-base font-extrabold text-slate-900">{c.amount_gbp !== null && c.amount_gbp !== undefined ? gbp(c.amount_gbp) : 'Unknown'}</span>
                      {c.notes && <span className="mt-0.5 block text-[10px] text-slate-500">{c.notes}</span>}
                    </div>
                  ))}
                <div className="rounded-xl border border-slate-900 bg-slate-900 p-3 text-white">
                  <span className="block text-[10px] font-bold uppercase text-slate-400">Total upfront</span>
                  <span className="text-base font-extrabold">
                    {active.costs.upfront_total_gbp !== null && active.costs.upfront_total_gbp !== undefined ? gbp(active.costs.upfront_total_gbp) : 'Incomplete'}
                  </span>
                </div>
              </div>
            </section>
          </>
        )}

        {/* Next steps, eligibility and sources */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900">
              <ListChecks className="h-4 w-4 text-slate-800" /> Next steps
            </h3>
            <ol className="space-y-2 text-xs">
              {data.next_actions.map((a) => (
                <li key={a.title} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="font-semibold text-slate-900">{a.title}</span>
                  <p className="mt-0.5 text-slate-600">{a.detail}</p>
                  {a.url && (
                    <a href={a.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex items-center gap-1 font-semibold text-teal-700 hover:underline">
                      Official source <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </li>
              ))}
            </ol>
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-3 text-sm font-bold text-slate-900">Where these figures come from</h3>
            <ul className="space-y-2 text-xs">
              {data.sources.map((s) => (
                <SourceRow key={s.source_id} source={s} />
              ))}
            </ul>
          </section>
        </div>

        <Toast isOpen={toastOpen} message="Copied your plan to the clipboard." onClose={() => setToastOpen(false)} />
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ small pieces
function ChangeNote({ result }: { result: Extract<Result, { data: RecommendationResponse }> }) {
  const top = result.data.ranked[0];
  const prev = result.previousTop;
  if (!top) return <span className="font-semibold text-rose-700">No option meets your limits at this budget.</span>;
  if (!prev) return <span className="text-slate-500">{result.data.summary}</span>;
  if (prev.candidate_id === top.candidate_id) {
    return (
      <span className="text-slate-600">
        <Check className="mr-1 inline h-3.5 w-3.5 text-emerald-600" />
        Still the best fit: {top.accommodation.residence_name} ({top.accommodation.room_type}).
      </span>
    );
  }
  return (
    <span className="font-semibold text-teal-800">
      <Repeat className="mr-1 inline h-3.5 w-3.5" />
      Recommendation changed: {prev.accommodation.residence_name} ({MODE_LABEL[prev.transport.mode]}) →{' '}
      {top.accommodation.residence_name} ({MODE_LABEL[top.transport.mode]}).
    </span>
  );
}

function NoFeasible({ data }: { data: RecommendationResponse }) {
  return (
    <section className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
      <h2 className="text-lg font-bold text-rose-900">No option meets all of your limits</h2>
      <p className="mt-1 text-sm text-rose-800">{data.summary}</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-rose-800">
        {data.relaxation_suggestions.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-rose-700">{data.excluded.length} room options were checked and excluded.</p>
    </section>
  );
}

function Metric({ label, value, note, positive }: { label: string; value: string; note: string; positive?: boolean }) {
  return (
    <div className="card-hover-lift flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <div className={`text-2xl font-black sm:text-3xl ${positive ? 'text-emerald-700' : 'text-slate-900'}`}>{value}</div>
      <div className="mt-3 border-t border-slate-100 pt-2.5 text-[10px] text-slate-500">{note}</div>
    </div>
  );
}

function Pillar({ title, icon, link, children }: { title: string; icon: React.ReactNode; link?: { href: string; label: string }; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-4">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{title}</span>
          {icon}
        </div>
        <div className="space-y-1 text-xs">{children}</div>
      </div>
      {link && (
        <Link href={link.href} className="mt-3 inline-flex items-center gap-1 border-t border-slate-200/80 pt-2 text-xs font-bold text-slate-900 hover:underline">
          {link.label} <ArrowRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  );
}

function Row({ label, value, good }: { label: string; value: string; good?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-slate-500">{label}</span>
      <strong className={good ? 'text-emerald-700' : 'text-slate-800'}>{value}</strong>
    </div>
  );
}

function List({ icon, title, items, tone }: { icon: React.ReactNode; title: string; items: string[]; tone: 'slate' | 'amber' }) {
  if (tone === 'amber') {
    return (
      <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/90 p-5 shadow-sm">
        <div className="mb-2 flex items-center gap-2 text-base sm:text-lg font-black tracking-wide text-amber-950 uppercase">
          {icon} <span>{title}</span>
        </div>
        <ul className="space-y-2 text-xs sm:text-sm font-bold text-amber-900 pl-1">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-2 leading-snug">
              <span className="text-amber-600 font-black mt-0.5">•</span>
              <span>{i}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
      <div className="mb-1.5 flex items-center gap-1.5 font-bold text-slate-900">
        {icon} {title}
      </div>
      <ul className="list-disc space-y-1 pl-5 text-slate-600">
        {items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    </div>
  );
}

function SourceRow({ source }: { source: SourceStatus }) {
  const when = source.last_verified_at ?? source.retrieved_at;
  return (
    <li className="flex items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div>
        <a href={source.source_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:underline">
          {source.name}
        </a>
        {when && <p className="text-[10px] text-slate-500">Checked {new Date(when).toLocaleDateString('en-GB')}</p>}
      </div>
      <span className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[source.status] ?? ''}`}>
        {source.status}
      </span>
    </li>
  );
}
