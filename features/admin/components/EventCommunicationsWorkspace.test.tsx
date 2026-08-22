import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventCommunicationsWorkspace } from "@/features/admin/components/EventCommunicationsWorkspace";
import type { Event, Registration } from "@/lib/domain/types";

const actions = vi.hoisted(() => ({
  open: vi.fn(),
  markSent: vi.fn(),
}));

vi.mock("@/app/(dashboard)/admin/(protected)/events/[id]/message-actions", () => ({
  openManualWhatsAppMessageAction: actions.open,
  markManualMessageSentAction: actions.markSent,
}));

const event: Event = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  title: "مجالسة مع كتاب",
  kind: "club_event",
  audience: "adults",
  eventTypeLabel: "لقاء",
  startsAt: "2099-08-21T15:00:00.000Z",
  endsAt: "2099-08-21T17:00:00.000Z",
  capacity: 20,
  activeReservationCount: 1,
  priceHalalas: 0,
  posterUrl: null,
  registrationStatus: "open",
  availability: "available",
  publicationStatus: "published",
  createdAt: "2099-08-01T12:00:00.000Z",
  updatedAt: "2099-08-01T12:00:00.000Z",
};

const registration: Registration = {
  id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  reference: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  eventId: event.id,
  eventTitle: event.title,
  eventStartsAt: event.startsAt,
  attendeeName: "نورة",
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
  confirmationSentAt: null,
  createdAt: "2099-08-02T12:00:00.000Z",
};

describe("EventCommunicationsWorkspace", () => {
  beforeEach(() => {
    actions.open.mockReset();
    actions.markSent.mockReset();
  });

  it("opens one prepared واتساب message then records sent separately", async () => {
    actions.open.mockResolvedValue({
      messageId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      kind: "confirmation",
      securePath: "/bookings/secure-person-token",
    });
    actions.markSent.mockResolvedValue({ sentAt: "2099-08-02T13:00:00.000Z" });
    const popup = {
      close: vi.fn(),
      document: {
        body: { textContent: "" },
        documentElement: { dir: "", lang: "" },
        title: "",
      },
      location: { href: "" },
    };
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    render(<EventCommunicationsWorkspace event={event} registrations={[registration]} messages={[]} reminderTemplate={null} />);

    fireEvent.click(screen.getByRole("button", { name: "فتح الرسالة في واتساب" }));
    await screen.findByRole("button", { name: "تم الإرسال" });
    expect(actions.open).toHaveBeenCalledWith(event.id, registration.id, "confirmation");
    expect(popup.location.href).toContain("https://wa.me/966500000001");
    expect(popup.location.href).toContain("secure-person-token");

    fireEvent.click(screen.getByRole("button", { name: "تم الإرسال" }));
    await waitFor(() => expect(actions.markSent).toHaveBeenCalledWith(event.id, "dddddddd-dddd-4ddd-8ddd-dddddddddddd"));
    await waitFor(() => expect(screen.getAllByText("أُرسلت يدويًا", { selector: ".message-state" })).toHaveLength(2));
  });

  it("does not claim delivery or reading anywhere in the workflow", () => {
    render(<EventCommunicationsWorkspace event={event} registrations={[registration]} messages={[]} reminderTemplate={null} />);

    expect(screen.queryByText(/تم التسليم|تمت القراءة/)).not.toBeInTheDocument();
    expect(screen.getByText(/فتح واتساب لا يعني أن الرسالة أُرسلت أو وصلت/)).toBeInTheDocument();
  });
});
