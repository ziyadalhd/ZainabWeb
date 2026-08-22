import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import { requireAdmin } from "@/lib/auth/require-admin";
import type { Registration } from "@/lib/domain/types";
import { formatArabicNumber } from "@/lib/format/date";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const metadata: Metadata = { title: "التسجيلات" };
export const dynamic = "force-dynamic";
export const revalidate = 0;

type RegistrationView = "upcoming" | "waitlist" | "previous";

const views: ReadonlyArray<{ id: RegistrationView; label: string; exportScope: "current" | "waitlist" | "previous" }> = [
  { id: "upcoming", label: "القادمة", exportScope: "current" },
  { id: "waitlist", label: "الانتظار والدعوات", exportScope: "waitlist" },
  { id: "previous", label: "السابقة والملغاة", exportScope: "previous" },
];

const successMessages: Record<string, string> = {
  cancel: "تم إلغاء التسجيل، ويمكن الآن اختيار بديلة من قائمة الانتظار.",
  confirm: "تم تأكيد الحضور.",
  "check-in": "تم حفظ حالة الحضور.",
  revoke: "تم سحب الدعوة وإعادة السجل إلى قائمة الانتظار.",
};

function getView(value: string | undefined): RegistrationView {
  return views.some((view) => view.id === value) ? value as RegistrationView : "upcoming";
}

const pageSize = 25;

function getPage(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function pageHref(view: RegistrationView, query: string, page: number): string {
  const params = new URLSearchParams({ view, page: String(page) });
  if (query) params.set("q", query);
  return `/admin/registrations?${params.toString()}`;
}

function registrationHref(registration: Registration, view: RegistrationView, query: string, page: number): string {
  const params = new URLSearchParams({ view, id: registration.id });
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));
  return `/admin/registrations?${params.toString()}`;
}

export default async function RegistrationsPage({ searchParams }: { searchParams: Promise<{ view?: string; id?: string; q?: string; page?: string; success?: string; error?: string }> }) {
  await requireAdmin();
  const { view: requestedView, id, q: requestedQuery, page: requestedPage, success, error } = await searchParams;
  const view = getView(requestedView);
  const query = requestedQuery?.trim() ?? "";
  const repository = await createAdminRegistrationRepository();
  const result = await repository.listPage({ view, query, page: getPage(requestedPage), pageSize, now: new Date().toISOString() });
  const registrations = result.items;
  const activeView = views.find((item) => item.id === view) ?? views[0];
  const actionMode = view === "upcoming" ? "current" : view;

  return (
    <main className="admin-page">
      <div className="flex flex-wrap items-end justify-between gap-5"><PageHeader eyebrow="التشغيل" title="التسجيلات" description="ابحثي في الحجوزات القادمة والانتظار والتسجيلات السابقة من مكان واحد." /><Link href={`/admin/registrations/export?scope=${activeView.exportScope}`} className="button-secondary">تنزيل القائمة المعروضة</Link></div>
      <nav aria-label="حالات التسجيل" className="workspace-tabs mt-7">{views.map((item) => <Link key={item.id} href={`/admin/registrations?view=${item.id}`} aria-current={item.id === view ? "page" : undefined} className={item.id === view ? "workspace-tab workspace-tab--active" : "workspace-tab"}>{item.label}</Link>)}</nav>
      <div className="mt-5 flex flex-wrap items-end justify-between gap-4"><form action="/admin/registrations" className="flex min-w-[min(100%,22rem)] flex-1 flex-wrap gap-2"><input type="hidden" name="view" value={view} /><label className="sr-only" htmlFor="registration-search">ابحثي في التسجيلات</label><input id="registration-search" name="q" defaultValue={query} placeholder="الاسم أو الجوال أو الفعالية أو المرجع" className="min-h-11 min-w-0 flex-1 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3" /><button type="submit" className="button-primary">بحث</button>{query ? <Link href={`/admin/registrations?view=${view}`} className="button-quiet">مسح</Link> : null}</form><p className="data-value text-sm font-bold muted-copy">{formatArabicNumber(result.total)} نتيجة</p></div>
      {success && successMessages[success] ? <p role="status" className="notice-success mt-5">{successMessages[success]}</p> : null}
      {error ? <p role="alert" className="notice-error mt-5">تعذر تنفيذ الإجراء. حدّثي الصفحة وحاولي مرة أخرى.</p> : null}
      <div className="mt-6"><RegistrationTable registrations={registrations} mode={actionMode} selectedId={id} registrationHref={(registration) => registrationHref(registration, view, query, result.page)} /></div>
      {result.total > pageSize ? <nav aria-label="ترقيم صفحات التسجيلات" className="mt-6 flex items-center justify-between gap-3"><p className="text-sm muted-copy">صفحة {formatArabicNumber(result.page)} من {formatArabicNumber(Math.ceil(result.total / pageSize))}</p><div className="flex gap-2">{result.page > 1 ? <Link className="button-secondary" href={pageHref(view, query, result.page - 1)}>السابقة</Link> : null}{result.page * pageSize < result.total ? <Link className="button-secondary" href={pageHref(view, query, result.page + 1)}>التالية</Link> : null}</div></nav> : null}
    </main>
  );
}
