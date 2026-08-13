const fallbackSiteUrl = "https://bayn-cultural-club.vercel.app";

export function getSiteUrl(): URL {
  const configuredUrl = process.env.SITE_URL?.trim();
  if (!configuredUrl) return new URL(fallbackSiteUrl);

  try {
    const url = new URL(configuredUrl);
    if (url.protocol !== "https:" && url.protocol !== "http:") return new URL(fallbackSiteUrl);
    return new URL(url.origin);
  } catch {
    return new URL(fallbackSiteUrl);
  }
}

export function isSiteIndexingEnabled(): boolean {
  return process.env.VERCEL_ENV === "production" && process.env.SITE_INDEXING_ENABLED === "true";
}
