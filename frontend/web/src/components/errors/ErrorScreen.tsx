'use client';

import Link from 'next/link';
import { ArrowLeft, Home, RotateCcw } from 'lucide-react';
import { ERROR_CATALOG, type ErrorKind } from './error-catalog';
import { SubwayScene } from './SubwayScene';

export interface ErrorField {
  field?: string | null;
  message: string;
}

interface ErrorScreenProps {
  kind: ErrorKind;
  /** Field-level problems, shown for validation errors (backend `error.details`). */
  details?: ErrorField[];
  /** Shown when the error can be retried (e.g. Next.js `reset`, or re-running a request). */
  onRetry?: () => void;
  /** Opaque reference for support, e.g. Next.js error digest. */
  reference?: string;
}

export function ErrorScreen({ kind, details = [], onRetry, reference }: ErrorScreenProps) {
  const copy = ERROR_CATALOG[kind];

  return (
    <section
      role={kind === 'not_found' ? undefined : 'alert'}
      aria-labelledby="error-title"
      className="relative overflow-hidden px-4 py-16 sm:py-24"
    >
      {copy.status && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 select-none text-[9rem] font-black leading-none tracking-tighter text-slate-200/70 sm:text-[13rem]"
        >
          {copy.status}
        </span>
      )}

      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-10 md:flex-row md:gap-14 animate-fade-in">
        <div className="flex w-full max-w-[280px] shrink-0 justify-center">
          <SubwayScene variant={copy.scene} />
        </div>

        <div className="flex-1 text-center md:text-left">
          <p className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
            {copy.status ? `${copy.status} · ` : ''}
            {copy.eyebrow}
          </p>
          <h1 id="error-title" className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {copy.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-slate-600">{copy.message}</p>

          {details.length > 0 && (
            <ul className="mt-5 space-y-2 text-left">
              {details.map((d, i) => (
                <li
                  key={`${d.field ?? 'general'}-${i}`}
                  className="flex gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800"
                >
                  {d.field && <span className="font-mono font-semibold">{d.field}:</span>}
                  <span>{d.message}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-8 flex flex-wrap justify-center gap-3 md:justify-start">
            {copy.retryable && onRetry ? (
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try again
              </button>
            ) : (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Back to dashboard
              </Link>
            )}
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Home className="h-4 w-4" aria-hidden="true" />
              Home
            </Link>
          </div>

          <p className="mt-6 font-mono text-xs text-slate-400">
            error.code: {kind}
            {reference ? ` · ref ${reference}` : ''}
          </p>
        </div>
      </div>
    </section>
  );
}
