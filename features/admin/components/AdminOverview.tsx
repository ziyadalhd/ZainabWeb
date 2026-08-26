import Link from "next/link";
import type { AdminServiceRequest, Event, Registration } from "@/lib/domain/types";
import { StatCard } from "@/components/ui/StatCard";
import { formatArabicDateTime, formatArabicEventDate, formatArabicEventTimeRange, formatArabicNumber, formatSeatCapacity } from "@/lib/format/date";

interface AttentionItem {
  id: string;
  title: string;
  description: string;
  href: string;
  tone: "urgent" | "warning" | "neutral";
}

function withinHours(value: string, now: number, hours: number) {
  const timestamp = new Date(value).getTime();
  return timestamp >= now && timestamp <= now + hours * 60 * 60 * 1000;
}

function withinPreviousHours(value: string, now: number, hours: number) {
  const timestamp = new Date(value).getTime();
  return timestamp <= now && timestamp >= now - hours * 60 * 60 * 1000;
}

export function AdminOverview({ events, registrations, requests, now }: { events: readonly Event[]; registrations: readonly Registration[]; requests: readonly AdminServiceRequest[]; now: number }) {
  const upcomingEvents = events
    .filter((event) => event.publicationStatus !== "archived" && new Date(event.startsAt).getTime() >= now)
    .sort((first, second) => new Date(first.startsAt).getTime() - new Date(second.startsAt).getTime());
  const nextEvent = upcomingEvents[0] ?? null;
  const registered = registrations.filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt).getTime() >= now).length;
  const waitlisted = registrations.filter((registration) => (registration.status === "waitlisted" || registration.status === "invited") && new Date(registration.eventStartsAt).getTime() >= now).length;
  const upcomingUnpaid = registrations.filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt).getTime() >= now && registration.priceHalalasAtBooking > 0 && registration.paymentStatus === "unpaid").length;
  const newRequests = requests.filter((request) => request.status === "new" && !request.contactedAt);
  const unconfirmedRegistrations = registrations.filter((registration) => registration.status === "registered" && new Date(registration.eventStartsAt).getTime() >= now && !registration.confirmationSentAt);
  const attention: AttentionItem[] = [
    ...unconfirmedRegistrations.map((registration) => ({ id: `confirmation-${registration.id}`, title: "تسجيل جديد يحتاج تأكيد واتساب", description: `${registration.attendeeName} — ${registration.eventTitle}`, href: "/admin/registrations?view=upcoming", tone: "urgent" as const })),
    ...newRequests.map((request) => ({ id: `request-${request.id}`, title: "طلب يحتاج تواصلًا", description: `${request.requesterName} — ${request.kind === "workshop_application" ? "طلب ورشة" : "طلب حجز مساحة"}`, href: "/admin/requests", tone: "urgent" as const })),
    ...events.filter((event) => event.publicationStatus === "draft" && (event.endsAt === null || event.priceHalalas === null)).map((event) => ({ id: `draft-${event.id}`, title: "مسودة غير جاهزة للنشر", description: `أكملي بيانات «${event.title}» قبل نشرها.`, href: `/admin/events/${event.id}/edit`, tone: "warning" as const })),
    ...upcomingEvents.filter((event) => event.activeReservationCount < event.capacity && registrations.some((registration) => registration.eventId === event.id && registration.status === "waitlisted")).map((event) => ({ id: `seat-${event.id}`, title: "مقعد متاح مع قائمة انتظار", description: `«${event.title}» لديها ${formatSeatCapacity(event.capacity - event.activeReservationCount)} متاحة. ادعي بديلة من مساحة التواصل.`, href: `/admin/events/${event.id}?tab=communications`, tone: "urgent" as const })),
    ...registrations.filter((registration) => registration.status === "invited" && registration.invitationExpiresAt && withinHours(registration.invitationExpiresAt, now, 24)).map((registration) => ({ id: `invite-${registration.id}`, title: "دعوة انتظار تنتهي قريبًا", description: `${registration.attendeeName} — ${registration.eventTitle}`, href: "/admin/registrations?view=waitlist", tone: "warning" as const })),
    ...upcomingEvents.filter((event) => withinHours(event.startsAt, now, 24) && registrations.some((registration) => registration.eventId === event.id && registration.status === "registered" && registration.latestReminderPreparedAt === null)).map((event) => ({ id: `reminder-${event.id}`, title: "تذكيرات قريبة لم تُجهّز", description: `فعالية «${event.title}» تبدأ خلال ٢٤ ساعة.`, href: "/admin/registrations?view=upcoming", tone: "urgent" as const })),
    ...(upcomingUnpaid > 0 ? [{ id: "payments", title: "دفعات تحتاج تسجيلًا", description: `${formatArabicNumber(upcomingUnpaid)} حجوزات مدفوعة لم يُسجّل دفعها بعد.`, href: "/admin/registrations?view=upcoming", tone: "neutral" as const }] : []),
  ].slice(0, 8);
  const recentActivity = [
    ...registrations.map((registration) => ({ id: `registration-${registration.id}`, timestamp: registration.createdAt, label: `تسجيل جديد: ${registration.attendeeName}`, detail: registration.eventTitle, href: "/admin/registrations?view=upcoming" })),
    ...requests.map((request) => ({ id: `request-${request.id}`, timestamp: request.createdAt, label: `طلب ${request.status === "new" ? "جديد" : "مُحدّث"}: ${request.requesterName}`, detail: request.kind === "workshop_application" ? "طلب ورشة" : "طلب حجز", href: "/admin/requests" })),
  ].filter((activity) => withinPreviousHours(activity.timestamp, now, 24 * 7)).sort((first, second) => new Date(second.timestamp).getTime() - new Date(first.timestamp).getTime()).slice(0, 5);
  const upcomingThirtyDays = upcomingEvents.filter((event) => withinHours(event.startsAt, now, 24 * 30));

  return (
    <div className="mt-8 grid gap-8">
      <section aria-label="شريط التشغيل" className="overview-ribbon">
        <div><p className="eyebrow">تشغيل اليوم</p><p className="mt-3 text-sm text-white/75">الوقت بتوقيت مكة المكرمة</p></div>
        {nextEvent ? <Link href={`/admin/events/${nextEvent.id}/edit`} className="overview-ribbon__event"><span>الفعالية التالية</span><strong>{nextEvent.title}</strong><small>{formatArabicEventDate(nextEvent.startsAt)} · {formatArabicEventTimeRange(nextEvent.startsAt, nextEvent.endsAt)}</small><small>{formatArabicNumber(nextEvent.activeReservationCount)} / {formatArabicNumber(nextEvent.capacity)} مسجلات</small></Link> : <div className="overview-ribbon__event"><span>الفعالية التالية</span><strong>لا توجد فعالية قادمة</strong><small>أضيفي فعالية جديدة لتظهر هنا.</small></div>}
        <Link href="/admin/events/new" className="button-primary border-white bg-white text-[var(--brand-forest)] hover:bg-[var(--brand-cream)]">فعالية جديدة</Link>
      </section>

        <section aria-labelledby="attention-heading">
        <div className="mb-4 flex items-end justify-between gap-4"><div><p className="eyebrow">قائمة التشغيل</p><h2 id="attention-heading" className="mt-2 text-2xl font-black text-[var(--brand-forest)]">يحتاج معالجة</h2></div><span className="data-value text-sm font-bold muted-copy">{formatArabicNumber(attention.length)} مهام</span></div>
        {attention.length ? <div className="grid gap-3 lg:grid-cols-2">{attention.map((item) => <Link key={item.id} href={item.href} className={`attention-item attention-item--${item.tone}`}><span className="attention-item__dot" aria-hidden="true" /><span><strong>{item.title}</strong><small>{item.description}</small></span><span aria-hidden="true">←</span></Link>)}</div> : <div className="card-surface px-5 py-6"><p className="font-bold">لا توجد مهام تحتاج معالجة الآن.</p><p className="mt-1 text-sm muted-copy">راجعي الجدول القادم أو أنشئي فعالية جديدة عند الحاجة.</p></div>}
      </section>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section aria-labelledby="schedule-heading"><div className="mb-4 flex items-end justify-between gap-4"><div><p className="eyebrow">السبعة أيام القادمة</p><h2 id="schedule-heading" className="mt-2 text-2xl font-black text-[var(--brand-forest)]">الجدول القادم</h2></div><Link href="/admin/events?view=calendar" className="button-quiet">التقويم</Link></div><div className="card-surface divide-y divide-[var(--color-border)]">{upcomingEvents.filter((event) => withinHours(event.startsAt, now, 24 * 7)).length ? upcomingEvents.filter((event) => withinHours(event.startsAt, now, 24 * 7)).map((event) => <Link key={event.id} href={`/admin/events/${event.id}/edit`} className="agenda-item"><time>{formatArabicEventDate(event.startsAt)}<small>{formatArabicEventTimeRange(event.startsAt, event.endsAt)}</small></time><span><strong>{event.title}</strong><small>{event.eventTypeLabel} · {formatArabicNumber(event.activeReservationCount)} / {formatArabicNumber(event.capacity)} مسجلات</small></span><span aria-hidden="true">←</span></Link>) : <p className="px-5 py-7 text-sm muted-copy">لا توجد فعاليات خلال الأيام السبعة القادمة.</p>}</div></section>
        <section aria-labelledby="activity-heading"><div className="mb-4"><p className="eyebrow">آخر ٧ أيام</p><h2 id="activity-heading" className="mt-2 text-2xl font-black text-[var(--brand-forest)]">النشاط الأخير</h2></div><div className="card-surface divide-y divide-[var(--color-border)]">{recentActivity.length ? recentActivity.map((activity) => <Link key={activity.id} href={activity.href} className="activity-item"><span><strong>{activity.label}</strong><small>{activity.detail}</small></span><time>{formatArabicDateTime(activity.timestamp)}</time></Link>) : <p className="px-5 py-7 text-sm muted-copy">لا يوجد نشاط خلال الأيام السبعة الماضية.</p>}</div></section>
      </div>

      <details className="card-surface overflow-hidden">
        <summary className="cursor-pointer px-5 py-4 font-black text-[var(--brand-forest)]">عرض الملخص التشغيلي</summary>
        <div aria-label="مؤشرات التشغيل" className="grid gap-px border-t border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="فعاليات خلال ٣٠ يومًا" value={formatArabicNumber(upcomingThirtyDays.length)} note="تشمل المسودات والمنشورة غير المؤرشفة" />
          <StatCard label="حجوزات فعّالة قادمة" value={formatArabicNumber(registered)} note={`${formatArabicNumber(waitlisted)} بانتظار مقعد`} />
          <StatCard label="طلبات جديدة" value={formatArabicNumber(newRequests.length)} note="طلبات الحجز والورش فقط" />
          <StatCard label="مقاعد في أقرب فعالية" value={nextEvent ? formatArabicNumber(Math.max(0, nextEvent.capacity - nextEvent.activeReservationCount)) : "—"} note={nextEvent ? nextEvent.title : "لا توجد فعالية قادمة"} />
        </div>
      </details>
    </div>
  );
}
