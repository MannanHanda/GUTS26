'use client'; // Error boundaries must be Client Components

import { useEffect } from 'react';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import { useOnlineStatus } from '@/components/errors/useOnlineStatus';

// Catches errors thrown while rendering any page below the root layout.
// Named RouteError so it does not shadow the global Error used below.
export default function RouteError({ error, retry }: { error: unknown; retry: () => void }) {
  const online = useOnlineStatus();

  useEffect(() => {
    console.error(error);
  }, [error]);

  const digest =
    error instanceof Error && 'digest' in error && typeof error.digest === 'string' ? error.digest : undefined;

  return <ErrorScreen kind={online ? 'internal_error' : 'offline'} onRetry={retry} reference={digest} />;
}
