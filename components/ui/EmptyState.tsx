interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="card-surface mt-8 px-6 py-10 text-center" aria-live="polite">
      <span aria-hidden="true" className="mx-auto flex size-12 items-center justify-center rounded-full bg-[var(--surface-soft)] text-xl text-[var(--brand-green)]">•</span>
      <h2 className="mt-4 text-xl font-extrabold text-[var(--brand-green-deep)]">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl muted-copy">{description}</p>
    </section>
  );
}
