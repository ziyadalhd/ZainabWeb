interface LoadErrorNoticeProps {
  description?: string;
}

export function LoadErrorNotice({ description = "حدّثي الصفحة وحاولي مرة أخرى." }: LoadErrorNoticeProps) {
  return (
    <section role="alert" className="notice-error mt-8 px-5 py-6 sm:px-8">
      <h2 className="text-xl font-black">تعذر تحميل البيانات</h2>
      <p className="mt-2 max-w-2xl leading-7">{description}</p>
    </section>
  );
}
