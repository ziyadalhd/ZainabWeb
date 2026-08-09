"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createRegistrationService,
  RegistrationFailure,
} from "@/lib/supabase/registrations";

export interface BookingActionState {
  success?: "confirmed" | "cancelled";
  error?: "unavailable" | "save";
}

async function runBookingAction(
  token: string,
  operation: "confirm" | "cancel",
): Promise<BookingActionState> {
  try {
    const service = await createRegistrationService();
    if (operation === "confirm") await service.confirmBookingAttendance(token);
    if (operation === "cancel") await service.cancelBooking(token);
    revalidatePath("/admin/registrations/current");
    revalidatePath("/admin/waitlist");
    return { success: operation === "confirm" ? "confirmed" : "cancelled" };
  } catch (error) {
    if (error instanceof RegistrationFailure && error.code === "unavailable") {
      return { error: "unavailable" };
    }
    return { error: "save" };
  }
}

export async function confirmBookingAttendanceAction(
  token: string,
  _previousState: BookingActionState,
): Promise<BookingActionState> {
  void _previousState;
  return runBookingAction(token, "confirm");
}

export async function cancelBookingAction(
  token: string,
  _previousState: BookingActionState,
): Promise<BookingActionState> {
  void _previousState;
  const state = await runBookingAction(token, "cancel");
  if (state.success === "cancelled") redirect("/bookings/cancelled");
  return state;
}
