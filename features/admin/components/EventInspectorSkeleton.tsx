import { Skeleton, SkeletonCard } from "@/components/ui/Skeleton";

/**
 * The inspector's Suspense fallback. Mirrors the real layout — header, tab row, main column,
 * three-card rail — so the panel does not reflow when the data arrives.
 */
export function EventInspectorSkeleton() {
  return (
    <div className="event-inspector" aria-busy="true" aria-label="جارٍ تحميل مساحة الفعالية">
      <header className="event-inspector__header">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </header>
      <div className="event-inspector__layout">
        <div className="event-inspector__main">
          <div className="event-inspector__tabs">
            <Skeleton className="h-9 w-40" />
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-32" />
          </div>
          <SkeletonCard className="min-h-[24rem]" />
        </div>
        <div className="event-inspector__rail">
          <SkeletonCard className="min-h-[8rem]" />
          <SkeletonCard className="min-h-[7rem]" />
          <SkeletonCard className="min-h-[11rem]" />
        </div>
      </div>
    </div>
  );
}
