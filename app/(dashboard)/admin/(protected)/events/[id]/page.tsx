import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LoadErrorNotice } from "@/components/ui/LoadErrorNotice";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { EventCommunicationsWorkspace } from "@/features/admin/components/EventCommunicationsWorkspace";
import { AdminEventFeedbackTable } from "@/features/surveys/components/AdminEventFeedbackTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import { formatArabicEventDate, formatArabicEventTimeRange, formatArabicNumber, formatEventPrice } from "@/lib/format/date";
import { createAdminEventFeedbackRepository } from "@/lib/supabase/event-feedback";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import { getEventRegistrationReminderTemplate, getRegistrationReminderTemplate } from "@/lib/supabase/message-templates";
import { registrationReminderTemplateTokens } from "@/lib/messaging/registration-reminder";
import { saveEventReminderTemplateAction } from "@/app/(dashboard)/admin/(protected)/messages/templates/actions";
import { changeEventStatusAction } from "@/app/(dashboard)/admin/(protected)/events/actions";
import { ConfirmActionForm } from "@/features/admin/components/ConfirmActionForm";

export const metadata: Metadata = { title: "مساحة الفعالية" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

type EventWorkspaceTab = "overview" | "registrations" | "waitlist" | "communications" | "feedback" | "settings";

const tabs: ReadonlyArray<{ id: EventWorkspaceTab; label: string }> = [
  { id: "overview", label: "الملخص" },
  { id: "registrations", label: "المسجلات" },
  { id: "waitlist", label: "قائمة الانتظار" },
  { id: "communications", label: "التواصل" },
  { id: "feedback", label: "التقييمات" },
  { id: "settings", label: "الإعدادات" },
];

function getTab(value: string | undefined): EventWorkspaceTab {
  return tabs.some((tab) => tab.id === value) ? value as EventWorkspaceTab : "overview";
}

export default async function EventWorkspacePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; success?: string; error?: string }> }) {
  await requireAdmin();
  const [{ id }, { tab: requestedTab, success, error }] = await Promise.all([params, searchParams]);
  const tab = getTab(requestedTab);
  const [eventRepository, registrationRepository, feedbackRepository] = await Promise.all([
    createAdminEventRepository(),
    createAdminRegistrationRepository(),
    createAdminEventFeedbackRepository(),
  ]);
  const event = await eventRepository.get(id);
  if (!event) notFound();

  const [registrationsOutcome, feedbackOutcome] = await Promise.all([
    registrationRepository.listForEvent(event.id),
    tab === "overview" || tab === "feedback" ? feedbackRepository.listSubmittedForEvent(event.id) : Promise.resolve({ ok: true as const, data: [] }),
  ]);
  const feedback = feedbackOutcome.ok ? feedbackOutcome.data : null;
  const activeTab = tabs.find((item) => item.id === tab) ?? tabs[0];

  if (!registrationsOutcome.ok) {
    return (
      <main className="admin-page">
        <nav aria-label="مسار التنقل" className="mb-5 text-sm font-bold muted-copy"><Link href="/admin/events" className="underline decoration-[var(--brand-olive)] underline-offset-4">الفعاليات</Link><span aria-hidden="true"> / </span><span>{event.title}</span></nav>
        <PageHeader eyebrow="مساحة الفعالية" title={event.title} description={`${formatArabicEventDate(event.startsAt)} · ${formatArabicEventTimeRange(event.startsAt, event.endsAt)}`} />
        <LoadErrorNotice description="تعذر تحميل تسجيلات هذه الفعالية. حدّثي الصفحة وحاولي مرة أخرى." />
      </main>
    );
  }

  const registrations = registrationsOutcome.data;
  const waitlist = registrations.filter((registration) => registration.status === "waitlisted" || registration.status === "invited");
  const registered = registrations.filter((registration) => registration.status === "registered");
  const [eventTemplate, globalTemplate, manualMessagesOutcome] = tab === "communications"
    ? await Promise.all([
        getEventRegistrationReminderTemplate(event.id),
        getRegistrationReminderTemplate(),
        registrationRepository.listManualMessagesForEvent(event.id),
      ])
    : [null, null, { ok: true as const, data: [] }];
  const manualMessages = manualMessagesOutcome.ok ? manualMessagesOutcome.data : null;

  return (
    <main className="admin-page">
      <nav aria-label="مسار التنقل" className="mb-5 text-sm font-bold muted-copy"><Link href="/admin/events" className="underline decoration-[var(--brand-olive)] underline-offset-4">الفعاليات</Link><span aria-hidden="true"> / </span><span>{event.title}</span></nav>
      <div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="مساحة الفعالية" title={event.title} description={`${formatArabicEventDate(event.startsAt)} · ${formatArabicEventTimeRange(event.startsAt, event.endsAt)}`} /><Link href={`/admin/events/${event.id}/edit`} className="button-primary">تعديل الفعالية</Link></div>
      <div className="workspace-status mt-6"><StatusBadge status={event.publicationStatus} /><StatusBadge status={event.registrationStatus} /><span>{formatArabicNumber(event.activeReservationCount)} / {formatArabicNumber(event.capacity)} مقاعد محجوزة</span><span>{formatEventPrice(event.priceHalalas)}</span></div>
      <nav aria-label="أقسام الفعالية" className="workspace-tabs mt-7">{tabs.map((item) => <Link key={item.id} href={`/admin/events/${event.id}?tab=${item.id}`} aria-current={item.id === tab ? "page" : undefined} className={item.id === tab ? "workspace-tab workspace-tab--active" : "workspace-tab"}>{item.label}</Link>)}</nav>
      <section className="mt-7" aria-labelledby="workspace-content-heading">
        <h2 id="workspace-content-heading" className="sr-only">{activeTab.label}</h2>
        {event.publicationStatus === "cancelled" && tab !== "communications" ? <section className="notice-error mb-6 max-w-3xl p-5" aria-label="إشعار إلغاء الفعالية"><h3 className="font-black">الفعالية ملغاة</h3><p className="mt-2">{formatArabicNumber(registered.length)} مسجّلات متأثرات. أرسلي الإشعار الموحد وسجّلي الإرسال من مساحة التواصل.</p><Link href={`/admin/events/${event.id}?tab=communications`} className="button-secondary mt-4">فتح إشعارات الإلغاء</Link></section> : null}
        {tab === "overview" ? <div className="grid gap-5 lg:grid-cols-3"><article className="card-surface p-5"><p className="eyebrow">التسجيلات</p><p className="mt-3 text-3xl font-black">{formatArabicNumber(registered.length)}</p><Link href={`/admin/events/${event.id}?tab=registrations`} className="mt-3 inline-block text-sm font-bold underline decoration-[var(--brand-amber)] underline-offset-4">مراجعة المسجلات</Link></article><article className="card-surface p-5"><p className="eyebrow">قائمة الانتظار</p><p className="mt-3 text-3xl font-black">{formatArabicNumber(waitlist.length)}</p><Link href={`/admin/events/${event.id}?tab=waitlist`} className="mt-3 inline-block text-sm font-bold underline decoration-[var(--brand-amber)] underline-offset-4">إدارة الانتظار</Link></article><article className="card-surface p-5"><p className="eyebrow">التقييمات</p><p className="mt-3 text-3xl font-black">{feedback ? formatArabicNumber(feedback.length) : "—"}</p><Link href={`/admin/events/${event.id}?tab=feedback`} className="mt-3 inline-block text-sm font-bold underline decoration-[var(--brand-amber)] underline-offset-4">عرض التقييمات</Link></article></div> : null}
        {tab === "registrations" ? <RegistrationTable registrations={registered} mode="current" /> : null}
        {tab === "waitlist" ? <RegistrationTable registrations={waitlist} mode="waitlist" /> : null}
        {tab === "communications" ? (manualMessages ? <div className="grid gap-6"><EventCommunicationsWorkspace event={event} registrations={registrations} messages={manualMessages} reminderTemplate={eventTemplate ?? globalTemplate} /><details className="message-history max-w-3xl"><summary>تخصيص قالب التذكير لهذه الفعالية</summary><form action={saveEventReminderTemplateAction.bind(null, event.id)} className="border-t border-[var(--color-border)] p-6"><p className="muted-copy">{eventTemplate ? "يُستخدم هذا التخصيص لهذه الفعالية فقط." : "يُستخدم القالب العام حاليًا حتى تحفظي تخصيصًا."}</p>{success === "template" ? <p className="notice-success mt-4">تم حفظ تخصيص الفعالية.</p> : null}{error === "template" ? <p role="alert" className="notice-error mt-4">تحققي من النص والمتغيرات المطلوبة.</p> : null}<label htmlFor="event-template-body" className="sr-only">نص القالب</label><textarea id="event-template-body" name="body" defaultValue={eventTemplate ?? globalTemplate ?? ""} rows={9} className="field-control mt-4 w-full" required /><p className="mt-3 text-sm muted-copy">المتغيرات المطلوبة: {registrationReminderTemplateTokens.join("، ")}</p><button type="submit" className="button-primary mt-5">حفظ تخصيص الفعالية</button></form></details></div> : <LoadErrorNotice description="تعذر تحميل سجلّ الرسائل لهذه الفعالية." />) : null}
        {tab === "feedback" ? (feedback ? <AdminEventFeedbackTable responses={feedback} /> : <LoadErrorNotice />) : null}
        {tab === "settings" ? <div className="grid max-w-2xl gap-5"><div className="card-surface p-6"><h3 className="text-xl font-black">إعدادات الفعالية</h3><p className="mt-3 muted-copy">عدّلي المحتوى والموعد والسعة وحالة التسجيل من صفحة الإعدادات.</p><Link href={`/admin/events/${event.id}/edit`} className="button-primary mt-5">تعديل الإعدادات</Link></div><div className="card-surface p-6"><h3 className="text-xl font-black">حالة النشر</h3><div className="mt-4 flex flex-wrap gap-2">{event.publicationStatus === "draft" && event.endsAt !== null && event.priceHalalas !== null ? <form action={changeEventStatusAction.bind(null, event.id, "published")}><button type="submit" className="button-primary">نشر الفعالية</button></form> : null}{event.publicationStatus !== "archived" ? <ConfirmActionForm action={changeEventStatusAction.bind(null, event.id, "archived")} label="أرشفة الفعالية" confirmation={`هل تريدين أرشفة «${event.title}»؟ ستختفي من الموقع العام.`} tone="quiet" /> : <form action={changeEventStatusAction.bind(null, event.id, "draft")}><button type="submit" className="button-secondary">إعادة إلى مسودة</button></form>}{event.publicationStatus === "published" ? <ConfirmActionForm action={changeEventStatusAction.bind(null, event.id, "cancelled")} label="إلغاء الفعالية" confirmation={`هل تريدين إلغاء «${event.title}»؟ ستتوقف التسجيلات وتبقى الفعالية محفوظة في السجل.`} tone="quiet" /> : null}</div></div></div> : null}
      </section>
    </main>
  );
}
