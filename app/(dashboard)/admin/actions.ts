"use server";

import { redirect } from "next/navigation";
import { getAdminMfaDestination } from "@/lib/auth/mfa";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/admin/login?error=invalid");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=invalid");

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  const subject = typeof claimsData?.claims?.sub === "string" ? claimsData.claims.sub : null;
  let authorized = false;

  if (!claimsError && subject) {
    const { data: admin } = await supabase
      .from("admin_users")
      .select("user_id")
      .eq("user_id", subject)
      .maybeSingle();
    authorized = Boolean(admin);
  }

  if (!authorized) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=unauthorized");
  }

  const { data: assurance, error: assuranceError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  if (assuranceError || !assurance.currentLevel || !assurance.nextLevel) {
    await supabase.auth.signOut();
    redirect("/admin/login?error=session");
  }

  redirect(getAdminMfaDestination(assurance.currentLevel, assurance.nextLevel));
}

export async function logoutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
