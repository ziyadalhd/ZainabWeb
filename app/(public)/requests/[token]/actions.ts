"use server";

import { revalidatePath } from "next/cache";
import { createServiceRequestService } from "@/lib/supabase/service-requests";

export async function cancelServiceRequestAction(token: string): Promise<{ error?: string; cancelled?: true }> {
  try {
    const service = await createServiceRequestService();
    await service.cancelByToken(token);
    revalidatePath(`/requests/${token}`);
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    return { cancelled: true };
  } catch {
    return { error: "تعذر إلغاء الطلب الآن." };
  }
}
