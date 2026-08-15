"use server";

import { revalidatePath } from "next/cache";
import type { ServiceRequestKind } from "@/lib/domain/types";
import { validateServiceRequestInput } from "@/lib/domain/service-request-input";
import { createServiceRequestService, ServiceRequestFailure } from "@/lib/supabase/service-requests";
import { verifyTurnstile } from "@/lib/security/turnstile";

export type ServiceRequestActionState = {
  error?: string;
  reference?: string;
  managementPath?: string;
};

export async function submitServiceRequestAction(
  kind: ServiceRequestKind,
  _previousState: ServiceRequestActionState,
  formData: FormData,
): Promise<ServiceRequestActionState> {
  const turnstile = await verifyTurnstile(formData);
  if (!turnstile.ok) return { error: "turnstile" };

  const input = validateServiceRequestInput(formData, kind);
  if (!input.ok) return { error: input.error };

  try {
    const service = await createServiceRequestService();
    const receipt = await service.submit(kind, input.value);
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    return {
      reference: receipt.reference,
      managementPath: `/requests/${receipt.managementToken}`,
    };
  } catch (error) {
    return { error: error instanceof ServiceRequestFailure && error.code === "invalid" ? "invalid" : "save" };
  }
}
