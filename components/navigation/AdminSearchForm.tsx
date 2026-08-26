interface AdminSearchFormProps {
  className?: string;
  inputClassName?: string;
  id?: string;
}

export function AdminSearchForm({ className, inputClassName, id = "admin-global-search" }: AdminSearchFormProps) {
  return (
    <form action="/admin/registrations" className={className}>
      <input type="hidden" name="view" value="upcoming" />
      <label className="sr-only" htmlFor={id}>
        ابحثي عن مسجلة بالاسم أو الجوال أو رقم المرجع
      </label>
      <input id={id} name="q" type="search" placeholder="ابحثي عن مسجلة…" className={inputClassName} />
    </form>
  );
}
