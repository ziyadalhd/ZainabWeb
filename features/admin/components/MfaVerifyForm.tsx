"use client";

import { useEffect, useState, type FormEvent } from "react";
import { normalizeMfaCode } from "@/lib/auth/mfa";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function MfaVerifyForm() {
  const [factors, setFactors] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedFactorId, setSelectedFactorId] = useState("");
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState<string>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadFactors() {
      const supabase = createSupabaseBrowserClient();
      const result = await supabase.auth.mfa.listFactors();
      if (!active) return;

      if (result.error) {
        setErrorMessage("تعذر تحميل أجهزة التحقق. أعيدي تسجيل الدخول ثم حاولي مرة أخرى.");
        setIsLoading(false);
        return;
      }

      const verifiedFactors = result.data.totp.map((factor, index) => ({
        id: factor.id,
        name: factor.friendly_name?.trim() || `تطبيق المصادقة ${index + 1}`,
      }));

      if (verifiedFactors.length === 0) {
        window.location.replace("/admin/mfa/setup");
        return;
      }

      setFactors(verifiedFactors);
      setSelectedFactorId(verifiedFactors[0].id);
      setIsLoading(false);
    }

    void loadFactors();
    return () => {
      active = false;
    };
  }, []);

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
    const factor = factors.find((item) => item.id === selectedFactorId);
    if (!factor) {
      window.location.replace("/admin/mfa/setup");
      return;
    }

    const supabase = createSupabaseBrowserClient();
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
      {isLoading ? <p role="status" className="notice-info">جارٍ تحميل أجهزة التحقق…</p> : null}
      {factors.length > 1 ? (
        <fieldset className="grid gap-3">
          <legend className="font-bold">اختاري جهاز التحقق</legend>
          {factors.map((factor) => (
            <label key={factor.id} className="flex cursor-pointer items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-3 font-bold">
              <input
                type="radio"
                name="mfa-factor"
                value={factor.id}
                checked={selectedFactorId === factor.id}
                onChange={() => setSelectedFactorId(factor.id)}
              />
              {factor.name}
            </label>
          ))}
        </fieldset>
      ) : null}
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
      <button type="submit" className="button-primary min-h-12 px-6 py-3" disabled={isLoading || isSubmitting || !selectedFactorId}>
        {isSubmitting ? "جارٍ التحقق…" : "التحقق والدخول"}
      </button>
    </form>
  );
}
