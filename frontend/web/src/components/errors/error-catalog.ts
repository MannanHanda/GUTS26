// Copy and scene for every error the user can meet. Keys match the backend's
// `error.code` values (see docs/openapi.json), plus `offline` for when the
// backend cannot be reached at all.

export type ErrorKind =
  | 'not_found'
  | 'method_not_allowed'
  | 'validation_error'
  | 'provider_unavailable'
  | 'internal_error'
  | 'offline';

export type SceneVariant = 'lost' | 'signal' | 'barrier' | 'suspended' | 'failure' | 'offline';

export interface ErrorCopy {
  status: number | null;
  eyebrow: string;
  title: string;
  message: string;
  scene: SceneVariant;
  retryable: boolean;
}

export const ERROR_CATALOG: Record<ErrorKind, ErrorCopy> = {
  not_found: {
    status: 404,
    eyebrow: 'Not found',
    title: "This stop isn't on the line",
    message: "The page or record you asked for doesn't exist. The link may be mistyped, or the item may have moved.",
    scene: 'lost',
    retryable: false,
  },
  method_not_allowed: {
    status: 405,
    eyebrow: 'Method not allowed',
    title: 'Wrong way round the circle',
    message: "That action isn't supported at this address.",
    scene: 'signal',
    retryable: false,
  },
  validation_error: {
    status: 422,
    eyebrow: 'Check your details',
    title: "The ticket barrier didn't accept that",
    message: "Some of the details entered aren't valid. Fix the items below and try again.",
    scene: 'barrier',
    retryable: false,
  },
  provider_unavailable: {
    status: 503,
    eyebrow: 'Data source offline',
    title: 'Part of the line is suspended',
    message:
      "One of the sources behind this page couldn't be loaded. Rather than show figures we can't back up, we've paused this view.",
    scene: 'suspended',
    retryable: true,
  },
  internal_error: {
    status: 500,
    eyebrow: 'Something went wrong',
    title: 'Signal failure',
    message: "Something broke on our side and it has been logged. Please try again in a moment.",
    scene: 'failure',
    retryable: true,
  },
  offline: {
    status: null,
    eyebrow: 'No connection',
    title: "Can't reach Uniwise",
    message: "We couldn't connect to the server. Check your internet connection, or try again shortly.",
    scene: 'offline',
    retryable: true,
  },
};

/** Map a backend error code (or anything unexpected) to a known kind. */
export function toErrorKind(code: string | undefined | null): ErrorKind {
  return code && code in ERROR_CATALOG ? (code as ErrorKind) : 'internal_error';
}
