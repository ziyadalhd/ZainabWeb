import type { Metadata } from "next";
import Link from "next/link";
import { InterestedContactForm } from "@/features/surveys/components/InterestedContactForm";

export const metadata: Metadata = {
  title: "تسجيل الاهتمام",
  description: "سجّلي اهتمامكِ بالفعاليات القادمة من نادي بَيْن الثقافي.",
};

export default function InterestedContactPage() {
  return (
    <main className="page-shell section-space">
      <div className="mb-8 flex flex-wrap items-center gap-2 text-sm muted-copy">
        <Link href="/" className="underline-offset-4 hover:underline">
          الرئيسية
        </Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">تسجيل الاهتمام</span>
      </div>
      <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)] lg:items-start lg:gap-16">
        <header className="max-w-xl lg:sticky lg:top-28">
          <p className="eyebrow">خليكِ قريبة</p>
          <h1 className="page-title mt-4">لا يفوتكِ جديد بَيْن</h1>
          <p className="mt-5 text-base leading-8 muted-copy sm:text-lg">سجّلي اهتمامكِ بالفعاليات القادمة من نادي بَيْن الثقافي.</p>
          <p className="mt-8 border-s-4 border-[var(--brand-amber)] ps-4 text-sm leading-7 muted-copy">
            نستخدم بريدكِ لإرسال معلومات الفعاليات فقط، ويمكنكِ إلغاء الاشتراك متى شئتِ.
          </p>
        </header>
        <InterestedContactForm />
      </div>
    </main>
  );
}
