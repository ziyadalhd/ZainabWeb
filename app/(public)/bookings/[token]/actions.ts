"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { notifyAttendanceConfirmed, notifyRegistrationCancelled } from "@/lib/notifications/admin-alerts";
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
    const booking = await service.getBooking(token).catch(() => null);
    if (operation === "confirm") await service.confirmBookingAttendance(token);
    if (operation === "cancel") await service.cancelBooking(token);
    revalidatePath("/admin/registrations");
    if (booking) {
      const alertInput = { attendeeName: booking.attendeeName, eventTitle: booking.eventTitle };
      if (operation === "confirm") await notifyAttendanceConfirmed(alertInput);
      if (operation === "cancel") await notifyRegistrationCancelled(alertInput);
    }
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
