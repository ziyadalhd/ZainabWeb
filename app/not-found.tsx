import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell section-space">
      <p className="eyebrow">٤٠٤</p>
      <h1 className="mt-3 text-4xl font-black text-[var(--brand-forest)]">الصفحة غير موجودة</h1>
      <p className="mt-4 muted-copy">قد يكون الرابط قديمًا أو غير صحيح.</p>
      <Link href="/" className="button-primary mt-7 px-6 py-3">
        العودة إلى الرئيسية
      </Link>
    </main>
  );
}
