const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const responseField = "cf-turnstile-response";

export type TurnstileVerification =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "failed" };

export function isTurnstileEnabled(): boolean {
  return process.env.VERCEL_ENV === "production"
    || process.env.TURNSTILE_ENFORCE === "true"
    || Boolean(process.env.TURNSTILE_SECRET_KEY);
}

type SiteverifyResponse = {
  success?: boolean;
};

export async function verifyTurnstile(formData: FormData): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const token = formData.get(responseField);

  if (!isTurnstileEnabled()) return { ok: true };
  if (!secret) return { ok: false, reason: "unavailable" };
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return { ok: false, reason: "failed" };

  const payload = new FormData();
  payload.set("secret", secret);
  payload.set("response", token);

  try {
    const response = await fetch(siteverifyUrl, {
      method: "POST",
      body: payload,
      signal: AbortSignal.timeout(5_000),
      cache: "no-store",
    });
    if (!response.ok) return { ok: false, reason: "unavailable" };
    const result = await response.json() as SiteverifyResponse;
    return result.success ? { ok: true } : { ok: false, reason: "failed" };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
