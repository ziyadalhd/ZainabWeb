import { describe, expect, it } from "vitest";
import { adminNavigation } from "@/lib/navigation";

describe("adminNavigation", () => {
  it("gives every destination its own href with no duplicates (admin overhaul plan A3)", () => {
    const hrefs = adminNavigation.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("never declares activePrefixes that match another item's href", () => {
    for (const item of adminNavigation) {
      for (const other of adminNavigation) {
        if (other === item) continue;
        expect(item.activePrefixes ?? []).not.toContain(other.href);
      }
    }
  });

  it("keeps registrations reachable as its own top-level destination", () => {
    expect(adminNavigation.some((item) => item.href === "/admin/registrations")).toBe(true);
  });
});
