"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRegistrationService,
  RegistrationFailure,
} from "@/lib/supabase/registrations";

export interface InvitationActionState {
  success?: true;
  error?: "unavailable" | "save";
}

export async function acceptWaitlistInvitationAction(
  token: string,
  _previousState: InvitationActionState,
): Promise<InvitationActionState> {
  void _previousState;
  let failure: InvitationActionState["error"];
  try {
    const service = await createRegistrationService();
    await service.acceptWaitlistInvitation(token);
    revalidatePath("/admin/registrations/current");
    revalidatePath("/admin/registrations");
    revalidatePath("/admin/waitlist");
  } catch (error) {
    if (error instanceof RegistrationFailure && error.code === "unavailable") {
      failure = "unavailable";
    } else {
      failure = "save";
    }
  }
  if (failure) return { error: failure };
  redirect("/waitlist-invitations/accepted");
}
