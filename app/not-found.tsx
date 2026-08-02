import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell section-space text-center">
      <p className="eyebrow">٤٠٤</p>
      <h1 className="mt-3 text-4xl font-extrabold text-[var(--brand-green-deep)]">الصفحة غير موجودة</h1>
      <p className="mt-4 muted-copy">قد يكون الرابط قديمًا أو غير صحيح.</p>
      <Link href="/" className="mt-7 inline-flex rounded-full bg-[var(--brand-green)] px-6 py-3 font-bold text-[var(--brand-ivory)]">
        العودة إلى الرئيسية
      </Link>
    </main>
  );
}
