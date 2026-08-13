import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ listUpcomingEvents: vi.fn() }));

vi.mock("@/lib/supabase/events", () => ({
  createEventCatalog: vi.fn(async () => ({ listUpcomingEvents: mocks.listUpcomingEvents })),
}));

import sitemap from "@/app/sitemap";

describe("sitemap metadata", () => {
  beforeEach(() => {
    delete process.env.SITE_URL;
    mocks.listUpcomingEvents.mockReset();
    mocks.listUpcomingEvents.mockResolvedValue([]);
  });

  it("includes only approved public routes and excludes private route families", async () => {
    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);
    expect(urls).toContain("https://bayn-cultural-club.vercel.app/events");
    expect(urls.some((url) => url.includes("/admin"))).toBe(false);
    expect(urls.some((url) => url.includes("/bookings/"))).toBe(false);
    expect(urls.some((url) => url.includes("/requests/"))).toBe(false);
  });

  it("adds upcoming published events returned by the public catalog", async () => {
    mocks.listUpcomingEvents.mockResolvedValue([{ id: "event-id", updatedAt: "2026-08-13T10:00:00.000Z" }]);
    const entries = await sitemap();
    expect(entries).toContainEqual(expect.objectContaining({
      url: "https://bayn-cultural-club.vercel.app/events/event-id",
      priority: 0.8,
    }));
  });

  it("keeps the static sitemap available when the event catalog is unavailable", async () => {
    mocks.listUpcomingEvents.mockRejectedValue(new Error("unavailable"));
    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toContain("https://bayn-cultural-club.vercel.app/");
  });
});
