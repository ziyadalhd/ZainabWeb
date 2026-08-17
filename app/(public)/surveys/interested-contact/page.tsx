import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";
import { submitInterestedContactAction } from "@/app/(public)/surveys/interested-contact/actions";
import { TurnstileField } from "@/features/security/components/TurnstileField";

export const metadata: Metadata = {
  title: "تسجيل المهتمين",
  description: "تسجيل الاهتمام بمعلومات الفعاليات القادمة من نادي بَيْن الثقافي.",
};

const errorMessages: Record<string, string> = {
  contactName: "اكتبي الاسم من حرفين إلى ١٢٠ حرفًا.",
  phone: "اكتبي رقم جوال سعودي صحيحًا.",
  email: "اكتبي بريدًا إلكترونيًا صحيحًا.",
  consent: "يلزم تحديد موافقتك لتسجيل اهتمامك بالفعاليات القادمة.",
  turnstile: "ما قدرنا نكمل التحقق. جرّبي مرة ثانية",
  invalid: "تعذر حفظ الطلب. تحققي من البيانات ثم حاولي مرة أخرى.",
  save: "تعذر حفظ الطلب الآن. حاولي مرة أخرى لاحقًا.",
};

export default async function InterestedContactPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="استبيانات" title="تسجيل المهتمين" description="سجلي اهتمامك لتصلك معلومات الفعاليات القادمة. يمكنك إلغاء الاشتراك في أي وقت." />
      <section className="form-surface mt-8 max-w-3xl p-5 sm:p-8">
        {error && errorMessages[error] ? <p role="alert" className="notice-error mb-6">{errorMessages[error]}</p> : null}
        <form action={submitInterestedContactAction} className="grid gap-5">
          <div className="grid gap-2">
            <label htmlFor="contact-name" className="font-extrabold text-[var(--brand-green-deep)]">الاسم</label>
            <input id="contact-name" name="contactName" required autoComplete="name" className="field-control" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-phone" className="font-extrabold text-[var(--brand-green-deep)]">رقم الجوال السعودي</label>
            <input id="contact-phone" name="phone" required type="tel" inputMode="tel" autoComplete="tel" placeholder="05xxxxxxxx" dir="ltr" className="field-control text-right" />
          </div>
          <div className="grid gap-2">
            <label htmlFor="contact-email" className="font-extrabold text-[var(--brand-green-deep)]">البريد الإلكتروني</label>
            <input id="contact-email" name="email" required type="email" inputMode="email" autoComplete="email" spellCheck={false} dir="ltr" className="field-control text-right" />
          </div>
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            data-lpignore="true"
            data-1p-ignore="true"
            data-form-type="other"
            className="sr-only"
            style={{ position: "absolute", left: "-9999px", width: "1px", height: "1px", opacity: 0, pointerEvents: "none" }}
          />
          <label className="flex items-start gap-3 border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm leading-7">
            <input name="upcomingEventsConsent" type="checkbox" className="mt-1 size-5 accent-[var(--brand-green)]" />
            <span>أوافق على أن يستخدم النادي بياناتي لإرسال معلومات الفعاليات القادمة. هذه الموافقة اختيارية وليست محددة مسبقًا، ويمكنني إلغاؤها لاحقًا.</span>
          </label>
          <TurnstileField />
          <button type="submit" className="button-primary min-h-12 px-5 py-3">تسجيل الاهتمام</button>
        </form>
      </section>
    </main>
  );
}
