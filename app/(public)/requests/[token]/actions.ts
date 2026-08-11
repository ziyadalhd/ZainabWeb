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

export async function respondToServiceRequestOfferAction(
  token: string,
  response: "accepted" | "rejected",
): Promise<{ error?: string; responded?: "accepted" | "rejected" }> {
  try {
    const service = await createServiceRequestService();
    await service.respondToOfferByToken(token, response);
    revalidatePath(`/requests/${token}`);
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    return { responded: response };
  } catch {
    return { error: "تعذر تسجيل ردك على العرض الآن. قد تكون صلاحيته انتهت." };
  }
}
