'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, ShieldCheck, TriangleAlert } from 'lucide-react';
import { ApiError, uniwiseApi } from '@shared/api/client';
import type { ResearchDataset, ResearchTable } from '@shared/api/types';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import { useSavedProfile } from '@/lib/stored-profile';
import { DEFAULT_STUDENT_PROFILE } from '@/lib/student-profile';

type Row = Record<string, string | null>;

type LoadState = { status: 'loading' } | { status: 'ready'; dataset: ResearchDataset } | { status: 'error'; error: ApiError };

// Fields shown on each provider card, in order. Names match the research workbook's column headers.
const CARD_FIELDS = [
  'Provider type',
  'Account types to compare',
  'Typical features / privileges',
  'Potential disadvantages',
  'International student suitability',
  'Monthly / account fees',
  'Overdraft / borrowing',
  'International transfers',
  'Cash / branches in Glasgow',
  'Best for (potential)',
];

function table(dataset: ResearchDataset, name: string): ResearchTable | undefined {
  return (dataset.tables ?? []).find((t) => t.name === name);
}

function isUrl(value: string | null | undefined): value is string {
  return !!value && /^https?:\/\//.test(value);
}

export default function BankingPage() {
  const profile = useSavedProfile() ?? DEFAULT_STUDENT_PROFILE;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    uniwiseApi
      .research('bank-accounts', controller.signal)
      .then((dataset) => setState({ status: 'ready', dataset }))
      .catch((err) => {
        if (controller.signal.aborted) return;
        setState({ status: 'error', error: err instanceof ApiError ? err : new ApiError('internal_error', String(err), null) });
      });
    return () => controller.abort();
  }, [attempt]);

  if (state.status === 'error') {
    return (
      <ErrorScreen
        kind={state.error.kind}
        details={state.error.details}
        onRetry={() => {
          setState({ status: 'loading' });
          setAttempt((a) => a + 1);
        }}
      />
    );
  }

  const dataset = state.status === 'ready' ? state.dataset : null;
  const providers: Row[] = dataset ? (table(dataset, 'Provider comparison')?.rows ?? []) : [];
  const checklist: Row[] = dataset ? (table(dataset, 'Verification checklist')?.rows ?? []) : [];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                Banking Module
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                • {profile.isInternational ? 'International Student Focus' : 'UK Domestic Student Focus'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Student Bank Account Research</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Providers and account types to compare. Terms change, so check each provider before you apply.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm transition self-start"
          >
            Back to Dashboard
          </Link>
        </div>

        <div role="note" className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
          <TriangleAlert className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold text-sm">Unverified research list</p>
            <p>
              These entries are research leads. Current terms, fees and eligibility have not been checked against each
              provider&apos;s website, so none of them is a recommendation.
            </p>
            {dataset && <p className="text-amber-800">{dataset.notes}</p>}
          </div>
        </div>

        {state.status === 'loading' && <p className="text-sm text-slate-500">Loading research data…</p>}

        {dataset && providers.length === 0 && (
          <p className="text-sm text-slate-500">No provider entries are available yet.</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((row, idx) => (
            <article key={`${row['Provider']}-${idx}`} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between">
              <div className="space-y-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Research lead</span>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">{row['Provider']}</h3>
                </div>
                <dl className="space-y-2 text-xs">
                  {CARD_FIELDS.filter((field) => row[field]).map((field) => (
                    <div key={field}>
                      <dt className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{field}</dt>
                      <dd className="text-slate-700 mt-0.5">{row[field]}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                <p className="text-[11px] text-slate-500">{row['Data confidence']}</p>
                {isUrl(row['Official account website']) && (
                  <a
                    href={row['Official account website']}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                  >
                    Official website <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>

        {checklist.length > 0 && (
          <section className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-slate-800" /> Questions to check with each provider
            </h2>
            <ul className="space-y-2 text-xs text-slate-600">
              {checklist.map((row, idx) => (
                <li key={`${row['Research area']}-${idx}`}>
                  <strong className="text-slate-900">{row['Research area']}:</strong> {row['Question to answer']}
                  {row['Evidence / method'] && <span className="text-slate-500"> ({row['Evidence / method']})</span>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
