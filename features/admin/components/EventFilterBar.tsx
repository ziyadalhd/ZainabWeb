import type { EventAudienceFilter, EventStatusFilter } from "@/features/admin/event-filters";
import { eventAudienceLabels } from "@/features/events/event-presentation";
import { formatArabicNumber } from "@/lib/format/date";

const statusLabels: Record<EventStatusFilter, string> = {
  all: "الكل",
  upcoming: "القادمة",
  live: "المباشرة الآن",
  draft: "المسودات",
  past: "المنتهية",
  archived: "المؤرشفة",
};

const audienceOrder: readonly EventAudienceFilter[] = ["all", "adults", "youth", "children"];
const audienceLabels: Record<EventAudienceFilter, string> = { all: "كل الفئات", ...eventAudienceLabels };

interface EventFilterBarProps {
  status: EventStatusFilter;
  audience: EventAudienceFilter;
  query: string;
  counts: Record<EventStatusFilter, number>;
  buildHref: (overrides: { status?: EventStatusFilter; audience?: EventAudienceFilter }) => string;
  searchAction: string;
}

export function EventFilterBar({ status, audience, query, counts, buildHref, searchAction }: EventFilterBarProps) {
  return (
    <div className="event-filter-bar mt-6">
      <nav aria-label="تصفية الفعاليات حسب الحالة" className="event-filter-seg">
        {(Object.keys(statusLabels) as EventStatusFilter[]).map((option) => (
          <a
            key={option}
            href={buildHref({ status: option })}
            aria-current={status === option ? "page" : undefined}
            className={status === option ? "event-filter-seg__option event-filter-seg__option--active" : "event-filter-seg__option"}
          >
            {statusLabels[option]}
            <span className="event-filter-seg__count">{formatArabicNumber(counts[option])}</span>
          </a>
        ))}
      </nav>
      <nav aria-label="تصفية الفعاليات حسب الفئة" className="event-filter-seg">
        {audienceOrder.map((option) => (
          <a
            key={option}
            href={buildHref({ audience: option })}
            aria-current={audience === option ? "page" : undefined}
            className={audience === option ? "event-filter-seg__option event-filter-seg__option--active" : "event-filter-seg__option"}
          >
            {audienceLabels[option]}
          </a>
        ))}
      </nav>
      <form action={searchAction} className="event-search">
        <label className="sr-only" htmlFor="event-search-query">
          ابحثي بعنوان الفعالية أو نوعها
        </label>
        <input
          id="event-search-query"
          name="q"
          type="search"
          defaultValue={query}
          placeholder="ابحثي بعنوان الفعالية أو نوعها…"
          className="field-control w-full"
        />
        <input type="hidden" name="status" value={status} />
        <input type="hidden" name="audience" value={audience} />
      </form>
    </div>
  );
}
