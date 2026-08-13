import type { MetadataRoute } from "next";
import { createEventCatalog } from "@/lib/supabase/events";
import { getSiteUrl } from "@/lib/site-url";

const publicRoutes = [
  "",
  "/events",
  "/bayn-trips",
  "/space-booking",
  "/celebration-booking",
  "/literary-partner",
  "/contact",
  "/surveys",
  "/surveys/interested-contact",
  "/surveys/workshop-application",
  "/privacy",
  "/terms",
] as const;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const staticEntries: MetadataRoute.Sitemap = publicRoutes.map((path) => ({
    url: new URL(path || "/", siteUrl).toString(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/events" ? 0.9 : 0.7,
  }));

  try {
    const catalog = await createEventCatalog();
    const events = await catalog.listUpcomingEvents();
    return [
      ...staticEntries,
      ...events.map((event) => ({
        url: new URL(`/events/${event.id}`, siteUrl).toString(),
        lastModified: new Date(event.updatedAt),
        changeFrequency: "daily" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    return staticEntries;
  }
}
