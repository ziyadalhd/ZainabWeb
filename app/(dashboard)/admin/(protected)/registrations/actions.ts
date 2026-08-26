"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isRegistrationCheckInStatus, isRegistrationPaymentStatus } from "@/lib/domain/registration-input";
import type { RegistrationPaymentStatus } from "@/lib/domain/types";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";
import type { ActionResult } from "@/lib/data/action-result";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function revalidateRegistrationViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
}

async function runRegistrationMutation(
  id: string,
  operation: "cancel" | "revoke" | "confirm",
): Promise<ActionResult> {
  await requireAdmin();
  if (!uuidPattern.test(id)) return { status: "error", message: "معرف التسجيل غير صالح." };

  try {
    const repository = await createAdminRegistrationRepository();
    if (operation === "cancel") await repository.cancel(id);
    if (operation === "revoke") await repository.revokeInvitation(id);
    if (operation === "confirm") await repository.confirmAttendance(id);
  } catch {
    return { status: "error" };
  }

  revalidateRegistrationViews();
  return { status: "success" };
}

export async function cancelRegistrationAction(id: string, _state: ActionResult, _formData: FormData): Promise<ActionResult> {
  void _state; void _formData;
  return runRegistrationMutation(id, "cancel");
}

export async function revokeInvitationAction(id: string, _state: ActionResult, _formData: FormData): Promise<ActionResult> {
  void _state; void _formData;
  return runRegistrationMutation(id, "revoke");
}

export async function confirmAttendanceAction(id: string, _state: ActionResult, _formData: FormData): Promise<ActionResult> {
  void _state; void _formData;
  return runRegistrationMutation(id, "confirm");
}

export interface RegistrationPaymentActionState {
  saved?: true;
  error?: "status" | "save";
}

export async function recordCheckInAction(id: string, outcome: string, _state: ActionResult, _formData: FormData): Promise<ActionResult> {
  void _state; void _formData;
  await requireAdmin();
  if (!uuidPattern.test(id) || !isRegistrationCheckInStatus(outcome) || outcome === "pending") {
    return { status: "error", message: "تعذر حفظ حالة الحضور." };
  }

  try {
    const repository = await createAdminRegistrationRepository();
    await repository.recordCheckIn(id, outcome);
  } catch {
    return { status: "error" };
  }

  revalidateRegistrationViews();
  return { status: "success" };
}

export async function setRegistrationPaymentStatusAction(
  id: string,
  _previousState: RegistrationPaymentActionState,
  formData: FormData,
): Promise<RegistrationPaymentActionState> {
  await requireAdmin();
  const status = String(formData.get("paymentStatus") ?? "");
  if (!uuidPattern.test(id) || !isRegistrationPaymentStatus(status)) return { error: "status" };

  try {
    const repository = await createAdminRegistrationRepository();
    await repository.setPaymentStatus(id, status satisfies RegistrationPaymentStatus);
  } catch {
    return { error: "save" };
  }

  revalidateRegistrationViews();
  return { saved: true };
}
