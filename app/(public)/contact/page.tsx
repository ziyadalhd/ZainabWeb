import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = { title: "التواصل" };

export default function ContactPage() {
  return (
    <main className="page-shell section-space">
      <PageHeader eyebrow="ابقَ على تواصل" title="التواصل" />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        <section className="card-surface p-6">
          <p className="text-sm font-bold muted-copy">رقم التواصل</p>
          <p className="mt-3 text-2xl font-extrabold text-[var(--brand-green-deep)]" dir="ltr">0537918640</p>
        </section>
        <section className="card-surface p-6" aria-label="تيك توك">
          <p className="text-lg font-extrabold text-[var(--brand-green-deep)]">TikTok</p>
          <p className="mt-3 muted-copy">سيُضاف الرابط بعد اعتماده.</p>
        </section>
        <section className="card-surface p-6" aria-label="إنستغرام">
          <p className="text-lg font-extrabold text-[var(--brand-green-deep)]">Instagram</p>
          <p className="mt-3 muted-copy">سيُضاف الرابط بعد اعتماده.</p>
        </section>
      </div>
    </main>
  );
}
