export type AuthenticatorAssuranceLevel = "aal1" | "aal2" | (string & {}) | null;

export type AdminMfaDestination =
  | "/admin"
  | "/admin/mfa/setup"
  | "/admin/mfa/verify"
  | "/admin/login?error=session";

export function getAdminMfaDestination(
  currentLevel: AuthenticatorAssuranceLevel,
  nextLevel: AuthenticatorAssuranceLevel,
): AdminMfaDestination {
  if (currentLevel === "aal2") return "/admin";
  if (currentLevel !== "aal1") return "/admin/login?error=session";
  if (nextLevel === "aal2") return "/admin/mfa/verify";
  if (nextLevel === "aal1") return "/admin/mfa/setup";
  return "/admin/login?error=session";
}

export function normalizeMfaCode(value: string) {
  return value
    .trim()
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));
}

/**
 * Shown as the account issuer inside the authenticator app. Without it
 * Supabase falls back to the project's Site URL, which renders enrolled
 * devices as "localhost:3000".
 */
export const ADMIN_MFA_ISSUER = "Bayn Cultural Club";
