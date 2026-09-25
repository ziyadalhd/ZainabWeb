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
 * The poster column of an event card. Posters are cropped to 4:5 on upload and span the card
 * width on phones. On wider screens the poster takes a fixed share of the card width, leaving
 * the text to determine the card height without clipping its action.
 */
export const posterColumnClassName =
  "aspect-[4/5] shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface-muted)] sm:aspect-auto sm:w-[38%] sm:self-stretch sm:border-b-0 sm:border-l";
