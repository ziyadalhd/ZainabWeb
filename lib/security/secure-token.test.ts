import { describe, expect, it } from "vitest";
import {
  generateSecureToken,
  hashSecureToken,
  isSecureToken,
} from "@/lib/security/secure-token";

describe("secure token", () => {
  it("generates URL-safe 256-bit tokens and stores only deterministic hashes", () => {
    const first = generateSecureToken();
    const second = generateSecureToken();

    expect(first).not.toBe(second);
    expect(isSecureToken(first)).toBe(true);
    expect(first).toHaveLength(43);
    expect(hashSecureToken(first)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSecureToken(first)).toBe(hashSecureToken(first));
    expect(hashSecureToken(first)).not.toContain(first);
  });

  it("rejects malformed public tokens", () => {
    expect(isSecureToken("short")).toBe(false);
    expect(isSecureToken("a".repeat(42) + "/")).toBe(false);
  });
});
