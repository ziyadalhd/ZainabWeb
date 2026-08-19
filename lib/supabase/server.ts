import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseConfig, getSupabaseServerKey } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const { url, publishableKey } = getSupabaseConfig();

  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // In contexts where cookies() is not available
  }

  return createServerClient<Database>(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore?.set(name, value, options);
          });
        } catch {
          // Server Components cannot write cookies. Proxy handles refresh writes.
        }
      },
    },
  });
}

export function createSupabaseServiceClient() {
  const { url } = getSupabaseConfig();
  const serverKey = getSupabaseServerKey();
  return createClient<Database>(url, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
