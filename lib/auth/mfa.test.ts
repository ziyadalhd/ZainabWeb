import { describe, expect, it } from "vitest";
import { getAdminMfaDestination, normalizeMfaCode } from "@/lib/auth/mfa";

describe("admin MFA routing", () => {
  it("requires setup when no verified factor exists", () => {
    expect(getAdminMfaDestination("aal1", "aal1")).toBe("/admin/mfa/setup");
  });

  it("requires a challenge when a verified factor exists", () => {
    expect(getAdminMfaDestination("aal1", "aal2")).toBe("/admin/mfa/verify");
  });

  it("allows only an aal2 session into the dashboard", () => {
    expect(getAdminMfaDestination("aal2", "aal2")).toBe("/admin");
  });

  it("fails closed when the assurance level is missing", () => {
    expect(getAdminMfaDestination(null, null)).toBe("/admin/login?error=session");
  });
});

describe("normalizeMfaCode", () => {
  it("accepts Arabic-Indic and Eastern Arabic-Indic digits", () => {
    expect(normalizeMfaCode("١٢٣٤٥٦")).toBe("123456");
    expect(normalizeMfaCode("۱۲۳۴۵۶")).toBe("123456");
  });

  it("trims an ASCII code", () => {
    expect(normalizeMfaCode(" 123456 ")).toBe("123456");
  });
});
