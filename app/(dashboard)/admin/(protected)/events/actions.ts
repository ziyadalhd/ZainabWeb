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

function revalidateEventViews() {
  revalidatePath("/events");
  revalidatePath("/admin");
  revalidatePath("/admin/calendar");
  revalidatePath("/admin/events");
}

export async function createEventAction(formData: FormData) {
  await requireAdmin();
  const input = validateEventInput(formData);
  if (!input.ok) redirect(`/admin/events/new?error=${input.error}`);

  let failed = false;
  try {
    const repository = await createAdminEventRepository();
    await repository.create(input.value);
  } catch {
    failed = true;
  }

  if (failed) redirect("/admin/events/new?error=save");
  revalidateEventViews();
  redirect("/admin/events?success=created");
}

export async function updateEventAction(id: string, formData: FormData) {
  await requireAdmin();
  const input = validateEventInput(formData);
  if (!input.ok) redirect(`/admin/events/${id}/edit?error=${input.error}`);

  let failed = false;
  try {
    const repository = await createAdminEventRepository();
    await repository.update(id, input.value);
  } catch {
    failed = true;
  }

  if (failed) redirect(`/admin/events/${id}/edit?error=save`);
  revalidateEventViews();
  redirect("/admin/events?success=updated");
}

export async function changeEventStatusAction(id: string, requestedStatus: EventPublicationStatus) {
  await requireAdmin();
  if (!isEventPublicationStatus(requestedStatus)) redirect("/admin/events?error=status");

  let failed = false;
  try {
    const repository = await createAdminEventRepository();
    const event = await repository.get(id);
    if (!event || !canChangeEventStatus(event.publicationStatus, requestedStatus)) {
      failed = true;
    } else {
      await repository.changeStatus(id, requestedStatus);
    }
  } catch {
    failed = true;
  }

  if (failed) redirect("/admin/events?error=status");
  revalidateEventViews();
  redirect("/admin/events?success=status");
}
