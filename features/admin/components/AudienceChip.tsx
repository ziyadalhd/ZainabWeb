import type { EventAudience } from "@/lib/domain/types";
import { eventAudienceLabels } from "@/features/events/event-presentation";

export function AudienceChip({ audience }: { audience: EventAudience }) {
  return <span className={`audience-chip audience-chip--${audience}`}>{eventAudienceLabels[audience]}</span>;
}
