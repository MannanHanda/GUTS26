import type { Metadata } from 'next';
import { ErrorScreen } from '@/components/errors/ErrorScreen';

// Shown for notFound() calls and, at the app root, for every unmatched URL (HTTP 404).
export const metadata: Metadata = {
  title: 'Page not found | Uniwise',
};

export default function NotFound() {
  return <ErrorScreen kind="not_found" />;
}
