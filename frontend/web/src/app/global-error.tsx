'use client'; // Error boundaries must be Client Components

import { Inter } from 'next/font/google';
import { ErrorScreen } from '@/components/errors/ErrorScreen';
import './globals.css';

// Replaces the root layout when the layout itself fails, so it brings its own
// <html>, <body>, styles and font (the normal layout is not rendered).
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });

export default function GlobalError({ error, retry }: { error: unknown; retry: () => void }) {
  const digest =
    error instanceof Error && 'digest' in error && typeof error.digest === 'string' ? error.digest : undefined;

  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full bg-slate-50 font-sans text-slate-900">
        <title>Something went wrong | Uniwise</title>
        <main>
          <ErrorScreen kind="internal_error" onRetry={retry} reference={digest} />
        </main>
      </body>
    </html>
  );
}
