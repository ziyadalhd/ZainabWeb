import type { Event } from "@/lib/domain/types";

// Synthetic demonstration records only. They are not production or customer data.
export const demoEvents: readonly Event[] = [
  {
    id: "demo-event-1",
    title: "فعالية تجريبية ١",
    audience: "adults",
    eventTypeLabel: "نوع تجريبي",
    startsAt: "2026-08-10T18:00:00+03:00",
    capacity: 30,
    registrationCount: 22,
    attendanceConfirmedCount: 16,
    waitlistCount: 0,
    availability: "available",
  },
  {
    id: "demo-event-2",
    title: "فعالية تجريبية ٢",
    audience: "youth",
    eventTypeLabel: "نوع تجريبي",
    startsAt: "2026-08-14T17:30:00+03:00",
    capacity: 20,
    registrationCount: 20,
    attendanceConfirmedCount: 13,
    waitlistCount: 4,
    availability: "full",
  },
  {
    id: "demo-event-3",
    title: "فعالية تجريبية ٣",
    audience: "children",
    eventTypeLabel: "نوع تجريبي",
    startsAt: "2026-08-22T16:00:00+03:00",
    capacity: 16,
    registrationCount: 9,
    attendanceConfirmedCount: 7,
    waitlistCount: 0,
    availability: "available",
  },
];
