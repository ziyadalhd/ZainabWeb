import { afterEach, describe, expect, it } from "vitest";
import robots from "@/app/robots";

const originalVercelEnvironment = process.env.VERCEL_ENV;
const originalIndexingFlag = process.env.SITE_INDEXING_ENABLED;

afterEach(() => {
  if (originalVercelEnvironment === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnvironment;
  if (originalIndexingFlag === undefined) delete process.env.SITE_INDEXING_ENABLED;
  else process.env.SITE_INDEXING_ENABLED = originalIndexingFlag;
});

describe("robots metadata", () => {
  it("blocks all indexing before the explicit production launch", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.SITE_INDEXING_ENABLED = "true";
    expect(robots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("allows public pages but excludes admin and secure-link routes after launch", () => {
    process.env.VERCEL_ENV = "production";
    process.env.SITE_INDEXING_ENABLED = "true";
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(rules?.disallow).toContain("/admin");
    expect(rules?.disallow).toContain("/bookings");
    expect(result.sitemap).toBe("https://bayn-cultural-club.vercel.app/sitemap.xml");
  });
});
