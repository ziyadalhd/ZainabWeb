import type { AdminDashboardSource, EventCatalog } from "@/lib/data/contracts";
import { demoAdminSnapshot } from "@/lib/demo/admin-dashboard";
import { demoEvents } from "@/lib/demo/events";

export const demoEventCatalog: EventCatalog = {
  async listEvents() {
    return demoEvents;
  },
};

export const demoAdminDashboardSource: AdminDashboardSource = {
  async getSnapshot() {
    return demoAdminSnapshot;
  },
};
