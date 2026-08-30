import type { EventAudience, EventAvailability } from "@/lib/domain/types";

export const eventAudienceLabels: Record<EventAudience, string> = {
  adults: "للبالغات",
  youth: "للفتيات",
  children: "للأطفال",
};

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
