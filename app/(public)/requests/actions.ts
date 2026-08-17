"use server";

import { revalidatePath } from "next/cache";
import type { ServiceRequestKind } from "@/lib/domain/types";
import { validateServiceRequestInput } from "@/lib/domain/service-request-input";
import { createServiceRequestService } from "@/lib/supabase/service-requests";
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
  console.error('[ServiceRequest] Raw FormData:', Object.fromEntries(formData.entries()));

  const turnstile = await verifyTurnstile(formData);
  console.error('[ServiceRequest] Turnstile status:', {
    hasToken: Boolean(formData.get("cf-turnstile-response")),
    result: turnstile,
  });
  if (!turnstile.ok) return { error: "turnstile" };

  const input = validateServiceRequestInput(formData, kind);
  if (!input.ok) {
    console.error('[ServiceRequest] Validation failed with error:', input.error);
    return { error: input.error };
  }

  try {
    const service = await createServiceRequestService();
    const receipt = await service.submit(kind, input.value);
    revalidatePath("/admin");
    revalidatePath("/admin/requests");
    return {
      reference: receipt.reference,
      managementPath: `/requests/${receipt.managementToken}`,
    };
  } catch (error: unknown) {
    console.error('[ServiceRequest Action Error] Full error object:', error);
    const message = error instanceof Error ? error.message : String(error);
    return { error: message || "save" };
  }
}
