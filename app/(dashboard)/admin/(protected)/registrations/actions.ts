"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";
import { isRegistrationCheckInStatus } from "@/lib/domain/registration-input";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function revalidateRegistrationViews() {
  revalidatePath("/admin");
  revalidatePath("/admin/registrations/current");
  revalidatePath("/admin/registrations/previous");
  revalidatePath("/admin/waitlist");
}

async function runRegistrationAction(
  id: string,
  operation: "cancel" | "revoke" | "confirm",
  successPath: string,
) {
  await requireAdmin();
  if (!uuidPattern.test(id)) redirect(`${successPath}?error=invalid`);

  let failed = false;
  try {
    const repository = await createAdminRegistrationRepository();
    if (operation === "cancel") await repository.cancel(id);
    if (operation === "revoke") await repository.revokeInvitation(id);
    if (operation === "confirm") await repository.confirmAttendance(id);
  } catch {
    failed = true;
  }

  if (failed) redirect(`${successPath}?error=${operation}`);
  revalidateRegistrationViews();
  redirect(`${successPath}?success=${operation}`);
}

export async function cancelRegistrationAction(id: string) {
  await runRegistrationAction(id, "cancel", "/admin/registrations/current");
}

export async function cancelWaitlistedRegistrationAction(id: string) {
  await runRegistrationAction(id, "cancel", "/admin/waitlist");
}

export interface WaitlistInviteActionState {
  invitationPath?: string;
  expiresAt?: string;
  error?: "invalid" | "capacity" | "save";
}

export async function inviteRegistrationAction(
  id: string,
  _previousState: WaitlistInviteActionState,
): Promise<WaitlistInviteActionState> {
  void _previousState;
  await requireAdmin();
  if (!uuidPattern.test(id)) return { error: "invalid" };

  try {
    const repository = await createAdminRegistrationRepository();
    const invitation = await repository.invite(id);
    revalidateRegistrationViews();
    return {
      invitationPath: `/waitlist-invitations/${invitation.token}`,
      expiresAt: invitation.expiresAt,
    };
  } catch {
    return { error: "save" };
  }
}

export async function revokeInvitationAction(id: string) {
  await runRegistrationAction(id, "revoke", "/admin/waitlist");
}

export async function confirmAttendanceAction(id: string) {
  await runRegistrationAction(id, "confirm", "/admin/registrations/current");
}

export async function recordCheckInAction(id: string, outcome: string) {
  await requireAdmin();
  if (!uuidPattern.test(id) || !isRegistrationCheckInStatus(outcome) || outcome === "pending") {
    redirect("/admin/registrations/current?error=check-in");
  }

  try {
    const repository = await createAdminRegistrationRepository();
    await repository.recordCheckIn(id, outcome);
  } catch {
    redirect("/admin/registrations/current?error=check-in");
  }

  revalidateRegistrationViews();
  redirect("/admin/registrations/current?success=check-in");
}
