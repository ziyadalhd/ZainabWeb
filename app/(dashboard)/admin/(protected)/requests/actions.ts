"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isEntityId } from "@/lib/domain/entity-id";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";
import type { ActionResult } from "@/lib/data/action-result";

function revalidateRequestViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
}

export async function markServiceRequestContactedAction(id: string, _state: ActionResult, _formData: FormData): Promise<ActionResult> {
  void _state; void _formData;
  await requireAdmin();
  if (!isEntityId(id)) return { status: "error", message: "معرف الطلب غير صالح." };

  try {
    const repository = await createAdminServiceRequestRepository();
    await repository.markContacted(id);
  } catch {
    return { status: "error" };
  }

  revalidateRequestViews();
  return { status: "success" };
}
