import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminEventRepository, DeleteEventOutcome, EventCatalog } from "@/lib/data/contracts";
import { loadFailed, ok, type RepositoryResult } from "@/lib/data/result";
import { logRepositoryFailure } from "@/lib/observability/logger";
import {
  isEventAudience,
  isEventKind,
  isEventPublicationStatus,
  isEventRegistrationStatus,
} from "@/lib/domain/event-input";
import type {
  Event,
  EventAvailability,
  EventInput,
  EventPublicationStatus,
  PastEvent,
} from "@/lib/domain/types";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = Database["public"]["Tables"]["events"]["Row"];
type EventStateRow = Database["public"]["Functions"]["get_event_registration_states"]["Returns"][number];

function isEventAvailability(value: string): value is EventAvailability {
  return value === "available" || value === "full" || value === "closed";
}

export function mapEventRow(row: EventRow, state: EventStateRow, posterUrl: string | null = null): Event {
  if (
    row.audiences.length === 0
    || !row.audiences.every(isEventAudience)
    || !isEventKind(row.event_kind)
    || !isEventPublicationStatus(row.publication_status)
    || !isEventRegistrationStatus(row.registration_status)
    || !isEventAvailability(state.registration_availability)
  ) {
    throw new Error("Invalid event row returned by the data source.");
  }

  return {
    id: row.id,
    title: row.title,
    kind: row.event_kind,
    audiences: row.audiences,
    eventTypeLabel: row.event_type_label,
    description: row.description,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    capacity: row.capacity,
    activeReservationCount: state.active_reservation_count,
    priceHalalas: row.price_halalas,
    posterUrl,
    registrationStatus: row.registration_status,
    availability: state.registration_availability,
    publicationStatus: row.publication_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function getPosterUrl(client: SupabaseClient<Database>, posterPath: string | null): string | null {
  if (!posterPath) return null;
  return client.storage.from("event-posters").getPublicUrl(posterPath).data.publicUrl;
}

function toEventWrite(input: EventInput) {
  return {
    title: input.title,
    event_kind: input.kind,
    audiences: [...input.audiences],
    event_type_label: input.eventTypeLabel,
    description: input.description,
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    capacity: input.capacity,
    price_halalas: input.priceHalalas,
    registration_status: input.registrationStatus,
  };
}

function failDataAccess(): never {
  throw new Error("تعذر الوصول إلى بيانات الفعاليات حاليًا.");
}

/** Postgres SQLSTATE for a foreign-key violation — an `on delete restrict` refusal. */
const FOREIGN_KEY_VIOLATION = "23503";

export class SupabaseEventRepository implements EventCatalog, AdminEventRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listUpcomingEvents(): Promise<readonly Event[]> {
    return this.listUpcoming("events.listUpcomingEvents");
  }

  async listUpcomingBaynTrips(): Promise<readonly Event[]> {
    return this.listUpcoming("events.listUpcomingBaynTrips", "bayn_trip");
  }

  /** Throws on a database error, so a public page shows its error state instead of "no events". */
  private async listUpcoming(scope: string, kind?: Event["kind"]): Promise<readonly Event[]> {
    let query = this.client
      .from("events")
      .select("*")
      .eq("publication_status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });
    if (kind) query = query.eq("event_kind", kind);

    const [{ data, error }, { data: states, error: statesError }] = await Promise.all([
      query,
      this.client.rpc("get_event_registration_states"),
    ]);

    if (error || statesError) {
      logRepositoryFailure(scope, error ?? statesError);
      failDataAccess();
    }
    const stateByEvent = new Map(states.map((state) => [state.event_id, state]));
    return data.flatMap((row) => {
      const state = stateByEvent.get(row.id);
      if (!state) return [];
      return [mapEventRow(row, state, getPosterUrl(this.client, row.poster_path))];
    });
  }

  async getUpcomingEvent(id: string): Promise<Event | null> {
    const [{ data, error }, { data: states, error: statesError }] = await Promise.all([
      this.client
        .from("events")
        .select("*")
        .eq("id", id)
        .eq("publication_status", "published")
        .gte("starts_at", new Date().toISOString())
        .maybeSingle(),
      this.client.rpc("get_event_registration_states"),
    ]);

    if (error || statesError || !states) failDataAccess();
    if (!data) return null;
    const state = states.find((candidate) => candidate.event_id === data.id);
    if (!state) failDataAccess();
    return mapEventRow(data, state, getPosterUrl(this.client, data.poster_path));
  }

  async listPastEvents(): Promise<readonly PastEvent[]> {
    const { data, error } = await this.client
      .from("events")
      .select("id, title, event_kind, audiences, event_type_label, description, starts_at, ends_at, poster_path")
      .eq("publication_status", "published")
      .lte("ends_at", new Date().toISOString())
      .order("starts_at", { ascending: false });

    if (error) {
      logRepositoryFailure("events.listPastEvents", error);
      failDataAccess();
    }

    return data.flatMap((row) => {
      if (!row.ends_at || !isEventKind(row.event_kind) || !row.audiences.every(isEventAudience)) return [];
      return [{
        id: row.id,
        title: row.title,
        kind: row.event_kind,
        audiences: row.audiences,
        eventTypeLabel: row.event_type_label,
        description: row.description,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        posterUrl: getPosterUrl(this.client, row.poster_path),
      }];
    });
  }

  async list(): Promise<RepositoryResult<readonly Event[]>> {
    try {
      const [{ data, error }, { data: states, error: statesError }] = await Promise.all([
        this.client.from("events").select("*").order("starts_at", { ascending: true }),
        this.client.rpc("get_event_registration_states"),
      ]);

      if (error || statesError || !states || !data) {
        logRepositoryFailure("Events.list", error ?? statesError);
        return loadFailed();
      }
      const stateByEvent = new Map(states.map((state) => [state.event_id, state]));
      return ok(data.flatMap((row) => {
        const state = stateByEvent.get(row.id);
        if (!state) return [];
        return [mapEventRow(row, state, getPosterUrl(this.client, row.poster_path))];
      }));
    } catch (err) {
      logRepositoryFailure("Events.list", err);
      return loadFailed();
    }
  }

  async get(id: string): Promise<Event | null> {
    const [{ data, error }, { data: states, error: statesError }] = await Promise.all([
      this.client.from("events").select("*").eq("id", id).maybeSingle(),
      this.client.rpc("get_event_registration_states"),
    ]);

    if (error || statesError || !states) failDataAccess();
    if (!data) return null;
    const state = states.find((candidate) => candidate.event_id === data.id);
    if (!state) failDataAccess();
    return mapEventRow(data, state, getPosterUrl(this.client, data.poster_path));
  }

  async create(input: EventInput): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .insert({ ...toEventWrite(input), publication_status: "draft" })
      .select("*")
      .single();

    if (error) failDataAccess();
    const state = await this.getState(data.id);
    return mapEventRow(data, state, getPosterUrl(this.client, data.poster_path));
  }

  async update(id: string, input: EventInput): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .update(toEventWrite(input))
      .eq("id", id)
      .select("*")
      .single();

    if (error) failDataAccess();
    const state = await this.getState(data.id);
    return mapEventRow(data, state, getPosterUrl(this.client, data.poster_path));
  }

  async duplicate(id: string): Promise<Event> {
    const { data: source, error: sourceError } = await this.client.from("events").select("*").eq("id", id).single();
    if (sourceError || !source) failDataAccess();

    const { data, error } = await this.client
      .from("events")
      .insert({
        title: `${source.title} (نسخة)`,
        event_kind: source.event_kind,
        audiences: source.audiences,
        event_type_label: source.event_type_label,
        description: source.description,
        starts_at: new Date().toISOString(),
        ends_at: null,
        capacity: source.capacity,
        price_halalas: source.price_halalas,
        registration_status: source.registration_status,
        publication_status: "draft",
      })
      .select("*")
      .single();

    if (error) failDataAccess();
    const state = await this.getState(data.id);
    return mapEventRow(data, state, null);
  }

  async setPosterPath(id: string, posterPath: string): Promise<void> {
    const { error } = await this.client
      .from("events")
      .update({ poster_path: posterPath })
      .eq("id", id);
    if (error) failDataAccess();
  }

  async changeStatus(id: string, status: EventPublicationStatus): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .update({ publication_status: status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) failDataAccess();
    const state = await this.getState(data.id);
    return mapEventRow(data, state, getPosterUrl(this.client, data.poster_path));
  }

  async delete(id: string): Promise<DeleteEventOutcome> {
    const { data: existing, error: readError } = await this.client.from("events").select("poster_path").eq("id", id).maybeSingle();
    if (readError) failDataAccess();
    if (!existing) return { deleted: false, reason: "not-found" };

    // Checked before the delete so the common case gets the accurate reason rather than a raw
    // constraint error, and re-checked by the database itself through the `on delete restrict`
    // foreign keys — which is what makes a registration arriving between these two statements safe.
    const [{ count: registrationCount, error: registrationError }, { count: feedbackCount, error: feedbackError }] = await Promise.all([
      this.client.from("registrations").select("id", { count: "exact", head: true }).eq("event_id", id),
      this.client.from("event_feedback_links").select("id", { count: "exact", head: true }).eq("event_id", id),
    ]);
    if (registrationError || feedbackError) failDataAccess();
    if ((registrationCount ?? 0) > 0 || (feedbackCount ?? 0) > 0) return { deleted: false, reason: "has-attendees" };

    const { data: deleted, error } = await this.client.from("events").delete().eq("id", id).select("id").maybeSingle();
    if (error) {
      if (error.code === FOREIGN_KEY_VIOLATION) return { deleted: false, reason: "has-attendees" };
      failDataAccess();
    }
    // RLS filters a forbidden delete to zero rows instead of raising, so an empty result here means
    // the row is not visible to this caller — indistinguishable from, and reported as, not-found.
    if (!deleted) return { deleted: false, reason: "not-found" };

    return { deleted: true, posterPath: existing.poster_path };
  }

  private async getState(eventId: string): Promise<EventStateRow> {
    const { data, error } = await this.client.rpc("get_event_registration_states");
    const state = data?.find((candidate) => candidate.event_id === eventId);
    if (error || !state) failDataAccess();
    return state;
  }
}

export async function createEventCatalog(): Promise<EventCatalog> {
  return new SupabaseEventRepository(await createSupabaseServerClient());
}

export async function createAdminEventRepository(): Promise<AdminEventRepository> {
  return new SupabaseEventRepository(await createSupabaseServerClient());
}
