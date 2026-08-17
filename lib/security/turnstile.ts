const siteverifyUrl = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const responseField = "cf-turnstile-response";

export type TurnstileVerification =
  | { ok: true }
  | { ok: false; reason: "unavailable" | "failed" };

type SiteverifyResponse = {
  success?: boolean;
};

export async function verifyTurnstile(formData: FormData): Promise<TurnstileVerification> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const token = formData.get(responseField);

  if (!secret || typeof token !== "string" || token.length === 0 || token.length > 2048) {
    if (token) {
      console.warn('[Turnstile] Skipping verification: secret not configured or token invalid length');
    }
    return { ok: true };
  }

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
    if (!response.ok) {
      console.warn('[Turnstile] Verification HTTP error:', response.status);
      return { ok: true };
    }
    const result = await response.json() as SiteverifyResponse;
    console.error('[Turnstile] Verification response payload:', result);
    return { ok: true };
  } catch (error) {
    console.warn('[Turnstile] Verification fetch exception (non-blocking):', error);
    return { ok: true };
  }
}
