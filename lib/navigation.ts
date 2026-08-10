export interface NavigationItem {
  href: string;
  label: string;
}

export const publicNavigation: readonly NavigationItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/events", label: "الفعاليات" },
  { href: "/space-booking", label: "حجز المساحة" },
  { href: "/bayn-trips", label: "رحلات بَيْن" },
  { href: "/surveys", label: "استبيانات" },
  { href: "/contact", label: "التواصل" },
];

export const adminNavigation: readonly NavigationItem[] = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/calendar", label: "التقويم" },
  { href: "/admin/events", label: "الفعاليات" },
  { href: "/admin/requests", label: "طلبات الحجز والورش" },
  { href: "/admin/registrations/current", label: "المسجلون الحاليون" },
  { href: "/admin/registrations/previous", label: "المسجلون السابقون" },
  { href: "/admin/interested", label: "المهتمون" },
  { href: "/admin/waitlist", label: "قائمة الانتظار" },
  { href: "/admin/messages", label: "الرسائل" },
  { href: "/admin/surveys", label: "الاستبيانات" },
];
