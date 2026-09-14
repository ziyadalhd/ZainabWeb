import type { EventAudience } from "@/lib/domain/types";
import { eventAudienceLabels } from "@/features/events/event-presentation";

export function AudienceChips({ audiences }: { audiences: readonly EventAudience[] }) {
  return (
    <>
      {audiences.map((audience) => (
        <span key={audience} className={`audience-chip audience-chip--${audience}`}>
          {eventAudienceLabels[audience]}
        </span>
      ))}
    </>
  );
}
