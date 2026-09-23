/**
 * Each value comes from exactly one variable, and a missing one throws. There are no fallbacks:
 * a fallback chain once let the browser key resolve to the service-role key.
 *
 * `NEXT_PUBLIC_` variables are read with literal property names so Next.js inlines them into
 * the browser bundle.
 */

function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`${name} is not set.`);
  }
  return value;
}

export function getSupabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getSupabasePublishableKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

/**
 * A secret key (`sb_secret_...`), which replaces the legacy `service_role` JWT. Bypasses RLS.
 * Server-only: never import a caller of this into a Client Component.
 */
export function getSupabaseServerKey(): string {
  return required("SUPABASE_SECRET_KEY", process.env.SUPABASE_SECRET_KEY);
}

export function getSupabaseConfig() {
  return {
    url: getSupabaseUrl(),
    publishableKey: getSupabasePublishableKey(),
  };
}
