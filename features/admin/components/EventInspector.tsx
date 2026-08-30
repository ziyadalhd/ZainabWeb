import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AudienceChip } from "@/features/admin/components/AudienceChip";
import { EventCommunicationsWorkspace } from "@/features/admin/components/EventCommunicationsWorkspace";
import { EventInspectorTabs, type InspectorTab } from "@/features/admin/components/EventInspectorTabs";
import { EventReminderTemplateForm } from "@/features/admin/components/EventReminderTemplateForm";
import { EventSettingsSection } from "@/features/admin/components/EventSettingsSection";
import { LifecycleBadge } from "@/features/admin/components/LifecycleBadge";
import { RegistrationTable, type RegistrationTableActions } from "@/features/admin/components/RegistrationTable";
import type { EventStatusAction } from "@/features/admin/components/EventStatusQuickActions";
import { AdminEventFeedbackTable } from "@/features/surveys/components/AdminEventFeedbackTable";
import { capacityRatio, capacityTone } from "@/features/admin/capacity";
import { eventLifecycle } from "@/features/admin/event-lifecycle";
import { summariseEventRevenue } from "@/features/admin/event-revenue";
import type { AdminEventFeedbackResponse, Event, ManualMessageRecord, Registration } from "@/lib/domain/types";
import {
  formatArabicEventDate,
  formatArabicEventTimeRange,
  formatArabicNumber,
  formatEventPrice,
  isSameRiyadhDate,
} from "@/lib/format/date";

interface EventInspectorProps {
  event: Event;
  registered: readonly Registration[];
  waitlist: readonly Registration[];
  allRegistrations: readonly Registration[];
  feedback: readonly AdminEventFeedbackResponse[] | null;
  manualMessages: readonly ManualMessageRecord[] | null;
  eventTemplate: string | null;
  globalTemplate: string | null;
  now: string;
  selectedRegistrationId?: string;
  registrationActions: RegistrationTableActions;
  statusAction: EventStatusAction;
}

/** Seats left, floored at zero — an over-subscribed event reports "full", never a negative count. */
function seatsRemaining(event: Event): number {
  return Math.max(0, event.capacity - event.activeReservationCount);
}

function CapacityCard({ event }: { event: Event }) {
  const ratio = capacityRatio(event.activeReservationCount, event.capacity);
  const tone = capacityTone(ratio);
  const remaining = seatsRemaining(event);
  const label = `${formatArabicNumber(event.activeReservationCount)} من ${formatArabicNumber(event.capacity)} مقعدًا محجوزة`;

  return (
    <section className="event-inspector__card" aria-label="السعة">
      <p className="event-inspector__card-label">السعة</p>
      <p className="event-inspector__card-value numeral">
        {formatArabicNumber(event.activeReservationCount)} / {formatArabicNumber(event.capacity)}
      </p>
      <div className="event-inspector__meter" role="img" aria-label={label}>
        <div
          className={`event-inspector__meter-fill${tone === "warn" ? " event-inspector__meter-fill--warn" : ""}${
            tone === "full" ? " event-inspector__meter-fill--full" : ""
          }`}
          style={{ inlineSize: `${Math.round(ratio * 100)}%` }}
        />
      </div>
      <p className="event-inspector__card-note">
        {remaining === 0 ? "اكتمل العدد" : `${formatArabicNumber(remaining)} مقعدًا متاحًا`}
      </p>
    </section>
  );
}

function RevenueCard({ event, registered }: { event: Event; registered: readonly Registration[] }) {
  const { expectedHalalas, paidInFullCount, outstandingCount } = summariseEventRevenue(event, registered);

  return (
    <section className="event-inspector__card" aria-label="الإيرادات">
      <p className="event-inspector__card-label">الإيرادات المتوقعة</p>
      <p className="event-inspector__card-value numeral">{formatEventPrice(expectedHalalas)}</p>
      <p className="event-inspector__card-note">
        سدّدت بالكامل {formatArabicNumber(paidInFullCount)} · متبقٍ {formatArabicNumber(outstandingCount)}
      </p>
    </section>
  );
}

function MetadataCard({ event }: { event: Event }) {
  return (
    <section className="event-inspector__card" aria-label="بيانات الفعالية">
      <p className="event-inspector__card-label">بيانات الفعالية</p>
      <dl className="event-inspector__meta">
        <div className="event-inspector__meta-row">
          <dt>الفئة</dt>
          <dd>
            <AudienceChip audience={event.audience} />
          </dd>
        </div>
        <div className="event-inspector__meta-row">
          <dt>النوع</dt>
          <dd>{event.eventTypeLabel || "—"}</dd>
        </div>
        <div className="event-inspector__meta-row">
          <dt>سعر المقعد</dt>
          <dd className="numeral">{formatEventPrice(event.priceHalalas)}</dd>
        </div>
        <div className="event-inspector__meta-row">
          <dt>التسجيل</dt>
          <dd>
            <StatusBadge status={event.registrationStatus} />
          </dd>
        </div>
      </dl>
    </section>
  );
}

