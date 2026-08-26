import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
  signInWithPassword: vi.fn(),
  getClaims: vi.fn(),
  signOut: vi.fn(),
  maybeSingle: vi.fn(),
  getAuthenticatorAssuranceLevel: vi.fn(),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      signInWithPassword: mocks.signInWithPassword,
      getClaims: mocks.getClaims,
      signOut: mocks.signOut,
      mfa: { getAuthenticatorAssuranceLevel: mocks.getAuthenticatorAssuranceLevel },
    },
    from: () => ({ select: () => ({ eq: () => ({ maybeSingle: mocks.maybeSingle }) }) }),
  })),
}));

import { loginAction, logoutAction } from "@/app/(dashboard)/admin/actions";

function credentials() {
  const formData = new FormData();
  formData.set("email", "admin@example.test");
  formData.set("password", "correct horse battery staple");
  return formData;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.signInWithPassword.mockResolvedValue({ error: null });
  mocks.getClaims.mockResolvedValue({ data: { claims: { sub: "user-1" } }, error: null });
  mocks.maybeSingle.mockResolvedValue({ data: { user_id: "user-1" } });
  mocks.getAuthenticatorAssuranceLevel.mockResolvedValue({
    data: { currentLevel: "aal2", nextLevel: "aal2" },
    error: null,
  });
});

describe("loginAction", () => {
  it("rejects a missing email or password before contacting Supabase", async () => {
    const formData = new FormData();
    formData.set("password", "x");

    await expect(loginAction(formData)).rejects.toThrow("REDIRECT:/admin/login?error=invalid");
    expect(mocks.signInWithPassword).not.toHaveBeenCalled();
  });

  it("redirects on invalid Supabase credentials", async () => {
    mocks.signInWithPassword.mockResolvedValueOnce({ error: { message: "invalid" } });

    await expect(loginAction(credentials())).rejects.toThrow("REDIRECT:/admin/login?error=invalid");
  });

  it("signs out and redirects when the authenticated user is not an allowlisted admin", async () => {
    mocks.maybeSingle.mockResolvedValueOnce({ data: null });

    await expect(loginAction(credentials())).rejects.toThrow("REDIRECT:/admin/login?error=unauthorized");
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("signs out and redirects when the MFA assurance level cannot be read", async () => {
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValueOnce({ data: {}, error: null });

    await expect(loginAction(credentials())).rejects.toThrow("REDIRECT:/admin/login?error=session");
    expect(mocks.signOut).toHaveBeenCalled();
  });

  it("routes a fully verified admin session to the dashboard", async () => {
    await expect(loginAction(credentials())).rejects.toThrow("REDIRECT:/admin");
    expect(mocks.signOut).not.toHaveBeenCalled();
  });

  it("routes an admin who has not completed MFA to the verify step", async () => {
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValueOnce({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });

    await expect(loginAction(credentials())).rejects.toThrow("REDIRECT:/admin/mfa/verify");
  });
});

describe("logoutAction", () => {
  it("signs out and redirects to the login page", async () => {
    await expect(logoutAction()).rejects.toThrow("REDIRECT:/admin/login");
    expect(mocks.signOut).toHaveBeenCalled();
  });
});
