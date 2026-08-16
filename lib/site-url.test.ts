import { afterEach, describe, expect, it } from "vitest";
import { getSiteUrl, isSiteIndexingEnabled } from "@/lib/site-url";

const originalSiteUrl = process.env.SITE_URL;
const originalDisabledFlag = process.env.SITE_INDEXING_DISABLED;

afterEach(() => {
  if (originalSiteUrl === undefined) delete process.env.SITE_URL;
  else process.env.SITE_URL = originalSiteUrl;
  if (originalDisabledFlag === undefined) delete process.env.SITE_INDEXING_DISABLED;
  else process.env.SITE_INDEXING_DISABLED = originalDisabledFlag;
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

  it("enables site indexing by default and allows explicit disabling", () => {
    delete process.env.SITE_INDEXING_DISABLED;
    expect(isSiteIndexingEnabled()).toBe(true);
    process.env.SITE_INDEXING_DISABLED = "true";
    expect(isSiteIndexingEnabled()).toBe(false);
  });
});
