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
    <form action={loginAction} className="form-surface mt-8 grid gap-5 p-5 sm:p-7">
      {errorMessage ? <p role="alert" className="notice-error">{errorMessage}</p> : null}
      {recoveryMessage ? <p role="status" aria-live="polite" className="notice-info">{recoveryMessage}</p> : null}
      <label className="grid gap-2 font-bold">البريد الإلكتروني<input className="field-control font-normal" type="email" name="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" spellCheck={false} dir="ltr" required /></label>
      <label className="grid gap-2 font-bold">كلمة المرور<input className="field-control font-normal" type="password" name="password" autoComplete="current-password" dir="ltr" required /></label>
      <button className="button-primary min-h-12 px-6 py-3" type="submit">دخول المسؤول</button>
      <button className="button-secondary min-h-12 px-6 py-3" type="button" onClick={requestRecovery} disabled={isSendingRecovery}>{isSendingRecovery ? "جارٍ إرسال الرابط…" : "إرسال رابط تغيير كلمة المرور"}</button>
      <p className="text-sm muted-copy">لا يوجد تسجيل عام في الموقع. رابط تغيير كلمة المرور مخصص للمسؤول فقط.</p>
    </form>
  );
}
