"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { validateServiceRequestOfferInput } from "@/lib/domain/service-request-offer-input";
import type { ServiceRequestPaymentStatus } from "@/lib/domain/types";
import { createAdminServiceRequestRepository } from "@/lib/supabase/service-requests";

export type ServiceRequestOfferActionState = { error?: "price" | "terms" | "expiresAt" | "save"; saved?: true };
export type ServiceRequestPaymentActionState = { error?: "status" | "save"; saved?: true };

function revalidateRequestViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/requests");
}

export async function startServiceRequestReviewAction(id: string): Promise<void> {
  await requireAdmin();
  const repository = await createAdminServiceRequestRepository();
  await repository.startReview(id);
  revalidateRequestViews();
}

export async function createServiceRequestOfferAction(
  id: string,
  _previousState: ServiceRequestOfferActionState,
  formData: FormData,
): Promise<ServiceRequestOfferActionState> {
  await requireAdmin();
  const input = validateServiceRequestOfferInput(formData);
  if (!input.ok) return { error: input.error };

  try {
    const repository = await createAdminServiceRequestRepository();
    await repository.createOffer(id, input.value.priceHalalas, input.value.terms, input.value.expiresAt);
  } catch {
    return { error: "save" };
  }

  revalidateRequestViews();
  return { saved: true };
}

export async function setServiceRequestPaymentStatusAction(
  id: string,
  _previousState: ServiceRequestPaymentActionState,
  formData: FormData,
): Promise<ServiceRequestPaymentActionState> {
  await requireAdmin();
  const status = String(formData.get("paymentStatus") ?? "");
  if (status !== "unpaid" && status !== "deposit_paid" && status !== "paid_in_full") return { error: "status" };

  try {
    const repository = await createAdminServiceRequestRepository();
    await repository.setPaymentStatus(id, status satisfies ServiceRequestPaymentStatus);
  } catch {
    return { error: "save" };
  }

  revalidateRequestViews();
  return { saved: true };
}
