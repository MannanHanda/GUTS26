'use client';

import { useState } from 'react';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import { SubwayScene } from '@/components/errors/SubwayScene';
import { ERROR_CATALOG, type ErrorKind } from '@/components/errors/error-catalog';

// Gallery of every error state, for demos and design review. Not linked from the navigation.
const SAMPLE_DETAILS = [
  { field: 'profile.constraints.max_monthly_budget_gbp', message: 'Input should be greater than 0' },
  { field: 'profile.priorities', message: 'At least one priority must be greater than zero.' },
];

const KINDS = Object.keys(ERROR_CATALOG) as ErrorKind[];

export default function ErrorGallery() {
  const [kind, setKind] = useState<ErrorKind>('not_found');

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Every error has a plan</h1>
      <p className="mt-1 text-sm text-slate-600">
        Each backend error code maps to its own screen. Select one to see it full size.
      </p>

      <div role="tablist" aria-label="Error states" className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {KINDS.map((k) => {
          const copy = ERROR_CATALOG[k];
          const selected = kind === k;
          return (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setKind(k)}
              className={`flex flex-col items-center gap-2 rounded-xl border bg-white p-3 text-center transition card-hover-lift ${
                selected ? 'border-teal-600 ring-2 ring-teal-600/30' : 'border-slate-200'
              }`}
            >
              <span className="w-20">
                <SubwayScene variant={copy.scene} compact />
              </span>
              <span className="font-mono text-[11px] font-semibold text-slate-500">
                {copy.status ?? 'no status'} · {k}
              </span>
              <span className="text-xs font-semibold leading-snug text-slate-800">{copy.title}</span>
            </button>
          );
        })}
      </div>

      <div key={kind} role="tabpanel">
        <ErrorScreen
          kind={kind}
          details={kind === 'validation_error' ? SAMPLE_DETAILS : []}
          onRetry={() => setKind(kind)}
        />
      </div>
    </div>
  );
}
