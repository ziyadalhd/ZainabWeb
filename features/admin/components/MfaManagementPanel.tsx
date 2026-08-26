"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { normalizeMfaCode } from "@/lib/auth/mfa";
import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface ManagedFactor {
  id: string;
  name: string;
  createdAt: string;
}

interface Enrollment {
  factorId: string;
  name: string;
  qrCode: string;
  secret: string;
}

async function listVerifiedFactors(): Promise<ManagedFactor[]> {
  const supabase = createSupabaseBrowserClient();
  const result = await supabase.auth.mfa.listFactors();
  if (result.error) throw result.error;

  return result.data.totp.map((factor, index) => ({
    id: factor.id,
    name: factor.friendly_name?.trim() || `تطبيق المصادقة ${index + 1}`,
    createdAt: factor.created_at,
  }));
}

export function MfaManagementPanel() {
  const [factors, setFactors] = useState<ManagedFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceName, setDeviceName] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment>();
  const [code, setCode] = useState("");
  const [confirmingRemovalId, setConfirmingRemovalId] = useState<string>();
  const [busyAction, setBusyAction] = useState<"enroll" | "verify" | "cancel" | "remove">();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    let active = true;

    void listVerifiedFactors()
      .then((nextFactors) => {
        if (active) setFactors(nextFactors);
      })
      .catch(() => {
        if (active) setErrorMessage("تعذر تحميل أجهزة التحقق. حدّثي الصفحة وحاولي مرة أخرى.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function beginEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction || enrollment) return;

    const friendlyName = deviceName.trim();
    if (friendlyName.length < 2 || friendlyName.length > 80) {
      setErrorMessage("اكتبي اسمًا واضحًا للجهاز من حرفين إلى 80 حرفًا.");
      return;
    }

    setBusyAction("enroll");
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const existing = await supabase.auth.mfa.listFactors();

    if (existing.error) {
      setErrorMessage("تعذر بدء إضافة الجهاز. حدّثي الصفحة وحاولي مرة أخرى.");
      setBusyAction(undefined);
      return;
    }

    const unfinishedFactors = existing.data.all.filter(
      (factor) => factor.factor_type === "totp" && factor.status === "unverified",
    );

    for (const factor of unfinishedFactors) {
      const removal = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (removal.error) {
        setErrorMessage("تعذر تنظيف محاولة إعداد سابقة. سجلي الخروج ثم ادخلي مرة أخرى.");
        setBusyAction(undefined);
        return;
      }
    }

    const result = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });

    if (result.error) {
      setErrorMessage("تعذر إنشاء رمز الجهاز الجديد. حاولي مرة أخرى بعد لحظة.");
      setBusyAction(undefined);
      return;
    }

    setEnrollment({
      factorId: result.data.id,
      name: friendlyName,
      qrCode: result.data.totp.qr_code,
      secret: result.data.totp.secret,
    });
    setBusyAction(undefined);
  }

  async function verifyEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment || busyAction) return;

    const normalizedCode = normalizeMfaCode(code);
    if (!/^\d{6}$/.test(normalizedCode)) {
      setErrorMessage("اكتبي الرمز المكوّن من 6 أرقام.");
      return;
    }

    setBusyAction("verify");
    setErrorMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });

    if (challenge.error) {
      setErrorMessage("تعذر بدء التحقق. انتظري لحظة ثم حاولي مرة أخرى.");
      setBusyAction(undefined);
      return;
    }

    const verification = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: normalizedCode,
    });

    if (verification.error) {
      setErrorMessage("الرمز غير صحيح أو انتهت صلاحيته. اكتبي الرمز الحالي من الجهاز الجديد.");
      setBusyAction(undefined);
      return;
    }

    try {
      setFactors(await listVerifiedFactors());
      setEnrollment(undefined);
      setDeviceName("");
      setCode("");
      setSuccessMessage(`تمت إضافة «${enrollment.name}» بنجاح. يمكنك الآن إزالة الجهاز القديم عند الحاجة.`);
    } catch {
      setEnrollment(undefined);
      setErrorMessage("تمت إضافة الجهاز، لكن تعذر تحديث القائمة. حدّثي الصفحة لإظهاره.");
    } finally {
      setBusyAction(undefined);
    }
  }

  async function cancelEnrollment() {
    if (!enrollment || busyAction) return;

    setBusyAction("cancel");
    setErrorMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const removal = await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });

    if (removal.error) {
      setErrorMessage("تعذر إلغاء الإعداد الآن. حدّثي الصفحة قبل محاولة إضافة جهاز آخر.");
      setBusyAction(undefined);
      return;
    }

    setEnrollment(undefined);
    setDeviceName("");
    setCode("");
    setBusyAction(undefined);
  }

  async function removeFactor(factor: ManagedFactor) {
    if (busyAction) return;
    if (factors.length <= 1) {
      setErrorMessage("لا يمكن إزالة آخر جهاز تحقق. أضيفي جهازًا احتياطيًا أولًا.");
      setConfirmingRemovalId(undefined);
      return;
    }

    setBusyAction("remove");
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const removal = await supabase.auth.mfa.unenroll({ factorId: factor.id });

    if (removal.error) {
      setErrorMessage("تعذر إزالة الجهاز. أعيدي التحقق من الجلسة ثم حاولي مرة أخرى.");
      setBusyAction(undefined);
      return;
    }

    setConfirmingRemovalId(undefined);
    const refresh = await supabase.auth.refreshSession();
    if (refresh.error) {
      window.location.replace("/admin/mfa");
      return;
    }

    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error || assurance.data.currentLevel !== "aal2") {
      window.location.replace("/admin/mfa/verify");
      return;
    }

    try {
      setFactors(await listVerifiedFactors());
      setSuccessMessage(`تمت إزالة «${factor.name}».`);
      setBusyAction(undefined);
    } catch {
      window.location.replace("/admin/settings?tab=security");
    }
  }

  return (
    <div className="mt-8 grid max-w-4xl gap-6">
      {errorMessage ? <p role="alert" className="notice-error">{errorMessage}</p> : null}
      {successMessage ? <p role="status" className="notice-success">{successMessage}</p> : null}

      <section className="card-surface p-5 sm:p-7" aria-labelledby="mfa-devices-heading">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 id="mfa-devices-heading" className="text-xl font-black text-[var(--brand-forest)]">أجهزة التحقق المسجلة</h2>
            <p className="mt-2 text-sm leading-6 muted-copy">احتفظي بجهازين على الأقل حتى لا تفقدي الوصول عند تغيير الجوال.</p>
          </div>
          {!isLoading ? <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-sm font-bold">{formatArabicNumber(factors.length)} جهاز</span> : null}
        </div>

        {isLoading ? <p role="status" className="notice-info mt-5">جارٍ تحميل الأجهزة…</p> : null}
        {!isLoading && factors.length === 0 ? <p role="alert" className="notice-error mt-5">لا يوجد جهاز موثّق. سجلي الخروج وابدئي إعداد التحقق من جديد.</p> : null}

        {factors.length > 0 ? (
          <ul className="mt-6 grid gap-3">
            {factors.map((factor) => (
              <li key={factor.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-[var(--brand-forest)]">{factor.name}</p>
                    <p className="mt-1 text-xs muted-copy">أُضيف في {formatArabicDateTime(factor.createdAt)}</p>
                  </div>
                  {confirmingRemovalId !== factor.id ? (
                    <button
                      type="button"
                      className="button-danger min-h-10 px-3 py-2 text-sm"
                      disabled={factors.length <= 1 || Boolean(busyAction)}
                      onClick={() => setConfirmingRemovalId(factor.id)}
                      aria-describedby={factors.length <= 1 ? "last-factor-help" : undefined}
                    >
                      إزالة الجهاز
                    </button>
                  ) : (
                    <div className="max-w-md rounded-xl border border-[var(--color-danger)] bg-white p-4" role="group" aria-label={`تأكيد إزالة ${factor.name}`}>
                      <p className="text-sm font-bold">هل تريدين إزالة «{factor.name}»؟ لن تقبل رموزه بعد التأكيد.</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button type="button" className="button-danger min-h-10 px-3 py-2 text-sm" disabled={Boolean(busyAction)} onClick={() => void removeFactor(factor)}>
                          {busyAction === "remove" ? "جارٍ الإزالة…" : "تأكيد الإزالة"}
                        </button>
                        <button type="button" className="button-quiet min-h-10 px-3 py-2 text-sm" disabled={Boolean(busyAction)} onClick={() => setConfirmingRemovalId(undefined)}>تراجع</button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : null}

        {factors.length === 1 ? <p id="last-factor-help" className="notice-info mt-5">هذا هو جهاز التحقق الوحيد. أضيفي جهازًا جديدًا وفعّليه قبل إزالة هذا الجهاز.</p> : null}
      </section>

      <section className="card-surface p-5 sm:p-7" aria-labelledby="add-mfa-device-heading">
        <h2 id="add-mfa-device-heading" className="text-xl font-black text-[var(--brand-forest)]">إضافة جهاز جديد</h2>
        <p className="mt-2 text-sm leading-6 muted-copy">سمّي الجهاز باسم واضح مثل «جوالي الجديد» أو «الجهاز الاحتياطي».</p>

        {!enrollment ? (
          <form onSubmit={beginEnrollment} className="mt-5 grid gap-4 sm:max-w-xl">
            <label className="grid gap-2 font-bold">
              اسم الجهاز
              <input
                className="field-control font-normal"
                value={deviceName}
                onChange={(event) => setDeviceName(event.target.value)}
                maxLength={80}
                autoComplete="off"
                required
              />
            </label>
            <button type="submit" className="button-primary min-h-12 px-6 py-3 sm:justify-self-start" disabled={Boolean(busyAction)}>
              {busyAction === "enroll" ? "جارٍ تجهيز الجهاز…" : "متابعة إضافة الجهاز"}
            </button>
          </form>
        ) : (
          <form onSubmit={verifyEnrollment} className="mt-6 grid gap-5">
            <p className="notice-info">امسحي الرمز من تطبيق المصادقة على «{enrollment.name}»، ثم اكتبي الرمز المؤقت للتأكد من نجاح الإعداد.</p>
            <div className="mx-auto rounded-2xl border border-[var(--color-border)] bg-white p-3">
              <Image src={enrollment.qrCode} alt={`رمز إعداد ${enrollment.name}`} width={224} height={224} unoptimized />
            </div>
            <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
              <summary className="cursor-pointer font-bold text-[var(--brand-forest)]">تعذر مسح الرمز؟</summary>
              <p className="mt-3 leading-6 muted-copy">أدخلي هذا المفتاح يدويًا، ولا تشاركيه مع أي شخص.</p>
              <code dir="ltr" className="mt-3 block [overflow-wrap:anywhere] rounded-lg bg-white p-3 text-center font-mono text-sm text-[var(--color-text)]">{enrollment.secret}</code>
            </details>
            <label className="grid gap-2 font-bold sm:max-w-sm">
              رمز الجهاز الجديد
              <input
                className="field-control text-center font-normal tracking-[0.35em]"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                dir="ltr"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                maxLength={6}
                required
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button type="submit" className="button-primary min-h-12 px-6 py-3" disabled={Boolean(busyAction)}>
                {busyAction === "verify" ? "جارٍ التحقق…" : "تفعيل الجهاز الجديد"}
              </button>
              <button type="button" className="button-quiet min-h-12 px-6 py-3" disabled={Boolean(busyAction)} onClick={() => void cancelEnrollment()}>
                {busyAction === "cancel" ? "جارٍ الإلغاء…" : "إلغاء الإعداد"}
              </button>
            </div>
          </form>
        )}
      </section>

      <p className="notice-info">إذا فُقدت جميع الأجهزة، لا يوجد تجاوز من شاشة الدخول. يلزم استرداد يدوي موثوق من مالك مشروع Supabase، ثم تسجيل جهاز جديد.</p>
    </div>
  );
}
