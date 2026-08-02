import type { AdminDashboardSnapshot, Registration, WaitlistEntry } from "@/lib/domain/types";
import { demoEvents } from "@/lib/demo/events";

const demoRegistrations: readonly Registration[] = [
  { id: "demo-registration-1", eventId: "demo-event-1", displayLabel: "مسجل تجريبي ١", recordKind: "current", attendanceStatus: "confirmed" },
  { id: "demo-registration-2", eventId: "demo-event-1", displayLabel: "مسجل تجريبي ٢", recordKind: "current", attendanceStatus: "pending" },
  { id: "demo-registration-3", eventId: "demo-event-3", displayLabel: "مسجل تجريبي ٣", recordKind: "current", attendanceStatus: "cancelled" },
  { id: "demo-registration-4", eventId: "demo-event-2", displayLabel: "مسجل تجريبي سابق", recordKind: "previous", attendanceStatus: "confirmed" },
];

const demoWaitlistEntries: readonly WaitlistEntry[] = [
  { id: "demo-waitlist-1", eventId: "demo-event-2", displayLabel: "سجل انتظار تجريبي ١" },
  { id: "demo-waitlist-2", eventId: "demo-event-2", displayLabel: "سجل انتظار تجريبي ٢" },
];

export const demoAdminSnapshot: AdminDashboardSnapshot = {
  events: demoEvents,
  registrations: demoRegistrations,
  waitlistEntries: demoWaitlistEntries,
};