export function EventInspector({
  event,
  registered,
  waitlist,
  allRegistrations,
  feedback,
  manualMessages,
  eventTemplate,
  globalTemplate,
  now,
  selectedRegistrationId,
  registrationActions,
  statusAction,
}: EventInspectorProps) {
  const nowDate = new Date(now);
  const lifecycle = eventLifecycle(event, nowDate);
  const isEventDay = isSameRiyadhDate(event.startsAt, nowDate) && event.publicationStatus !== "cancelled";
  const remaining = seatsRemaining(event);
  const registrationHrefs = Object.fromEntries(
    allRegistrations.map((registration) => [registration.id, `/admin/events?event=${event.id}&id=${registration.id}`]),
  );

  const tabs: InspectorTab[] = [
    {
      id: "roster",
      label: "قائمة الحضور والتسجيلات",
      count: formatArabicNumber(registered.length),
      lede: "اختاري مسجِّلة لعرض بياناتها، وسجّلي الحضور أو حالة الدفع من لوحة التفاصيل.",
      content: (
        <RegistrationTable
          registrations={registered}
          mode="current"
          selectedId={selectedRegistrationId}
          registrationHrefs={registrationHrefs}
          actions={registrationActions}
        />
      ),
    },
    {
      id: "waitlist",
      label: "قائمة الانتظار",
      count: formatArabicNumber(waitlist.length),
      lede:
        remaining === 0
          ? "اكتمل العدد. ستتاح الدعوات فور إلغاء أحد المقاعد."
          : `${formatArabicNumber(remaining)} مقعدًا متاحًا — ادعي من قائمة الانتظار من قسم التواصل.`,
      content: (
        <RegistrationTable
          registrations={waitlist}
          mode="waitlist"
          selectedId={selectedRegistrationId}
          registrationHrefs={registrationHrefs}
          actions={registrationActions}
        />
      ),
    },
    {
      id: "communications",
      label: "التواصل والتذكير",
      lede: "جهّزي رسائل واتساب اليدوية وتابعي ما أُرسل منها.",
      content: manualMessages ? (
        <>
          <EventCommunicationsWorkspace
            event={event}
            registrations={allRegistrations}
            messages={manualMessages}
            reminderTemplate={eventTemplate ?? globalTemplate}
            now={now}
          />
          <EventReminderTemplateForm eventId={event.id} eventTemplate={eventTemplate} globalTemplate={globalTemplate} />
        </>
      ) : (
        <LoadErrorNotice description="تعذر تحميل سجلّ الرسائل لهذه الفعالية." />
      ),
    },
    {
      id: "feedback",
      label: "التقييمات",
      content: feedback ? <AdminEventFeedbackTable responses={feedback} /> : <LoadErrorNotice description="تعذر تحميل التقييمات." />,
    },
    {
      id: "settings",
      label: "الإعدادات",
      content: <EventSettingsSection event={event} statusAction={statusAction} />,
    },
  ];

  return (
    <div className="event-inspector">
      <header className="event-inspector__header">
        <div className="event-inspector__identity">
          <div>
            <p className="eyebrow">مساحة الفعالية</p>
            <h2 id="event-panel-title" className="event-inspector__title">
              {event.title}
            </h2>
            <p className="event-inspector__when">
              {formatArabicEventDate(event.startsAt)} · {formatArabicEventTimeRange(event.startsAt, event.endsAt)}
            </p>
          </div>
          <div className="event-inspector__quick-actions">
            {isEventDay ? (
              <Link href={`/admin/events/${event.id}/live`} className="button-primary">
                بدء وضع اليوم
              </Link>
            ) : null}
            <Link href={`/admin/events/${event.id}/edit`} className="button-secondary">
              تحرير الفعالية
            </Link>
            <Link href={`/admin/registrations?event=${event.id}`} className="button-quiet">
              كل التسجيلات
            </Link>
          </div>
        </div>
        <div className="event-inspector__badges">
          <LifecycleBadge lifecycle={lifecycle} />
          <StatusBadge status={event.publicationStatus} />
          <AudienceChip audience={event.audience} />
        </div>
      </header>

      {event.publicationStatus === "cancelled" ? (
        <section className="notice-error p-5" aria-label="إشعار إلغاء الفعالية">
          <h3 className="font-bold">الفعالية ملغاة</h3>
          <p className="mt-2">
            {formatArabicNumber(registered.length)} مسجّلات متأثرات. أرسلي الإشعار الموحد من قسم التواصل والتذكير.
          </p>
        </section>
      ) : null}

      <div className="event-inspector__layout">
        <div className="event-inspector__main">
          <EventInspectorTabs tabs={tabs} label="أقسام الفعالية" />
        </div>
        <aside className="event-inspector__rail" aria-label="ملخص الفعالية">
          <CapacityCard event={event} />
          <RevenueCard event={event} registered={registered} />
          <MetadataCard event={event} />
        </aside>
      </div>
    </div>
  );
}
