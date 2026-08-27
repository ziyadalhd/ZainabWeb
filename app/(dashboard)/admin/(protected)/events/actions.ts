"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import { canChangeEventStatus, isEventPublicationStatus, validateEventInput } from "@/lib/domain/event-input";
import type { EventPublicationStatus } from "@/lib/domain/types";
import { createAdminEventRepository } from "@/lib/supabase/events";
import { validateEventPoster } from "@/lib/domain/event-poster-input";
import { SupabaseEventPosterStorage } from "@/lib/supabase/event-posters";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/data/action-result";

export type EventFormActionError =
  "title" | "audience" | "kind" | "eventTypeLabel" | "startsAt" | "endsAt" | "capacity" | "priceHalalas" | "registrationStatus" | "save";

export interface EventFormActionState {
  status: "idle" | "success" | "error";
  error?: EventFormActionError;
  eventId?: string;
}

const statusChangeErrorMessages: Record<"status" | "incomplete", string> = {
  status: "تعذر تغيير حالة الفعالية. حدّث الصفحة وحاول مرة أخرى.",
  incomplete: "أكمل وقت النهاية والسعر في صفحة التعديل قبل نشر الفعالية.",
};

function revalidateEventViews() {
  revalidatePath("/events");
  revalidatePath("/admin");
  revalidatePath("/admin/events");
  revalidatePath("/admin/events/[id]", "page");
}

export async function createEventAction(_previousState: EventFormActionState, formData: FormData): Promise<EventFormActionState> {
  await requireAdmin();
  const input = validateEventInput(formData);
  if (!input.ok) return { status: "error", error: input.error };

  const posterRaw = formData.get("poster");
  const hasPoster = posterRaw instanceof File && posterRaw.size > 0;
  if (hasPoster) {
    const posterCheck = validateEventPoster(posterRaw);
    if (!posterCheck.ok) return { status: "error", error: "save" };
  }

  let createdEventId: string;
  try {
    const repository = await createAdminEventRepository();
    const createdEvent = await repository.create(input.value);
    createdEventId = createdEvent.id;

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
    return { status: "error", error: "save" };
  }

  revalidateEventViews();
  return { status: "success", eventId: createdEventId };
}

export async function updateEventAction(id: string, _previousState: EventFormActionState, formData: FormData): Promise<EventFormActionState> {
  await requireAdmin();
  if (!isEntityId(id)) return { status: "error", error: "save" };
  const input = validateEventInput(formData);
  if (!input.ok) return { status: "error", error: input.error };

  const posterRaw = formData.get("poster");
  const hasPoster = posterRaw instanceof File && posterRaw.size > 0;
  if (hasPoster) {
    const posterCheck = validateEventPoster(posterRaw);
    if (!posterCheck.ok) return { status: "error", error: "save" };
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
    return { status: "error", error: "save" };
  }

  revalidateEventViews();
  return { status: "success", eventId: id };
}

export async function changeEventStatusAction(
  id: string,
  requestedStatus: EventPublicationStatus,
  _previousState: ActionResult,
  _formData: FormData,
): Promise<ActionResult> {
  void _previousState;
  void _formData;
  await requireAdmin();
  if (!isEntityId(id) || !isEventPublicationStatus(requestedStatus)) {
    return { status: "error", message: statusChangeErrorMessages.status };
  }

  try {
    const repository = await createAdminEventRepository();
    const event = await repository.get(id);
    if (!event || !canChangeEventStatus(event.publicationStatus, requestedStatus)) {
      return { status: "error", message: statusChangeErrorMessages.status };
    }
    if (requestedStatus === "published" && (event.endsAt === null || event.priceHalalas === null)) {
      return { status: "error", message: statusChangeErrorMessages.incomplete };
    }
    await repository.changeStatus(id, requestedStatus);
  } catch {
    return { status: "error", message: statusChangeErrorMessages.status };
  }

  revalidateEventViews();
  return { status: "success" };
}

export interface EventPosterActionState {
  saved?: true;
  error?: "file" | "type" | "save";
}

export async function uploadEventPosterAction(id: string, _previousState: EventPosterActionState, formData: FormData): Promise<EventPosterActionState> {
  void _previousState;
  await requireAdmin();
  if (!isEntityId(id)) return { error: "save" };

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
