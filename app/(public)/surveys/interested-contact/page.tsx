import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitInterestedContactAction } from "@/app/(public)/surveys/interested-contact/actions";

export const metadata: Metadata = { title: "تسجيل المهتمين" };

const errorMessages: Record<string, string> = {
  contactName: "اكتبي الاسم من حرفين إلى ١٢٠ حرفًا.",
  phone: "اكتبي رقم جوال سعودي صحيحًا.",
  email: "اكتبي بريدًا إلكترونيًا صحيحًا.",
  consent: "يلزم تحديد موافقتك لتسجيل اهتمامك بالفعاليات القادمة.",
  invalid: "تعذر حفظ الطلب. تحققي من البيانات ثم حاولي مرة أخرى.",
  save: "تعذر حفظ الطلب الآن. حاولي مرة أخرى لاحقًا.",
};

export default async function InterestedContactPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيانات" title="تسجيل المهتمين" description="سجلي اهتمامك لتصلك معلومات الفعاليات القادمة. يمكنك إلغاء الاشتراك في أي وقت برابط آمن." />
      <section className="card-surface mt-8 max-w-3xl p-6 sm:p-8">
        {error && errorMessages[error] ? <p role="alert" className="mb-6 rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 font-bold text-[var(--color-error-text)]">{errorMessages[error]}</p> : null}
        <form action={submitInterestedContactAction} className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="contact-name" className="font-extrabold text-[var(--brand-green-deep)]">الاسم</label>
            <input id="contact-name" name="contactName" required autoComplete="name" className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-phone" className="font-extrabold text-[var(--brand-green-deep)]">رقم الجوال السعودي</label>
            <input id="contact-phone" name="phone" required inputMode="tel" autoComplete="tel" placeholder="05xxxxxxxx" dir="ltr" className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-right" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-email" className="font-extrabold text-[var(--brand-green-deep)]">البريد الإلكتروني</label>
            <input id="contact-email" name="email" required type="email" autoComplete="email" dir="ltr" className="min-h-12 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-right" />
          </div>
          <input name="website" tabIndex={-1} autoComplete="off" className="sr-only" aria-hidden="true" />
          <label className="flex items-start gap-3 rounded-2xl bg-[var(--surface-soft)] p-4 text-sm leading-7">
            <input name="upcomingEventsConsent" type="checkbox" className="mt-1 size-5 accent-[var(--brand-green)]" />
            <span>أوافق على أن يستخدم النادي بياناتي لإرسال معلومات الفعاليات القادمة. هذه الموافقة اختيارية وليست محددة مسبقًا، ويمكنني إلغاؤها عبر الرابط الآمن.</span>
          </label>
          <button type="submit" className="min-h-12 rounded-2xl bg-[var(--brand-green)] px-5 py-3 font-extrabold text-white">تسجيل الاهتمام</button>
        </form>
      </section>
    </main>
  );
}
