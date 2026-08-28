interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <section className="mt-8 border-y border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-10 sm:px-8" aria-live="polite">
      <span aria-hidden="true" className="block h-1 w-12 bg-[var(--brand-amber)]" />
      <h2 className="mt-5 text-xl font-bold text-[var(--brand-forest)]">{title}</h2>
      <p className="mt-2 max-w-2xl leading-7 muted-copy">{description}</p>
    </section>
  );
}
