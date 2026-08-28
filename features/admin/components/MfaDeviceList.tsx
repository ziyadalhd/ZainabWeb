import { formatArabicDateTime, formatArabicNumber } from "@/lib/format/date";

export interface ManagedFactor {
  id: string;
  name: string;
  createdAt: string;
}

interface MfaDeviceListProps {
  factors: readonly ManagedFactor[];
  isLoading: boolean;
  confirmingRemovalId: string | undefined;
  busy: boolean;
  removing: boolean;
  onRequestRemoval: (factorId: string) => void;
  onConfirmRemoval: (factor: ManagedFactor) => void;
  onCancelRemoval: () => void;
}

export function MfaDeviceList({
  factors,
  isLoading,
  confirmingRemovalId,
  busy,
  removing,
  onRequestRemoval,
  onConfirmRemoval,
  onCancelRemoval,
}: MfaDeviceListProps) {
  return (
    <section className="card-surface p-5 sm:p-7" aria-labelledby="mfa-devices-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="mfa-devices-heading" className="text-xl font-bold text-[var(--brand-forest)]">
            أجهزة التحقق المسجلة
          </h2>
          <p className="mt-2 text-sm leading-6 muted-copy">احتفظي بجهازين على الأقل حتى لا تفقدي الوصول عند تغيير الجوال.</p>
        </div>
        {!isLoading ? (
          <span className="rounded-full bg-[var(--color-surface-muted)] px-3 py-1 text-sm font-medium">{formatArabicNumber(factors.length)} جهاز</span>
        ) : null}
      </div>

      {isLoading ? (
        <p role="status" className="notice-info mt-5">
          جارٍ تحميل الأجهزة…
        </p>
      ) : null}
      {!isLoading && factors.length === 0 ? (
        <p role="alert" className="notice-error mt-5">
          لا يوجد جهاز موثّق. سجلي الخروج وابدئي إعداد التحقق من جديد.
        </p>
      ) : null}

      {factors.length > 0 ? (
        <ul className="mt-6 grid gap-3">
          {factors.map((factor) => (
            <li key={factor.id} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-bold text-[var(--brand-forest)]">{factor.name}</p>
                  <p className="mt-1 text-xs muted-copy">أُضيف في {formatArabicDateTime(factor.createdAt)}</p>
                </div>
                {confirmingRemovalId !== factor.id ? (
                  <button
                    type="button"
                    className="button-danger min-h-10 px-3 py-2 text-sm"
                    disabled={factors.length <= 1 || busy}
                    onClick={() => onRequestRemoval(factor.id)}
                    aria-describedby={factors.length <= 1 ? "last-factor-help" : undefined}
                  >
                    إزالة الجهاز
                  </button>
                ) : (
                  <div className="max-w-md rounded-xl border border-[var(--color-danger)] bg-white p-4" role="group" aria-label={`تأكيد إزالة ${factor.name}`}>
                    <p className="text-sm font-normal">هل تريدين إزالة «{factor.name}»؟ لن تقبل رموزه بعد التأكيد.</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" className="button-danger min-h-10 px-3 py-2 text-sm" disabled={busy} onClick={() => onConfirmRemoval(factor)}>
                        {removing ? "جارٍ الإزالة…" : "تأكيد الإزالة"}
                      </button>
                      <button type="button" className="button-quiet min-h-10 px-3 py-2 text-sm" disabled={busy} onClick={onCancelRemoval}>
                        تراجع
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      {factors.length === 1 ? (
        <p id="last-factor-help" className="notice-info mt-5">
          هذا هو جهاز التحقق الوحيد. أضيفي جهازًا جديدًا وفعّليه قبل إزالة هذا الجهاز.
        </p>
      ) : null}
    </section>
  );
}
