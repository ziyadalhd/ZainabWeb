import { cache } from "react";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminIdentity {
  id: string;
  email?: string;
}

export const requireAdmin = cache(async (): Promise<AdminIdentity> => {
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

  return {
    id: subject,
    email: typeof claims?.email === "string" ? claims.email : undefined,
  };
});
