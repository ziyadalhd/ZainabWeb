export interface NavigationItem {
  href: string;
  label: string;
  activePrefixes?: readonly string[];
}

export const publicNavigation: readonly NavigationItem[] = [
  { href: "/", label: "الرئيسية" },
  { href: "/events", label: "الفعاليات" },
  { href: "/space-booking", label: "حجز المساحة" },
  { href: "/bayn-trips", label: "رحلات بَيْن" },
  { href: "/surveys/workshop-application", label: "طلب تقديم ورشة" },
  { href: "/literary-partner", label: "الشريك الأدبي" },
  { href: "/contact", label: "التواصل" },
];

export const adminNavigation: readonly NavigationItem[] = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/calendar", label: "التقويم" },
  { href: "/admin/events", label: "الفعاليات والرحلات", activePrefixes: ["/admin/events", "/admin/registrations", "/admin/waitlist", "/admin/messages", "/admin/surveys"] },
  { href: "/admin/requests", label: "الطلبات" },
  { href: "/admin/interested", label: "المهتمات" },
  { href: "/admin/content", label: "الموقع والإعدادات" },
  { href: "/admin/security", label: "الأمان" },
];
