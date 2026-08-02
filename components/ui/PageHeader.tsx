interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
}

export function PageHeader({ eyebrow, title, description }: PageHeaderProps) {
  return (
    <header className="max-w-3xl">
      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      <h1 className="page-title mt-3">{title}</h1>
      {description ? <p className="mt-5 max-w-2xl text-lg muted-copy">{description}</p> : null}
    </header>
  );
}
