import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabasePublishableKey, getSupabaseServerKey, getSupabaseUrl } from "@/lib/supabase/config";

const url = "https://example.supabase.co";
const publishableKey = "sb_publishable_test";
const serviceRoleKey = "service-role-test";

function setEnv(values: Record<string, string>) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
  for (const [name, value] of Object.entries(values)) vi.stubEnv(name, value);
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase config", () => {
  it("reads each value from its own variable", () => {
    setEnv({
      NEXT_PUBLIC_SUPABASE_URL: url,
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
    });

    expect(getSupabaseUrl()).toBe(url);
    expect(getSupabasePublishableKey()).toBe(publishableKey);
    expect(getSupabaseServerKey()).toBe(serviceRoleKey);
  });

  it("never resolves the browser key to a secret key", () => {
    setEnv({ SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey, SUPABASE_SECRET_KEY: "sb_secret_test" });

    expect(() => getSupabasePublishableKey()).toThrow("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  });

  it("never resolves the server key to a browser key", () => {
    setEnv({ NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: publishableKey, SUPABASE_ANON_KEY: "anon-test" });

    expect(() => getSupabaseServerKey()).toThrow("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("requires the public URL variable", () => {
    setEnv({ SUPABASE_URL: url });

    expect(() => getSupabaseUrl()).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });
});
