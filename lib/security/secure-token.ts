import { createHash, randomBytes } from "node:crypto";

const secureTokenPattern = /^[A-Za-z0-9_-]{43}$/;

export function generateSecureToken(): string {
  return randomBytes(32).toString("base64url");
}

export function isSecureToken(value: string): boolean {
  return secureTokenPattern.test(value);
}

export function hashSecureToken(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}
