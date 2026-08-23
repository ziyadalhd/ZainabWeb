"use server";

import { revalidatePath } from "next/cache";
import type { ServiceRequestKind } from "@/lib/domain/types";
import { validateServiceRequestInput } from "@/lib/domain/service-request-input";
import { createServiceRequestService } from "@/lib/supabase/service-requests";

export type ServiceRequestActionState = {
  error?: string;
  reference?: string;
};

export async function submitServiceRequestAction(
  kind: ServiceRequestKind,
  _previousState: ServiceRequestActionState,
  formData: FormData,
): Promise<ServiceRequestActionState> {
  const input = validateServiceRequestInput(formData, kind);
  if (!input.ok) return { error: input.error };

  try {
    const service = await createServiceRequestService();
    const receipt = await service.submit(kind, input.value);
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    return { reference: receipt.reference };
  } catch {
    return { error: "save" };
  }
}
