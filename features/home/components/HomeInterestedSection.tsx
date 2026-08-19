import { submitInterestedContactAction } from "@/app/(public)/surveys/interested-contact/actions";
import { TurnstileField } from "@/features/security/components/TurnstileField";

export function HomeInterestedSection() {
  return (
    <section className="border-t border-[var(--color-border)] bg-[var(--brand-cream)]/50">
      <div className="page-shell section-space">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow">خليكِ قريبة</p>
          <h2 className="mt-3 text-3xl font-black text-[var(--brand-forest)] sm:text-4xl">
            خليكِ قريبة من النادي
          </h2>
          <p className="mt-3 text-base text-[var(--brand-forest)]/80 sm:text-lg">
            سجّلي اهتمامكِ لتصلكِ معلومات الفعاليات والأنشطة القادمة من نادي بَيْن الثقافي فور فتح التسجيل.
          </p>

          <div className="form-surface mt-8 p-5 sm:p-8">
            <form action={submitInterestedContactAction} className="grid gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label htmlFor="home-contact-name" className="font-bold text-[var(--brand-green-deep)]">
                    الاسم
                  </label>
                  <input
                    id="home-contact-name"
                    name="contactName"
                    required
                    autoComplete="name"
                    className="field-control"
                    placeholder="اسمكِ الكريم"
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="home-contact-phone" className="font-bold text-[var(--brand-green-deep)]">
                    رقم الجوال السعودي
                  </label>
                  <input
                    id="home-contact-phone"
                    name="phone"
                    required
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="05xxxxxxxx"
                    dir="ltr"
                    className="field-control text-right"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <label htmlFor="home-contact-email" className="font-bold text-[var(--brand-green-deep)]">
                  البريد الإلكتروني
                </label>
                <input
                  id="home-contact-email"
                  name="email"
                  required
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  spellCheck={false}
                  dir="ltr"
                  className="field-control text-right"
                  placeholder="name@example.com"
                />
              </div>

              <label className="flex items-start gap-3 border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-xs leading-6 sm:text-sm">
                <input
                  name="upcomingEventsConsent"
                  type="checkbox"
                  className="mt-1 size-5 accent-[var(--brand-green)]"
                />
                <span>
                  أوافق على أن يستخدم النادي بياناتي لإرسال معلومات الفعاليات القادمة. هذه الموافقة اختيارية وليست محددة مسبقًا، ويمكنني إلغاؤها لاحقًا.
                </span>
              </label>

              <TurnstileField />

              <button type="submit" className="button-primary min-h-12 w-full px-5 py-3 sm:w-fit">
                سجّلي اهتمامكِ بالفعاليات
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
