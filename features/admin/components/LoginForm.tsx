"use client";

import { useState } from "react";
import { loginAction } from "@/app/(dashboard)/admin/actions";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({ errorMessage }: { errorMessage?: string }) {
  const [email, setEmail] = useState("");
  const [recoveryMessage, setRecoveryMessage] = useState<string>();
  const [isSendingRecovery, setIsSendingRecovery] = useState(false);

  async function requestRecovery() {
    if (!email.trim()) {
      setRecoveryMessage("اكتبي البريد الإلكتروني أولًا.");
      return;
    }

    setIsSendingRecovery(true);
    setRecoveryMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setRecoveryMessage("إذا كان البريد تابعًا لحساب مسؤول، أرسلنا رابط تغيير كلمة المرور إليه.");
    setIsSendingRecovery(false);
  }

  return (
    <form action={loginAction} className="mt-8 grid gap-5 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
      {errorMessage ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-800">{errorMessage}</p> : null}
      {recoveryMessage ? <p role="status" className="rounded-2xl bg-[var(--surface-soft)] px-4 py-3 font-bold text-[var(--brand-green-deep)]">{recoveryMessage}</p> : null}
      <label className="grid gap-2 font-bold">البريد الإلكتروني<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" dir="ltr" required /></label>
      <label className="grid gap-2 font-bold">كلمة المرور<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="password" name="password" autoComplete="current-password" dir="ltr" required /></label>
      <button className="rounded-2xl bg-[var(--brand-green)] px-6 py-3 font-extrabold text-white" type="submit">دخول المسؤول</button>
      <button className="rounded-2xl border border-[var(--brand-green)] px-6 py-3 font-extrabold text-[var(--brand-green)] disabled:opacity-60" type="button" onClick={requestRecovery} disabled={isSendingRecovery}>{isSendingRecovery ? "جارٍ إرسال الرابط…" : "إرسال رابط تغيير كلمة المرور"}</button>
      <p className="text-sm muted-copy">لا يوجد تسجيل عام في الموقع. رابط تغيير كلمة المرور مخصص للمسؤول فقط.</p>
    </form>
  );
}
