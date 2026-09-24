import type { EventAudience, EventAvailability } from "@/lib/domain/types";

export const eventAudienceLabels: Record<EventAudience, string> = {
  adults: "للبالغات",
  youth: "للفتيات",
  children: "للأطفال",
};

/** Joins an event's audiences into one Arabic label, e.g. «للبالغات، للفتيات». */
export function formatEventAudiences(audiences: readonly EventAudience[]): string {
  return audiences.map((audience) => eventAudienceLabels[audience]).join("، ");
}

export const eventAvailabilityPresentation: Record<EventAvailability, {
  status: string;
  action: string;
}> = {
  available: {
    status: "التسجيل متاح",
    action: "احجزي مكانك",
  },
  full: {
    status: "للأسف اكتملت المقاعد — تقدرين تنضمين لقائمة الانتظار",
    action: "انضمي لقائمة الانتظار",
  },
  closed: {
    status: "التسجيل مقفل حاليًا، وتقدرين تشوفين التفاصيل",
    action: "شوفي التفاصيل",
  },
};

/**
 * The poster column of an event card. Posters are cropped to 4:5 on upload, so on wider screens
 * the column takes the card's height and derives its width from the ratio: the poster fills it
 * with no bands above or below, whatever the length of the text beside it. On phones the card
 * stacks and the poster spans the full width.
 */
export const posterColumnClassName =
  "aspect-[4/5] shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] sm:self-stretch sm:border-b-0 sm:border-l";
