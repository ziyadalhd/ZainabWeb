import Link from "next/link";

export function HomeInterestedSection() {
  return (
    <section id="interest" className="home-interest">
      <div className="page-shell home-interest__inner">
        <div>
          <p className="eyebrow">تسجيل الاهتمام</p>
          <h2>تابعي فعاليات بَيْن</h2>
          <p>سجّلي اهتمامكِ بالفعاليات القادمة. يمكنكِ إلغاء الاشتراك لاحقًا.</p>
        </div>
        <Link href="/surveys/interested-contact" className="button-primary">
          سجّلي اهتمامكِ <span aria-hidden="true">←</span>
        </Link>
      </div>
    </section>
  );
}
