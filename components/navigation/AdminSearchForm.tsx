interface AdminSearchFormProps {
  className?: string;
  inputClassName?: string;
  id?: string;
}

export function AdminSearchForm({ className, inputClassName, id = "admin-global-search" }: AdminSearchFormProps) {
  return (
    <form action="/admin/search" className={className}>
      <label className="sr-only" htmlFor={id}>
        ابحثي عن فعالية أو طلب أو تسجيل
      </label>
      <input id={id} name="q" type="search" placeholder="ابحثي عن فعالية أو طلب أو تسجيل…" className={inputClassName} />
    </form>
  );
}
