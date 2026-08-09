"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const minimumPasswordLength = 12;

export function ResetPasswordForm() {
  const [isRecoverySession, setIsRecoverySession] = useState(false);
  const [isCheckingRecovery, setIsCheckingRecovery] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    let mounted = true;
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" && session) setIsRecoverySession(true);
      setIsCheckingRecovery(false);
    });

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsRecoverySession(Boolean(data.session));
      setIsCheckingRecovery(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < minimumPasswordLength) {
      setMessage("استخدمي كلمة مرور من 12 حرفًا على الأقل.");
      return;
    }
    if (password !== confirmation) {
      setMessage("كلمتا المرور غير متطابقتين.");
      return;
    }

    setIsSubmitting(true);
    setMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage("تعذر تعيين كلمة المرور. اطلبي رابط استعادة جديدًا واستخدمي أحدث رسالة فقط.");
      setIsSubmitting(false);
      return;
    }

    await supabase.auth.signOut({ scope: "others" });
    await supabase.auth.signOut();
    window.location.assign("/admin/login?success=password-reset");
  }

  if (isCheckingRecovery) {
    return <p role="status" className="mt-8 rounded-2xl bg-[var(--surface)] px-4 py-3 font-bold text-[var(--brand-green-deep)]">جارٍ التحقق من رابط الاستعادة…</p>;
  }

  if (!isRecoverySession) {
    return <p role="alert" className="mt-8 rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 font-bold text-[var(--color-error-text)]">رابط الاستعادة غير صالح أو انتهت صلاحيته. اطلبي رسالة استعادة جديدة ثم افتحي أحدث رابط.</p>;
  }

  return (
    <form onSubmit={submit} className="mt-8 grid gap-5 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
      {message ? <p role="alert" className="rounded-2xl bg-[var(--color-error-bg)] px-4 py-3 font-bold text-[var(--color-error-text)]">{message}</p> : null}
      <label className="grid gap-2 font-bold">كلمة المرور الجديدة<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" dir="ltr" minLength={minimumPasswordLength} required /></label>
      <label className="grid gap-2 font-bold">تأكيد كلمة المرور<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="new-password" dir="ltr" minLength={minimumPasswordLength} required /></label>
      <button className="rounded-2xl bg-[var(--brand-green)] px-6 py-3 font-extrabold text-white disabled:opacity-60" type="submit" disabled={isSubmitting}>{isSubmitting ? "جارٍ الحفظ…" : "حفظ كلمة المرور"}</button>
    </form>
  );
}
