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
