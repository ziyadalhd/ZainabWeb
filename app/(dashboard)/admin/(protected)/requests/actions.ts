"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";

export async function startServiceRequestReviewAction(id: string): Promise<void> {
  await requireAdmin();
  const repository = await createAdminServiceRequestRepository();
  await repository.startReview(id);
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
}
