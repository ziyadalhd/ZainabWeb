import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventCommunicationsWorkspace } from "@/features/admin/components/EventCommunicationsWorkspace";
import type { Event, Registration } from "@/lib/domain/types";

const actions = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@/app/(dashboard)/admin/(protected)/events/[id]/message-actions", () => ({
  sendManualWhatsAppMessageAction: actions.send,
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
    actions.send.mockReset();
  });

  it("opens واتساب and records the send in a single click", async () => {
    actions.send.mockResolvedValue({
      messageId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      kind: "confirmation",
      securePath: "/bookings/secure-person-token",
      sentAt: "2099-08-02T13:00:00.000Z",
    });
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

    render(<EventCommunicationsWorkspace event={event} registrations={[registration]} messages={[]} reminderTemplate={null} now="2099-08-01T12:00:00.000Z" />);

    fireEvent.click(screen.getByRole("button", { name: "فتح في واتساب" }));

    // The waiting tab is pointed at the composed URL only after the action resolves, so this waits
    // on the href itself. Waiting merely for the action to have been *called* resolves a microtask
    // too early and makes the assertion race the assignment.
    await waitFor(() => expect(popup.location.href).toContain("https://wa.me/966500000001"));
    expect(actions.send).toHaveBeenCalledWith(event.id, registration.id, "confirmation");
    expect(popup.location.href).toContain("secure-person-token");
    // No second confirmation step: the row is already recorded as sent, and the only button left
    // is the re-open escape hatch.
    await waitFor(() => expect(screen.getAllByText("سُجّل الإرسال", { selector: ".message-state" })).toHaveLength(2));
    expect(screen.queryByRole("button", { name: "تم الإرسال" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إعادة الفتح في واتساب" })).toBeInTheDocument();
  });

  it("keeps واتساب open with the right message when only the bookkeeping fails", async () => {
    actions.send.mockResolvedValue({
      messageId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      kind: "confirmation",
      securePath: "/bookings/secure-person-token",
      error: "save",
    });
    const popup = {
      close: vi.fn(),
      document: { body: { textContent: "" }, documentElement: { dir: "", lang: "" }, title: "" },
      location: { href: "" },
    };
    vi.spyOn(window, "open").mockReturnValue(popup as unknown as Window);

    render(<EventCommunicationsWorkspace event={event} registrations={[registration]} messages={[]} reminderTemplate={null} now="2099-08-01T12:00:00.000Z" />);
    fireEvent.click(screen.getByRole("button", { name: "فتح في واتساب" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("تعذر تسجيلها كمرسلة");
    expect(popup.location.href).toContain("https://wa.me/966500000001");
    expect(popup.close).not.toHaveBeenCalled();
  });

  it("does not claim delivery or reading anywhere in the workflow", () => {
    render(<EventCommunicationsWorkspace event={event} registrations={[registration]} messages={[]} reminderTemplate={null} now="2099-08-01T12:00:00.000Z" />);

    expect(screen.queryByText(/تم التسليم|تمت القراءة/)).not.toBeInTheDocument();
    expect(screen.getByText(/التسجيل لا يعني أن الرسالة وصلت/)).toBeInTheDocument();
  });
});
