import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventCheckInMode } from "@/features/admin/components/EventCheckInMode";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { Registration } from "@/lib/domain/types";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

function makeRegistration(overrides: Partial<Registration>): Registration {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    reference: "REF-1",
    eventId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    eventTitle: "لقاء القراءة",
    eventStartsAt: "2026-08-12T15:00:00.000Z",
    attendeeName: "مشاركة",
    phoneE164: "+966500000001",
    email: null,
    participantAge: null,
    guardianName: null,
    guardianConsent: false,
    priceHalalasAtBooking: 0,
    status: "registered",
    attendanceStatus: "pending",
    checkInStatus: "pending",
    checkedInAt: null,
    paymentStatus: "unpaid",
    invitationExpiresAt: null,
    latestReminderPreparedAt: null,
    latestReminderSentAt: null,
    createdAt: "2026-08-09T15:00:00.000Z",
    ...overrides,
  };
}

describe("EventCheckInMode", () => {
  it("shows the arrived count and checks a registrant in with one tap", async () => {
    const registrations = [
      makeRegistration({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", attendeeName: "سارة" }),
      makeRegistration({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", attendeeName: "نورة", checkInStatus: "checked_in" }),
    ];
    const recordCheckIn = vi.fn(async () => ({ status: "success" as const }));

    render(
      <ToastProvider>
        <EventCheckInMode registrations={registrations} recordCheckIn={recordCheckIn} />
      </ToastProvider>,
    );

    expect(screen.getByText("١")).toBeInTheDocument();
    expect(screen.getByText("✓ حضرت")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "تسجيل الحضور" }));

    await waitFor(() => expect(recordCheckIn).toHaveBeenCalledWith("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "checked_in", expect.anything(), expect.anything()));
  });

  it("filters the roster by name or phone as the admin types", () => {
    const registrations = [
      makeRegistration({ id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", attendeeName: "سارة", phoneE164: "+966500000001" }),
      makeRegistration({ id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", attendeeName: "نورة", phoneE164: "+966500000002" }),
    ];
    const recordCheckIn = vi.fn(async () => ({ status: "success" as const }));

    render(
      <ToastProvider>
        <EventCheckInMode registrations={registrations} recordCheckIn={recordCheckIn} />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "نورة" } });

    expect(screen.queryByText("سارة")).not.toBeInTheDocument();
    expect(screen.getByText("نورة")).toBeInTheDocument();
  });
});
