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
import { validateEventPoster } from "@/lib/domain/event-poster-input";
import { SupabaseEventPosterStorage } from "@/lib/supabase/event-posters";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  revalidatePath("/admin/events");
  revalidatePath("/admin/events/[id]", "page");
}

export async function createEventAction(
  _previousState: EventFormActionState,
  formData: FormData,
): Promise<EventFormActionState> {
  await requireAdmin();
  const input = validateEventInput(formData);
  if (!input.ok) return { error: input.error };

  const posterRaw = formData.get("poster");
  const hasPoster = posterRaw instanceof File && posterRaw.size > 0;
  if (hasPoster) {
    const posterCheck = validateEventPoster(posterRaw);
    if (!posterCheck.ok) return { error: "save" };
  }

  try {
    const repository = await createAdminEventRepository();
    const createdEvent = await repository.create(input.value);

    if (hasPoster) {
      const posterCheck = validateEventPoster(posterRaw);
      if (posterCheck.ok) {
        const client = await createSupabaseServerClient();
        const storage = new SupabaseEventPosterStorage(client);
        const posterPath = await storage.upload(createdEvent.id, posterRaw, posterCheck.extension);
        await repository.setPosterPath(createdEvent.id, posterPath);
      }
    }
  } catch {
    return { error: "save" };
  }

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

  const posterRaw = formData.get("poster");
  const hasPoster = posterRaw instanceof File && posterRaw.size > 0;
  if (hasPoster) {
    const posterCheck = validateEventPoster(posterRaw);
    if (!posterCheck.ok) return { error: "save" };
  }

  try {
    const repository = await createAdminEventRepository();
    await repository.update(id, input.value);

    if (hasPoster) {
      const posterCheck = validateEventPoster(posterRaw);
      if (posterCheck.ok) {
        const client = await createSupabaseServerClient();
        const { data: currentEvent } = await client.from("events").select("poster_path").eq("id", id).maybeSingle();
        const storage = new SupabaseEventPosterStorage(client);
        const posterPath = await storage.upload(id, posterRaw, posterCheck.extension);
        await repository.setPosterPath(id, posterPath);
        if (currentEvent?.poster_path) {
          await storage.remove(currentEvent.poster_path).catch(() => undefined);
        }
      }
    }
  } catch {
    return { error: "save" };
  }

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

export interface EventPosterActionState {
  saved?: true;
  error?: "file" | "type" | "save";
}

export async function uploadEventPosterAction(
  id: string,
  _previousState: EventPosterActionState,
  formData: FormData,
): Promise<EventPosterActionState> {
  void _previousState;
  await requireAdmin();
  if (!uuidPattern.test(id)) return { error: "save" };

  const poster = validateEventPoster(formData.get("poster"));
  if (!poster.ok) return { error: poster.error };

  try {
    const client = await createSupabaseServerClient();
    const [{ data: event, error: eventError }, repository] = await Promise.all([
      client.from("events").select("poster_path").eq("id", id).maybeSingle(),
      createAdminEventRepository(),
    ]);
    if (eventError || !event) return { error: "save" };

    const storage = new SupabaseEventPosterStorage(client);
    const posterPath = await storage.upload(id, formData.get("poster") as File, poster.extension);
    try {
      await repository.setPosterPath(id, posterPath);
    } catch {
      await storage.remove(posterPath).catch(() => undefined);
      return { error: "save" };
    }
    if (event.poster_path) await storage.remove(event.poster_path).catch(() => undefined);
  } catch {
    return { error: "save" };
  }

  revalidateEventViews();
  revalidatePath(`/admin/events/${id}/edit`);
  return { saved: true };
}
