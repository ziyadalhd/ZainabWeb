import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminEventFeedbackRepository, EventFeedbackService } from "@/lib/data/contracts";
import type {
  AdminEventFeedbackResponse,
  EventFeedbackInput,
  EventFeedbackSurvey,
  Rating,
} from "@/lib/domain/types";
import { hashSecureToken, isSecureToken } from "@/lib/security/secure-token";
import type { Database } from "@/lib/supabase/database.types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type FeedbackRow = Database["public"]["Tables"]["event_feedback_links"]["Row"];

function isRating(value: number | null): value is Rating {
  return value === 1 || value === 2 || value === 3 || value === 4 || value === 5;
}

function unavailable(): never {
  throw new Error("تعذر الوصول إلى بيانات تقييم الفعالية حاليًا.");
}

export class SupabaseEventFeedbackRepository implements EventFeedbackService, AdminEventFeedbackRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async getByToken(token: string): Promise<EventFeedbackSurvey | null> {
    if (!isSecureToken(token)) return null;
    const { data, error } = await this.client.rpc("get_event_feedback_by_token", {
      p_feedback_token_hash: hashSecureToken(token),
    });
    if (error) unavailable();
    const feedback = data[0];
    return feedback ? { eventTitle: feedback.event_title } : null;
  }

  async submitByToken(token: string, input: EventFeedbackInput): Promise<void> {
    if (!isSecureToken(token)) unavailable();
    const { error } = await this.client.rpc("submit_event_feedback_by_token", {
      p_feedback_token_hash: hashSecureToken(token),
      p_hospitality_rating: input.hospitalityRating,
      p_material_rating: input.materialRating,
      p_suggestions: input.suggestions ?? "",
      p_identity_visible: input.identityVisible,
    });
    if (error) unavailable();
  }

  async listSubmitted(): Promise<readonly AdminEventFeedbackResponse[]> {
    try {
      const [
        { data: feedback, error: feedbackError },
        { data: events, error: eventsError },
        { data: registrations, error: registrationsError },
      ] = await Promise.all([
        this.client.from("event_feedback_links").select("*").not("submitted_at", "is", null).order("submitted_at", { ascending: false }),
        this.client.from("events").select("id,title"),
        this.client.from("registrations").select("id,attendee_name"),
      ]);
      if (feedbackError || eventsError || registrationsError || !feedback || !events || !registrations) {
        console.warn('[EventFeedback] listSubmitted returned error or empty data:', feedbackError ?? eventsError ?? registrationsError);
        return [];
      }

      const eventTitles = new Map(events.map((event) => [event.id, event.title]));
      const attendeeNames = new Map(registrations.map((registration) => [registration.id, registration.attendee_name]));

      return feedback.flatMap((row: FeedbackRow) => {
        if (!row.submitted_at || !isRating(row.hospitality_rating) || !isRating(row.material_rating)) return [];
        const eventTitle = eventTitles.get(row.event_id);
        if (!eventTitle) return [];
        return [{
          id: row.id,
          eventId: row.event_id,
          eventTitle,
          attendeeName: row.identity_visible && row.registration_id ? attendeeNames.get(row.registration_id) ?? null : null,
          hospitalityRating: row.hospitality_rating,
          materialRating: row.material_rating,
          suggestions: row.suggestions,
          submittedAt: row.submitted_at,
        }];
      });
    } catch (err) {
      console.warn('[EventFeedback] listSubmitted failed gracefully:', err);
      return [];
    }
  }

  async listSubmittedForEvent(eventId: string): Promise<readonly AdminEventFeedbackResponse[]> {
    try {
      const [
        { data: feedback, error: feedbackError },
        { data: event, error: eventError },
        { data: registrations, error: registrationsError },
      ] = await Promise.all([
        this.client.from("event_feedback_links").select("*").eq("event_id", eventId).not("submitted_at", "is", null).order("submitted_at", { ascending: false }),
        this.client.from("events").select("id,title").eq("id", eventId).maybeSingle(),
        this.client.from("registrations").select("id,attendee_name").eq("event_id", eventId),
      ]);
      if (feedbackError || eventError || registrationsError || !feedback || !event || !registrations) return [];

      const attendeeNames = new Map(registrations.map((registration) => [registration.id, registration.attendee_name]));
      return feedback.flatMap((row: FeedbackRow) => {
        if (!row.submitted_at || !isRating(row.hospitality_rating) || !isRating(row.material_rating)) return [];
        return [{
          id: row.id,
          eventId: row.event_id,
          eventTitle: event.title,
          attendeeName: row.identity_visible && row.registration_id ? attendeeNames.get(row.registration_id) ?? null : null,
          hospitalityRating: row.hospitality_rating,
          materialRating: row.material_rating,
          suggestions: row.suggestions,
          submittedAt: row.submitted_at,
        }];
      });
    } catch (error) {
      console.warn("[EventFeedback] listSubmittedForEvent failed gracefully:", error);
      return [];
    }
  }
}

export async function createEventFeedbackService(): Promise<EventFeedbackService> {
  return new SupabaseEventFeedbackRepository(await createSupabaseServerClient());
}

export async function createAdminEventFeedbackRepository(): Promise<AdminEventFeedbackRepository> {
  return new SupabaseEventFeedbackRepository(await createSupabaseServerClient());
}
