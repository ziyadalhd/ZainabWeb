"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { normalizeMfaCode } from "@/lib/auth/mfa";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

interface Enrollment {
  factorId: string;
  qrCode: string;
  secret: string;
}

export function MfaSetupForm() {
  const started = useRef(false);
  const [enrollment, setEnrollment] = useState<Enrollment>();
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let active = true;

    async function beginEnrollment() {
      const supabase = createSupabaseBrowserClient();
      const factors = await supabase.auth.mfa.listFactors();

      if (!active) return;
      if (factors.error) {
        setErrorMessage("تعذر بدء إعداد التحقق. أعيدي تسجيل الدخول ثم حاولي مرة أخرى.");
        return;
      }

      if (factors.data.totp.length > 0) {
        window.location.replace("/admin/mfa/verify");
        return;
      }

      const unfinishedFactors = factors.data.all.filter(
        (factor) => factor.factor_type === "totp" && factor.status === "unverified",
      );

      for (const factor of unfinishedFactors) {
        const removal = await supabase.auth.mfa.unenroll({ factorId: factor.id });
        if (removal.error) {
          if (active) setErrorMessage("تعذر إعادة بدء الإعداد. سجلي الخروج ثم ادخلي مرة أخرى.");
          return;
        }
      }

      const result = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "لوحة إدارة نادي بَيْن الثقافي",
      });

      if (!active) return;
      if (result.error) {
        setErrorMessage("تعذر إنشاء رمز الإعداد. حاولي مرة أخرى بعد تسجيل الدخول.");
        return;
      }

      setEnrollment({
        factorId: result.data.id,
        qrCode: result.data.totp.qr_code,
        secret: result.data.totp.secret,
      });
    }

    void beginEnrollment();
    return () => {
      active = false;
    };
  }, []);

  async function verifyEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment || isSubmitting) return;

    const normalizedCode = normalizeMfaCode(code);
    if (!/^\d{6}$/.test(normalizedCode)) {
      setErrorMessage("اكتبي الرمز المكوّن من 6 أرقام.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });

    if (challenge.error) {
      setErrorMessage("تعذر التحقق الآن. انتظري لحظة ثم حاولي مرة أخرى.");
      setIsSubmitting(false);
      return;
    }

    const verification = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: normalizedCode,
    });

    if (verification.error) {
      setErrorMessage("الرمز غير صحيح أو انتهت صلاحيته. اكتبي الرمز الحالي من التطبيق.");
      setIsSubmitting(false);
      return;
    }

    window.location.replace("/admin");
  }

  return (
    <form onSubmit={verifyEnrollment} className="form-surface mt-8 grid gap-5 p-5 sm:p-7">
      {errorMessage ? <p role="alert" className="notice-error">{errorMessage}</p> : null}
      {!enrollment && !errorMessage ? <p role="status" className="notice-info">جارٍ تجهيز رمز الإعداد…</p> : null}

      {enrollment ? (
        <>
          <ol className="grid gap-3 text-sm leading-7 text-[var(--color-text)]">
            <li><strong>١.</strong> افتحي تطبيق المصادقة على جوالك.</li>
            <li><strong>٢.</strong> امسحي الرمز المربع الظاهر أدناه.</li>
            <li><strong>٣.</strong> اكتبي الرمز المؤقت المكوّن من 6 أرقام.</li>
          </ol>

          <div className="mx-auto rounded-2xl border border-[var(--color-border)] bg-white p-3">
            <Image
              src={enrollment.qrCode}
              alt="رمز إعداد التحقق بخطوتين"
              width={224}
              height={224}
              unoptimized
              priority
            />
          </div>

          <details className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 text-sm">
            <summary className="cursor-pointer font-bold text-[var(--brand-forest)]">تعذر مسح الرمز؟</summary>
            <p className="mt-3 leading-6 muted-copy">أدخلي هذا المفتاح يدويًا داخل تطبيق المصادقة، ولا تشاركيه مع أي شخص.</p>
            <code dir="ltr" className="mt-3 block [overflow-wrap:anywhere] rounded-lg bg-white p-3 text-center font-mono text-sm text-[var(--color-text)]">
              {enrollment.secret}
            </code>
          </details>

          <label className="grid gap-2 font-bold">
            رمز التحقق
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
              aria-describedby="mfa-code-help"
            />
          </label>
          <p id="mfa-code-help" className="text-sm muted-copy">يتغير الرمز تلقائيًا كل فترة قصيرة.</p>
          <button type="submit" className="button-primary min-h-12 px-6 py-3" disabled={isSubmitting}>
            {isSubmitting ? "جارٍ التحقق…" : "تفعيل التحقق بخطوتين"}
          </button>
        </>
      ) : null}
    </form>
  );
}
