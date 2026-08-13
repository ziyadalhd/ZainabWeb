import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl, isSiteIndexingEnabled } from "@/lib/site-url";

const originalSiteUrl = process.env.SITE_URL;
const originalVercelEnvironment = process.env.VERCEL_ENV;
const originalIndexingFlag = process.env.SITE_INDEXING_ENABLED;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = originalSiteUrl;
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnvironment;
  if (originalIndexingFlag === undefined) delete process.env.SITE_INDEXING_ENABLED;
  else process.env.SITE_INDEXING_ENABLED = originalIndexingFlag;
});

describe("site URL and indexing", () => {
  it("uses the approved temporary public Vercel origin by default", () => {
    delete process.env.SITE_URL;
    expect(getSiteUrl().toString()).toBe("https://bayn-cultural-club.vercel.app/");
  });

  it("normalizes a configured site URL to its origin", () => {
    process.env.SITE_URL = "https://example.test/some/path";
    expect(getSiteUrl().toString()).toBe("https://example.test/");
  });

  it("requires both production and an explicit launch flag before indexing", () => {
    process.env.SITE_INDEXING_ENABLED = "true";
    process.env.VERCEL_ENV = "preview";
    expect(isSiteIndexingEnabled()).toBe(false);
    process.env.VERCEL_ENV = "production";
    expect(isSiteIndexingEnabled()).toBe(true);
  });
});
