import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminEventRepository, EventCatalog } from "@/lib/data/contracts";
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
    !isEventAudience(row.audience)
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
    audience: row.audience,
    eventTypeLabel: row.event_type_label,
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
    audience: input.audience,
    event_type_label: input.eventTypeLabel,
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

export class SupabaseEventRepository implements EventCatalog, AdminEventRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listUpcomingEvents(): Promise<readonly Event[]> {
    try {
      const [{ data, error }, { data: states, error: statesError }] = await Promise.all([
        this.client
          .from("events")
          .select("*")
          .eq("publication_status", "published")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true }),
        this.client.rpc("get_event_registration_states"),
      ]);

      if (error || statesError || !states || !data) {
        console.warn('[Events] listUpcomingEvents failed or returned empty:', error ?? statesError);
        return [];
      }
      const stateByEvent = new Map(states.map((state) => [state.event_id, state]));
      return data.flatMap((row) => {
        const state = stateByEvent.get(row.id);
        if (!state) return [];
        return [mapEventRow(row, state, getPosterUrl(this.client, row.poster_path))];
      });
    } catch (err) {
      console.warn('[Events] listUpcomingEvents failed gracefully:', err);
      return [];
    }
  }

  async listUpcomingBaynTrips(): Promise<readonly Event[]> {
    try {
      const [{ data, error }, { data: states, error: statesError }] = await Promise.all([
        this.client
          .from("events")
          .select("*")
          .eq("event_kind", "bayn_trip")
          .eq("publication_status", "published")
          .gte("starts_at", new Date().toISOString())
          .order("starts_at", { ascending: true }),
        this.client.rpc("get_event_registration_states"),
      ]);

      if (error || statesError || !states || !data) {
        console.warn('[Events] listUpcomingBaynTrips failed or returned empty:', error ?? statesError);
        return [];
      }
      const stateByEvent = new Map(states.map((state) => [state.event_id, state]));
      return data.flatMap((row) => {
        const state = stateByEvent.get(row.id);
        if (!state) return [];
        return [mapEventRow(row, state, getPosterUrl(this.client, row.poster_path))];
      });
    } catch (err) {
      console.warn('[Events] listUpcomingBaynTrips failed gracefully:', err);
      return [];
    }
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
