"use client";

import { useState, type FormEvent } from "react";
import { normalizeMfaCode } from "@/lib/auth/mfa";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function MfaVerifyForm() {
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const normalizedCode = normalizeMfaCode(code);
    if (!/^\d{6}$/.test(normalizedCode)) {
      setErrorMessage("اكتبي الرمز المكوّن من 6 أرقام.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const factors = await supabase.auth.mfa.listFactors();
    const factor = factors.data?.totp?.find((f) => f.status === "verified") ?? factors.data?.totp?.[0];

    if (factors.error || !factor || factor.status !== "verified") {
      window.location.replace("/admin/mfa/setup");
      return;
    }

    const challenge = await supabase.auth.mfa.challenge({ factorId: factor.id });
    if (challenge.error) {
      setErrorMessage("تعذر بدء التحقق. انتظري لحظة ثم حاولي مرة أخرى.");
      setIsSubmitting(false);
      return;
    }

    const verification = await supabase.auth.mfa.verify({
      factorId: factor.id,
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
    <form onSubmit={verifyCode} className="form-surface mt-8 grid gap-5 p-5 sm:p-7">
      {errorMessage ? <p role="alert" className="notice-error">{errorMessage}</p> : null}
      <label className="grid gap-2 font-bold">
        الرمز من تطبيق المصادقة
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
      <p className="text-sm leading-6 muted-copy">افتحي تطبيق المصادقة واكتبي الرمز الحالي المكوّن من 6 أرقام.</p>
      <button type="submit" className="button-primary min-h-12 px-6 py-3" disabled={isSubmitting}>
        {isSubmitting ? "جارٍ التحقق…" : "التحقق والدخول"}
      </button>
    </form>
  );
}
