import Link from "next/link";
import { CalendarMonthGrid } from "@/features/admin/components/CalendarMonthGrid";
import { Overlay } from "@/features/admin/components/Overlay";
import type { CalendarItem } from "@/features/admin/calendar-items";

const monthFormatter = new Intl.DateTimeFormat("ar-SA-u-ca-gregory", { month: "long", year: "numeric", timeZone: "Asia/Riyadh" });

interface CalendarOverlayProps {
  closeHref: string;
  calendarItems: readonly CalendarItem[];
  month: Date;
  monthHrefPrevious: string;
  monthHrefNext: string;
  monthHrefCurrent: string;
}

export function CalendarOverlay({ closeHref, calendarItems, month, monthHrefPrevious, monthHrefNext, monthHrefCurrent }: CalendarOverlayProps) {
  return (
    <Overlay
      closeHref={closeHref}
      label="التقويم الكامل"
      className="calendar-overlay"
      bodyClassName="calendar-overlay__body"
      closeButtonClassName="calendar-overlay__close"
      closeLabel="إغلاق التقويم"
      headerClassName="calendar-overlay__header"
      headerContent={
        <div className="calendar-overlay__header-main">
          <h2 className="calendar-overlay__title">{monthFormatter.format(month)}</h2>
          <nav aria-label="التنقل بين أشهر التقويم" className="calendar-overlay__nav">
            <Link className="button-quiet" href={monthHrefPrevious}>
              السابق
            </Link>
            <Link className="button-secondary" href={monthHrefCurrent}>
              الحالي
            </Link>
            <Link className="button-quiet" href={monthHrefNext}>
              التالي
            </Link>
          </nav>
        </div>
      }
    >
      <CalendarMonthGrid items={calendarItems} month={month} showTitle={false} />
    </Overlay>
  );
}
