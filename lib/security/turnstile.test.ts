import { afterEach, describe, expect, it, vi } from "vitest";

const originalEnvironment = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnvironment };
  vi.unstubAllGlobals();
});

describe("verifyTurnstile", () => {
  it("does not block local development before a widget is configured", async () => {
    process.env.VERCEL_ENV = "preview";
    delete process.env.TURNSTILE_ENFORCE;
    const { verifyTurnstile } = await import("@/lib/security/turnstile");
    await expect(verifyTurnstile(new FormData())).resolves.toEqual({ ok: true });
  });

  it("is non-blocking even without a valid token or secret", async () => {
    process.env.TURNSTILE_ENFORCE = "true";
    delete process.env.TURNSTILE_SECRET_KEY;
    const { verifyTurnstile } = await import("@/lib/security/turnstile");
    await expect(verifyTurnstile(new FormData())).resolves.toEqual({ ok: true });
  });

  it("passes when Siteverify responds", async () => {
    process.env.TURNSTILE_ENFORCE = "true";
    process.env.TURNSTILE_SECRET_KEY = "test-secret";
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const { verifyTurnstile } = await import("@/lib/security/turnstile");
    const formData = new FormData();
    formData.set("cf-turnstile-response", "token");
    await expect(verifyTurnstile(formData)).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});
