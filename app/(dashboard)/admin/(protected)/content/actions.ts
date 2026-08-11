"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validateSiteSettingsInput } from "@/lib/domain/site-settings-input";
import { createAdminSiteSettingsRepository } from "@/lib/supabase/site-settings";

export type SiteSettingsActionState = { saved?: true; error?: "phone" | "socialUrl" | "text" | "save" };

export async function updateSiteSettingsAction(
  _previousState: SiteSettingsActionState,
  formData: FormData,
): Promise<SiteSettingsActionState> {
  void _previousState;
  await requireAdmin();
  const input = validateSiteSettingsInput(formData);
  if (!input.ok) return { error: input.error };

  try {
    const repository = await createAdminSiteSettingsRepository();
    await repository.update(input.value);
  } catch {
    return { error: "save" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/literary-partner");
  revalidatePath("/admin/content");
  return { saved: true };
}
