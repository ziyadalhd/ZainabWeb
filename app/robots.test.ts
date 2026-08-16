import { describe, expect, it } from "vitest";
import robots from "@/app/robots";

describe("robots metadata", () => {
  it("allows public search engine crawling and indexes public pages while excluding admin and private routes", () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules[0] : result.rules;
    expect(rules).toMatchObject({ userAgent: "*", allow: "/" });
    expect(rules?.disallow).toContain("/admin");
    expect(rules?.disallow).toContain("/bookings");
    expect(rules?.disallow).toContain("/requests");
    expect(rules?.disallow).toContain("/waitlist-invitations");
    expect(rules?.disallow).toContain("/surveys/event-feedback");
    expect(rules?.disallow).toContain("/surveys/interested-contact/confirmed");
    expect(rules?.disallow).toContain("/surveys/interested-contact/unsubscribe");
    expect(result.sitemap).toBe("https://bayn-cultural-club.vercel.app/sitemap.xml");
  });
});
