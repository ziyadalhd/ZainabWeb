import { loginAction } from "@/app/(dashboard)/admin/actions";

export function LoginForm({ errorMessage }: { errorMessage?: string }) {
  return (
    <form action={loginAction} className="mt-8 grid gap-5 rounded-3xl border border-[var(--border)] bg-white p-6 shadow-[var(--shadow)] sm:p-8">
      {errorMessage ? <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 font-bold text-red-800">{errorMessage}</p> : null}
      <label className="grid gap-2 font-bold">البريد الإلكتروني<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="email" name="email" autoComplete="username" dir="ltr" required /></label>
      <label className="grid gap-2 font-bold">كلمة المرور<input className="rounded-2xl border border-[var(--border)] px-4 py-3 font-normal" type="password" name="password" autoComplete="current-password" dir="ltr" required /></label>
      <button className="rounded-2xl bg-[var(--brand-green)] px-6 py-3 font-extrabold text-white" type="submit">دخول المسؤول</button>
      <p className="text-sm muted-copy">لا يوجد تسجيل عام أو استعادة كلمة مرور من الموقع.</p>
    </form>
  );
}
