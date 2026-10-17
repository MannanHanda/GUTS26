import { TriangleAlert } from 'lucide-react';

// Marks pages whose figures come from the frontend's sample dataset rather than a verified backend source.
export function IllustrativeBanner({ topic }: { topic: string }) {
  return (
    <div role="note" className="border-b border-amber-200 bg-amber-50">
      <p className="mx-auto flex max-w-6xl items-start gap-2 px-4 py-2.5 text-xs text-amber-900 sm:px-6 lg:px-8">
        <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>
          <strong>Illustrative data.</strong> The {topic} figures on this page are sample values that have not been
          verified against official sources yet. Do not rely on them for decisions; check the provider directly.
        </span>
      </p>
    </div>
  );
}
