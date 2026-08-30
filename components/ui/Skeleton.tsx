/**
 * Loading placeholders for Suspense fallbacks. Built from the Classical surface tokens rather
 * than neutral greys so a streaming region reads as the page settling, not as a foreign widget.
 * Purely decorative: every block is `aria-hidden`, and the boundary that renders it is expected
 * to carry the `aria-busy` / label instead.
 */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`.trim()} />;
}

/** A stack of `lines` text bars, the last one short so it reads as a paragraph tail. */
export function SkeletonText({ lines = 3 }: { lines?: number }) {
  return (
    <div aria-hidden="true" className="grid gap-2">
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton key={index} className={`skeleton--text${index === lines - 1 ? " skeleton--text-short" : ""}`} />
      ))}
    </div>
  );
}

/** A bordered surface placeholder standing in for one card-sized region. */
export function SkeletonCard({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton-card ${className}`.trim()} />;
}
