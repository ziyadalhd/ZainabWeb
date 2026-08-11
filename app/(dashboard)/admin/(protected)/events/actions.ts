"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import {
  canChangeEventStatus,
  isEventPublicationStatus,
  validateEventInput,
} from "@/lib/domain/event-input";
import type { EventPublicationStatus } from "@/lib/domain/types";
import { createAdminEventRepository } from "@/lib/supabase/events";

export type EventFormActionError =
  | "title"
  | "audience"
  | "kind"
  | "eventTypeLabel"
  | "startsAt"
  | "endsAt"
  | "capacity"
  | "priceHalalas"
  | "registrationStatus"
  | "save";

export interface EventFormActionState {
  error?: EventFormActionError;
}

function revalidateEventViews() {
  revalidatePath("/events");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/events");
}

export async function createEventAction(
  _previousState: EventFormActionState,
  formData: FormData,
): Promise<EventFormActionState> {
  await requireAdmin();
  const input = validateEventInput(formData);
  if (!input.ok) return { error: input.error };

  let failed = false;
  try {
    const repository = await createAdminEventRepository();
    await repository.create(input.value);
  } catch {
    failed = true;
  }

  if (failed) return { error: "save" };
  revalidateEventViews();
  redirect("/admin/events?success=created");
}

export async function updateEventAction(
  id: string,
  _previousState: EventFormActionState,
  formData: FormData,
): Promise<EventFormActionState> {
  await requireAdmin();
  const input = validateEventInput(formData);
  if (!input.ok) return { error: input.error };

  let failed = false;
  try {
    const repository = await createAdminEventRepository();
    await repository.update(id, input.value);
  } catch {
    failed = true;
  }

  if (failed) return { error: "save" };
  revalidateEventViews();
  redirect("/admin/events?success=updated");
}

export async function changeEventStatusAction(id: string, requestedStatus: EventPublicationStatus) {
  await requireAdmin();
  if (!isEventPublicationStatus(requestedStatus)) redirect("/admin/events?error=status");

  let failure: "status" | "incomplete" | null = null;
  try {
    const repository = await createAdminEventRepository();
    const event = await repository.get(id);
    if (!event || !canChangeEventStatus(event.publicationStatus, requestedStatus)) {
      failure = "status";
    } else if (
      requestedStatus === "published"
      && (event.endsAt === null || event.priceHalalas === null)
    ) {
      failure = "incomplete";
    } else {
      await repository.changeStatus(id, requestedStatus);
    }
  } catch {
    failure = "status";
  }

  if (failure) redirect(`/admin/events?error=${failure}`);
  revalidateEventViews();
  redirect("/admin/events?success=status");
}
