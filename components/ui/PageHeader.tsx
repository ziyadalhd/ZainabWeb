interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="max-w-4xl border-r-4 border-[var(--brand-amber)] pr-5 sm:pr-7">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="page-title mt-4">{title}</h1>
      {description ? <p className="mt-5 max-w-3xl text-base leading-8 muted-copy sm:text-lg">{description}</p> : null}
    </header>
  );
}
