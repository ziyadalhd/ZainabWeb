import { cache } from "react";
import { redirect } from "next/navigation";
import { getAdminMfaDestination, type AuthenticatorAssuranceLevel } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminIdentity {
  id: string;
  email?: string;
}

export interface AdminFirstFactorSession extends AdminIdentity {
  currentLevel: AuthenticatorAssuranceLevel;
  nextLevel: AuthenticatorAssuranceLevel;
}

export const requireAdminFirstFactor = cache(async (): Promise<AdminFirstFactorSession> => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const subject = typeof claims?.sub === "string" ? claims.sub : null;

  if (error || !subject) redirect("/admin/login");

  const { data: admin, error: adminError } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", subject)
    .maybeSingle();

  if (adminError || !admin) redirect("/admin/login?error=unauthorized");

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError || !assurance.currentLevel || !assurance.nextLevel) {
    redirect("/admin/login?error=session");
  }

  return {
    id: subject,
    email: typeof claims?.email === "string" ? claims.email : undefined,
    currentLevel: assurance.currentLevel,
    nextLevel: assurance.nextLevel,
  };
});

export const requireAdmin = cache(async (): Promise<AdminIdentity> => {
  const session = await requireAdminFirstFactor();
  const destination = getAdminMfaDestination(session.currentLevel, session.nextLevel);

  if (destination !== "/admin") redirect(destination);

  return { id: session.id, email: session.email };
});
