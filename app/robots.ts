import type { MetadataRoute } from "next";
import { getSiteUrl, isSiteIndexingEnabled } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  if (!isSiteIndexingEnabled()) {
    return {
      rules: { userAgent: "*", disallow: "/" },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/bookings",
        "/requests",
        "/waitlist-invitations",
        "/surveys/event-feedback",
        "/surveys/interested-contact/confirmed",
        "/surveys/interested-contact/unsubscribe",
      ],
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
  };
}
