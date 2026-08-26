"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";

function revalidateRequestViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
}

export async function markServiceRequestContactedAction(id: string): Promise<void> {
  await requireAdmin();
  try {
    const repository = await createAdminServiceRequestRepository();
    await repository.markContacted(id);
  } catch {
    return;
  }
  revalidateRequestViews();
}
