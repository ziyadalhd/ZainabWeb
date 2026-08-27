import Link from "next/link";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RegistrationTable, type RegistrationTableActions } from "@/features/admin/components/RegistrationTable";
import { EventCommunicationsWorkspace } from "@/features/admin/components/EventCommunicationsWorkspace";
import { EventReminderTemplateForm } from "@/features/admin/components/EventReminderTemplateForm";
import { EventSettingsSection } from "@/features/admin/components/EventSettingsSection";
import { AdminEventFeedbackTable } from "@/features/surveys/components/AdminEventFeedbackTable";
import type { EventStatusAction } from "@/features/admin/components/EventStatusQuickActions";
import type { AdminEventFeedbackResponse, Event, ManualMessageRecord, Registration } from "@/lib/domain/types";
import { formatArabicEventDate, formatArabicEventTimeRange, formatArabicNumber, formatEventPrice, isSameRiyadhDate } from "@/lib/format/date";

interface EventWorkspaceContentProps {
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

const sections = [
  { id: "registrations", label: "المسجلات" },
  { id: "waitlist", label: "قائمة الانتظار" },
  { id: "communications", label: "التواصل" },
  { id: "feedback", label: "التقييمات" },
  { id: "settings", label: "الإعدادات" },
] as const;

export function EventWorkspaceContent({
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
}: EventWorkspaceContentProps) {
  const isEventDay = isSameRiyadhDate(event.startsAt, new Date(now)) && event.publicationStatus !== "cancelled";
  const registrationHref = (registration: Registration) => `/admin/events?event=${event.id}&id=${registration.id}`;

  return (
    <div className="event-panel__content">
      <header className="event-panel__header">
        <div>
          <p className="eyebrow">مساحة الفعالية</p>
          <h2 id="event-panel-title" className="mt-1 text-2xl font-black text-[var(--brand-forest)]">
            {event.title}
          </h2>
          <p className="mt-1 text-sm muted-copy">
            {formatArabicEventDate(event.startsAt)} · {formatArabicEventTimeRange(event.startsAt, event.endsAt)}
          </p>
        </div>
        {isEventDay ? (
          <Link href={`/admin/events/${event.id}/live`} className="button-primary">
            بدء وضع اليوم
          </Link>
        ) : null}
      </header>

      <div className="workspace-status mt-4">
        <StatusBadge status={event.publicationStatus} />
        <StatusBadge status={event.registrationStatus} />
        <span>
          {formatArabicNumber(event.activeReservationCount)} / {formatArabicNumber(event.capacity)} مقاعد محجوزة
        </span>
        <span>{formatEventPrice(event.priceHalalas)}</span>
      </div>

      <nav aria-label="أقسام الفعالية" className="event-panel__section-nav mt-5">
        {sections.map((section) => (
          <a key={section.id} href={`#event-section-${section.id}`}>
            {section.label}
          </a>
        ))}
      </nav>

      {event.publicationStatus === "cancelled" ? (
        <section className="notice-error mt-6 p-5" aria-label="إشعار إلغاء الفعالية">
          <h3 className="font-black">الفعالية ملغاة</h3>
          <p className="mt-2">{formatArabicNumber(registered.length)} مسجّلات متأثرات. أرسلي الإشعار الموحد من قسم التواصل أدناه.</p>
        </section>
      ) : null}

      <section id="event-section-registrations" className="event-panel__section mt-8">
        <h3 className="event-panel__section-title">المسجلات</h3>
        <RegistrationTable
          registrations={registered}
          mode="current"
          selectedId={selectedRegistrationId}
          registrationHref={registrationHref}
          actions={registrationActions}
        />
      </section>

      <section id="event-section-waitlist" className="event-panel__section mt-8">
        <h3 className="event-panel__section-title">قائمة الانتظار</h3>
        <RegistrationTable
          registrations={waitlist}
          mode="waitlist"
          selectedId={selectedRegistrationId}
          registrationHref={registrationHref}
          actions={registrationActions}
        />
      </section>

      <section id="event-section-communications" className="event-panel__section mt-8">
        <h3 className="event-panel__section-title">التواصل</h3>
        {manualMessages ? (
          <div className="grid gap-6">
            <EventCommunicationsWorkspace
              event={event}
              registrations={allRegistrations}
              messages={manualMessages}
              reminderTemplate={eventTemplate ?? globalTemplate}
              now={now}
            />
            <EventReminderTemplateForm eventId={event.id} eventTemplate={eventTemplate} globalTemplate={globalTemplate} />
          </div>
        ) : (
          <LoadErrorNotice description="تعذر تحميل سجلّ الرسائل لهذه الفعالية." />
        )}
      </section>

      <section id="event-section-feedback" className="event-panel__section mt-8">
        <h3 className="event-panel__section-title">التقييمات</h3>
        {feedback ? <AdminEventFeedbackTable responses={feedback} /> : <LoadErrorNotice description="تعذر تحميل التقييمات." />}
      </section>

      <section id="event-section-settings" className="event-panel__section mt-8">
        <h3 className="event-panel__section-title">الإعدادات</h3>
        <EventSettingsSection event={event} statusAction={statusAction} />
      </section>
    </div>
  );
}
