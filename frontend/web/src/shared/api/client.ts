// Typed client for the Uniwise backend (/api/v1). Every figure shown to the user
// should come through here. There is deliberately no mock fallback: a failure
// raises an ApiError that the UI renders with <ErrorScreen kind={error.kind} />.
//

import { toErrorKind, type ErrorKind } from '@/components/errors/error-catalog';
import type {
  AccommodationList,
  AccommodationOption,
  BenefitList,
  ErrorDetail,
  HealthResponse,
  RecommendationRequest,
  RecommendationResponse,
  ResearchDataset,
  SourceStatus,
  TransportMode,
  TransportOptionList,
} from './types';

const TIMEOUT_MS = 10_000;

export class ApiError extends Error {
  constructor(
    /** Which error screen to show (matches the backend's `error.code`, or `offline`). */
    public readonly kind: ErrorKind,
    message: string,
    /** HTTP status, or null when the backend could not be reached. */
    public readonly status: number | null,
    /** Field-level problems for validation errors. */
    public readonly details: ErrorDetail[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function baseUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new ApiError('internal_error', 'NEXT_PUBLIC_API_URL is not set; the backend address is unknown.', null);
  }
  return url.replace(/\/+$/, '');
}

function query(params: Record<string, string | number | boolean | string[] | undefined>): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) value.forEach((v) => qs.append(key, v));
    else qs.append(key, String(value));
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
      signal: init.signal ?? AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Network failure, DNS error, CORS rejection or timeout: the backend was not reached.
    throw new ApiError('offline', 'Could not reach the Uniwise backend.', null);
  }

  if (!res.ok) {
    let body: { error?: { code?: string; message?: string; details?: ErrorDetail[] } } | undefined;
    try {
      body = await res.json();
    } catch {
      body = undefined; // non-JSON error body (e.g. a proxy page)
    }
    throw new ApiError(
      toErrorKind(body?.error?.code),
      body?.error?.message ?? `Request failed with status ${res.status}.`,
      res.status,
      body?.error?.details ?? [],
    );
  }
  return (await res.json()) as T;
}

export interface AccommodationFilters {
  ensuite?: boolean;
  accessible?: boolean;
  studio?: boolean;
  maxWeeklyRentGbp?: number;
  sort?: 'weekly_rent' | 'name';
}

export interface TransportQuery {
  accommodationId: string;
  campusId?: string;
  campusDaysPerWeek?: number;
  modes?: TransportMode[];
}

export const uniwiseApi = {
  health: () => request<HealthResponse>('/api/v1/health'),

  sources: () => request<SourceStatus[]>('/api/v1/sources/status'),

  benefits: () => request<BenefitList>('/api/v1/benefits'),

  research: (datasetId: string, signal?: AbortSignal) =>
    request<ResearchDataset>(`/api/v1/research/${encodeURIComponent(datasetId)}`, { signal }),

  accommodations: (f: AccommodationFilters = {}) =>
    request<AccommodationList>(
      `/api/v1/accommodations${query({
        ensuite: f.ensuite,
        accessible: f.accessible,
        studio: f.studio,
        max_weekly_rent_gbp: f.maxWeeklyRentGbp,
        sort: f.sort,
      })}`,
    ),

  accommodation: (id: string) => request<AccommodationOption>(`/api/v1/accommodations/${encodeURIComponent(id)}`),

  transportOptions: (q: TransportQuery) =>
    request<TransportOptionList>(
      `/api/v1/transport/options${query({
        accommodation_id: q.accommodationId,
        campus_id: q.campusId,
        campus_days_per_week: q.campusDaysPerWeek,
        modes: q.modes,
      })}`,
    ),

  recommend: (body: RecommendationRequest, signal?: AbortSignal) =>
    request<RecommendationResponse>('/api/v1/recommendations/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    }),
};
