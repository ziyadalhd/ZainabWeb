import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  claims: vi.fn(),
  adminRow: vi.fn(),
  assurance: vi.fn(),
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({
    auth: {
      getClaims: mocks.claims,
      mfa: { getAuthenticatorAssuranceLevel: mocks.assurance },
    },
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: mocks.adminRow }) }),
    }),
  }),
}));

import { requireAdmin } from "@/lib/auth/require-admin";

const adminId = "11111111-1111-4111-8111-111111111111";

function signedInAdmin(currentLevel: string, nextLevel: string) {
  mocks.claims.mockResolvedValue({ data: { claims: { sub: adminId, email: "admin@example.test" } }, error: null });
  mocks.adminRow.mockResolvedValue({ data: { user_id: adminId }, error: null });
  mocks.assurance.mockResolvedValue({ data: { currentLevel, nextLevel }, error: null });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAdmin", () => {
  it("admits an allowlisted admin whose session completed MFA", async () => {
    signedInAdmin("aal2", "aal2");

    await expect(requireAdmin()).resolves.toEqual({ id: adminId, email: "admin@example.test" });
  });

  // The database's private.is_admin() requires aal2, while the admin_users row is readable at
  // aal1. Admitting an aal1 session would show an admin a dashboard the database treats as a
  // visitor's: no drafts, no registrations, and saves that silently change nothing.
  it("sends an aal1 admin with a verified device to the challenge instead of admitting her", async () => {
    signedInAdmin("aal1", "aal2");

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/mfa/verify");
  });

  it("sends an admin with no device yet to enrollment", async () => {
    signedInAdmin("aal1", "aal1");

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/mfa/setup");
  });

  it("sends a signed-in user who is not on the allowlist back to login", async () => {
    signedInAdmin("aal2", "aal2");
    mocks.adminRow.mockResolvedValue({ data: null, error: null });

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?error=unauthorized");
  });

  it("sends an anonymous visitor to login", async () => {
    mocks.claims.mockResolvedValue({ data: { claims: null }, error: null });

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login");
  });

  it("fails closed when the assurance level cannot be read", async () => {
    signedInAdmin("aal2", "aal2");
    mocks.assurance.mockResolvedValue({ data: null, error: new Error("unavailable") });

    await expect(requireAdmin()).rejects.toThrow("REDIRECT:/admin/login?error=session");
  });
});
