"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isRegistrationCheckInStatus, isRegistrationPaymentStatus } from "@/lib/domain/registration-input";
import type { RegistrationPaymentStatus } from "@/lib/domain/types";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function revalidateRegistrationViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/registrations");
}

async function runRegistrationAction(
  id: string,
  operation: "cancel" | "revoke" | "confirm",
  successPath: string,
) {
  await requireAdmin();
  const withResult = (key: "success" | "error", value: string) => `${successPath}${successPath.includes("?") ? "&" : "?"}${key}=${value}`;
  if (!uuidPattern.test(id)) redirect(withResult("error", "invalid"));

  let failed = false;
  try {
    const repository = await createAdminRegistrationRepository();
    if (operation === "cancel") await repository.cancel(id);
    if (operation === "revoke") await repository.revokeInvitation(id);
    if (operation === "confirm") await repository.confirmAttendance(id);
  } catch {
    failed = true;
  }

  if (failed) redirect(withResult("error", operation));
  revalidateRegistrationViews();
  redirect(withResult("success", operation));
}

export async function cancelRegistrationAction(id: string) {
  await runRegistrationAction(id, "cancel", "/admin/registrations?view=upcoming");
}

export async function cancelWaitlistedRegistrationAction(id: string) {
  await runRegistrationAction(id, "cancel", "/admin/registrations?view=waitlist");
}

export interface RegistrationPaymentActionState {
  saved?: true;
  error?: "status" | "save";
}

export async function revokeInvitationAction(id: string) {
  await runRegistrationAction(id, "revoke", "/admin/registrations?view=waitlist");
}

export async function confirmAttendanceAction(id: string) {
  await runRegistrationAction(id, "confirm", "/admin/registrations?view=upcoming");
}

export async function recordCheckInAction(id: string, outcome: string) {
  await requireAdmin();
  if (!uuidPattern.test(id) || !isRegistrationCheckInStatus(outcome) || outcome === "pending") {
    redirect("/admin/registrations?view=upcoming&error=check-in");
  }

  try {
    const repository = await createAdminRegistrationRepository();
    await repository.recordCheckIn(id, outcome);
  } catch {
    redirect("/admin/registrations?view=upcoming&error=check-in");
  }

  revalidateRegistrationViews();
  redirect("/admin/registrations?view=upcoming&success=check-in");
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
