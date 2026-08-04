import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminEventRepository, EventCatalog } from "@/lib/data/contracts";
import {
  isEventAudience,
  isEventAvailability,
  isEventPublicationStatus,
} from "@/lib/domain/event-input";
import type { Event, EventInput, EventPublicationStatus } from "@/lib/domain/types";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EventRow = Database["public"]["Tables"]["events"]["Row"];

export function mapEventRow(row: EventRow): Event {
  if (
    !isEventAudience(row.audience)
    || !isEventAvailability(row.availability)
    || !isEventPublicationStatus(row.publication_status)
  ) {
    throw new Error("Invalid event row returned by the data source.");
  }

  return {
    id: row.id,
    title: row.title,
    audience: row.audience,
    eventTypeLabel: row.event_type_label,
    startsAt: row.starts_at,
    capacity: row.capacity,
    availability: row.availability,
    publicationStatus: row.publication_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toEventWrite(input: EventInput) {
  return {
    title: input.title,
    audience: input.audience,
    event_type_label: input.eventTypeLabel,
    starts_at: input.startsAt,
    capacity: input.capacity,
    availability: input.availability,
  };
}

function failDataAccess(): never {
  throw new Error("تعذر الوصول إلى بيانات الفعاليات حاليًا.");
}

export class SupabaseEventRepository implements EventCatalog, AdminEventRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async listUpcomingEvents(): Promise<readonly Event[]> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("publication_status", "published")
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true });

    if (error) failDataAccess();
    return data.map(mapEventRow);
  }

  async list(): Promise<readonly Event[]> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .order("starts_at", { ascending: true });

    if (error) failDataAccess();
    return data.map(mapEventRow);
  }

  async get(id: string): Promise<Event | null> {
    const { data, error } = await this.client
      .from("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) failDataAccess();
    return data ? mapEventRow(data) : null;
  }

  async create(input: EventInput): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .insert({ ...toEventWrite(input), publication_status: "draft" })
      .select("*")
      .single();

    if (error) failDataAccess();
    return mapEventRow(data);
  }

  async update(id: string, input: EventInput): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .update(toEventWrite(input))
      .eq("id", id)
      .select("*")
      .single();

    if (error) failDataAccess();
    return mapEventRow(data);
  }

  async changeStatus(id: string, status: EventPublicationStatus): Promise<Event> {
    const { data, error } = await this.client
      .from("events")
      .update({ publication_status: status })
      .eq("id", id)
      .select("*")
      .single();

    if (error) failDataAccess();
    return mapEventRow(data);
  }
}

export async function createEventCatalog(): Promise<EventCatalog> {
  return new SupabaseEventRepository(await createSupabaseServerClient());
}

export async function createAdminEventRepository(): Promise<AdminEventRepository> {
  return new SupabaseEventRepository(await createSupabaseServerClient());
}
