import Image from "next/image";
import type { FormEvent } from "react";

export interface Enrollment {
  factorId: string;
  name: string;
  qrCode: string;
  secret: string;
}

interface MfaEnrollmentFormProps {
  enrollment: Enrollment | undefined;
  deviceName: string;
  code: string;
  busyAction: "enroll" | "verify" | "cancel" | "remove" | undefined;
  onDeviceNameChange: (value: string) => void;
  onCodeChange: (value: string) => void;
  onBeginEnrollment: (event: FormEvent<HTMLFormElement>) => void;
  onVerifyEnrollment: (event: FormEvent<HTMLFormElement>) => void;
  onCancelEnrollment: () => void;
}

export function MfaEnrollmentForm({
  enrollment,
  deviceName,
  code,
  busyAction,
  onDeviceNameChange,
  onCodeChange,
  onBeginEnrollment,
  onVerifyEnrollment,
  onCancelEnrollment,
}: MfaEnrollmentFormProps) {
  const busy = Boolean(busyAction);

  return (
    <section className="card-surface p-5 sm:p-7" aria-labelledby="add-mfa-device-heading">
      <h2 id="add-mfa-device-heading" className="text-xl font-bold text-[var(--brand-forest)]">
        إضافة جهاز جديد
      </h2>
      <p className="mt-2 text-sm leading-6 muted-copy">سمّي الجهاز باسم واضح مثل «جوالي الجديد» أو «الجهاز الاحتياطي».</p>

      {!enrollment ? (
        <form onSubmit={onBeginEnrollment} className="mt-5 grid gap-4 sm:max-w-xl">
          <label className="grid gap-2 font-medium">
            اسم الجهاز
            <input
              className="field-control font-normal"
              value={deviceName}
              onChange={(event) => onDeviceNameChange(event.target.value)}
              maxLength={80}
              autoComplete="off"
              required
            />
          </label>
          <button type="submit" className="button-primary min-h-12 px-6 py-3 sm:justify-self-start" disabled={busy}>
            {busyAction === "enroll" ? "جارٍ تجهيز الجهاز…" : "متابعة إضافة الجهاز"}
          </button>
        </form>
      ) : (
        <form onSubmit={onVerifyEnrollment} className="mt-6 grid gap-5">
          <p className="notice-info">امسحي الرمز من تطبيق المصادقة على «{enrollment.name}»، ثم اكتبي الرمز المؤقت للتأكد من نجاح الإعداد.</p>
          <div className="mx-auto rounded-2xl border border-[var(--color-border)] bg-white p-3">
            <Image src={enrollment.qrCode} alt={`رمز إعداد ${enrollment.name}`} width={224} height={224} unoptimized />
          </div>
          <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
            <summary className="cursor-pointer font-bold text-[var(--brand-forest)]">تعذر مسح الرمز؟</summary>
            <p className="mt-3 leading-6 muted-copy">أدخلي هذا المفتاح يدويًا، ولا تشاركيه مع أي شخص.</p>
            <code dir="ltr" className="mt-3 block [overflow-wrap:anywhere] rounded-lg bg-white p-3 text-center font-mono text-sm text-[var(--color-text)]">
              {enrollment.secret}
            </code>
          </details>
          <label className="grid gap-2 font-medium sm:max-w-sm">
            رمز الجهاز الجديد
            <input
              className="field-control text-center font-normal tracking-[0.35em]"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              dir="ltr"
              value={code}
              onChange={(event) => onCodeChange(event.target.value)}
              maxLength={6}
              required
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button type="submit" className="button-primary min-h-12 px-6 py-3" disabled={busy}>
              {busyAction === "verify" ? "جارٍ التحقق…" : "تفعيل الجهاز الجديد"}
            </button>
            <button type="button" className="button-quiet min-h-12 px-6 py-3" disabled={busy} onClick={onCancelEnrollment}>
              {busyAction === "cancel" ? "جارٍ الإلغاء…" : "إلغاء الإعداد"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
