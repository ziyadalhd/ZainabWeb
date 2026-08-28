"use client";

import { useMemo, useOptimistic, useState } from "react";
import { useRouter } from "next/navigation";
import type { Registration } from "@/lib/domain/types";
import { formatArabicNumber } from "@/lib/format/date";
import { ActionButton } from "@/components/ui/ActionButton";
import { useToast } from "@/components/ui/ToastProvider";
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
  const { pushToast } = useToast();
  const [search, setSearch] = useState("");
  // Marks a name as arrived the instant it's tapped, ahead of the server round trip — this screen
  // is used at the door for rapid, back-to-back check-ins, where any visible lag compounds fast.
  const [optimisticRegistrations, markArrived] = useOptimistic(registrations, (current: readonly Registration[], id: string) =>
    current.map((registration) => (registration.id === id ? { ...registration, checkInStatus: "checked_in" as const } : registration)),
  );

  const arrivedCount = optimisticRegistrations.filter((registration) => registration.checkInStatus === "checked_in").length;

  const ordered = useMemo(() => {
    const term = normalize(search);
    const filtered = term
      ? optimisticRegistrations.filter((registration) => normalize(registration.attendeeName).includes(term) || registration.phoneE164.includes(term))
      : optimisticRegistrations;
    return [...filtered].sort((first, second) => {
      const firstArrived = first.checkInStatus === "checked_in" ? 1 : 0;
      const secondArrived = second.checkInStatus === "checked_in" ? 1 : 0;
      if (firstArrived !== secondArrived) return firstArrived - secondArrived;
      return first.attendeeName.localeCompare(second.attendeeName, "ar");
    });
  }, [optimisticRegistrations, search]);

  // The row swaps to "✓ حضرت" the instant this runs (optimistic), which unmounts the ActionButton
  // that submitted it before its own success effect can run — so completion (toast + real
  // refresh) is handled here instead, in this always-mounted component.
  async function checkIn(id: string, name: string, state: ActionResult, formData: FormData): Promise<ActionResult> {
    markArrived(id);
    const result = await recordCheckIn(id, "checked_in", state, formData);
    if (result.status === "success") pushToast(`تم تسجيل حضور ${name}.`, "success");
    else if (result.status === "error") pushToast(result.message ?? "تعذر تنفيذ الإجراء. حاولي مرة أخرى.", "error");
    router.refresh();
    return result;
  }

  return (
    <div className="grid gap-5">
      <div className="check-in-summary" aria-live="polite">
        <strong>{formatArabicNumber(arrivedCount)}</strong>
        <span>من {formatArabicNumber(optimisticRegistrations.length)} حضرن</span>
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
                    action={checkIn.bind(null, registration.id, registration.attendeeName)}
                    label="تسجيل الحضور"
                    pendingLabel="…"
                    className="button-primary min-h-12 px-5 text-base"
                    successMessage={`تم تسجيل حضور ${registration.attendeeName}.`}
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
