"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Registration } from "@/lib/domain/types";
import { formatArabicNumber } from "@/lib/format/date";
import { ActionButton } from "@/components/ui/ActionButton";
import type { ActionResult } from "@/lib/data/action-result";

interface EventCheckInModeProps {
  registrations: readonly Registration[];
  recordCheckIn: (id: string, outcome: string, state: ActionResult, formData: FormData) => Promise<ActionResult>;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function EventCheckInMode({ registrations, recordCheckIn }: EventCheckInModeProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const arrivedCount = registrations.filter((registration) => registration.checkInStatus === "checked_in").length;

  const ordered = useMemo(() => {
    const term = normalize(search);
    const filtered = term
      ? registrations.filter((registration) => normalize(registration.attendeeName).includes(term) || registration.phoneE164.includes(term))
      : registrations;
    return [...filtered].sort((first, second) => {
      const firstArrived = first.checkInStatus === "checked_in" ? 1 : 0;
      const secondArrived = second.checkInStatus === "checked_in" ? 1 : 0;
      if (firstArrived !== secondArrived) return firstArrived - secondArrived;
      return first.attendeeName.localeCompare(second.attendeeName, "ar");
    });
  }, [registrations, search]);

  return (
    <div className="grid gap-5">
      <div className="check-in-summary" aria-live="polite">
        <strong>{formatArabicNumber(arrivedCount)}</strong>
        <span>من {formatArabicNumber(registrations.length)} حضرن</span>
      </div>

      <label className="sr-only" htmlFor="check-in-search">
        ابحثي بالاسم أو الجوال
      </label>
      <input
        id="check-in-search"
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="ابحثي بالاسم أو الجوال…"
        className="field-control min-h-14 w-full text-lg"
        autoFocus
      />

      {ordered.length === 0 ? (
        <p className="card-surface p-6 text-center muted-copy">لا توجد نتيجة مطابقة.</p>
      ) : (
        <ul className="grid gap-2">
          {ordered.map((registration) => {
            const arrived = registration.checkInStatus === "checked_in";
            return (
              <li key={registration.id} className={arrived ? "check-in-row check-in-row--arrived" : "check-in-row"}>
                <span className="min-w-0">
                  <strong className="block truncate text-lg">{registration.attendeeName}</strong>
                  <small className="data-value" dir="ltr">
                    {registration.phoneE164}
                  </small>
                </span>
                {arrived ? (
                  <span className="check-in-row__done">✓ حضرت</span>
                ) : (
                  <ActionButton
                    action={recordCheckIn.bind(null, registration.id, "checked_in")}
                    label="تسجيل الحضور"
                    pendingLabel="…"
                    className="button-primary min-h-12 px-5 text-base"
                    successMessage={`تم تسجيل حضور ${registration.attendeeName}.`}
                    onSuccess={() => router.refresh()}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
