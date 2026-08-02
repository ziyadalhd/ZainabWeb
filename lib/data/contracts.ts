import type { AdminDashboardSnapshot, Event } from "@/lib/domain/types";

export interface EventCatalog {
  listEvents(): Promise<readonly Event[]>;
}

export interface AdminDashboardSource {
  getSnapshot(): Promise<AdminDashboardSnapshot>;
}
