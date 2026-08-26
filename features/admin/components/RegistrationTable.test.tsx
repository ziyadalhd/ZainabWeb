import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import type { Registration } from "@/lib/domain/types";

vi.mock("@/app/(dashboard)/admin/(protected)/registrations/actions", () => ({
  cancelRegistrationAction: vi.fn(),
  cancelWaitlistedRegistrationAction: vi.fn(),
  confirmAttendanceAction: vi.fn(),
  recordCheckInAction: vi.fn(),
  revokeInvitationAction: vi.fn(),
  setRegistrationPaymentStatusAction: vi.fn(),
}));

const registration: Registration = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  reference: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
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
};

describe("RegistrationTable", () => {
  it("shows separate attendance confirmation and operational check-in controls", () => {
    render(<RegistrationTable registrations={[registration]} mode="current" />);

    expect(screen.getByText("بانتظار التأكيد")).toBeInTheDocument();
    expect(screen.getByText("لم يسجل الحضور")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد الحضور" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تسجيل الحضور" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تسجيل الغياب" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح التواصل" })).toHaveAttribute("href", `/admin/events/${registration.eventId}?tab=communications`);
    expect(screen.queryByText("تجهيز تذكير WhatsApp")).not.toBeInTheDocument();
  });

  it("routes previous-registration messaging to the event communication workspace", () => {
    render(<RegistrationTable registrations={[registration]} mode="previous" />);

    expect(screen.getByRole("link", { name: "فتح التواصل" })).toHaveAttribute("href", `/admin/events/${registration.eventId}?tab=communications`);
    expect(screen.queryByRole("button", { name: "إلغاء التسجيل" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "حفظ الدفع" })).not.toBeInTheDocument();
    expect(screen.getByText("غير مدفوع")).toBeInTheDocument();
  });

  describe("without a registrationHref (event workspace usage — admin overhaul plan A1)", () => {
    const secondRegistration: Registration = { ...registration, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", attendeeName: "مشاركة أخرى" };

    it("characterises the known defect: every row beyond the first is rendered as inert, non-interactive markup", () => {
      render(<RegistrationTable registrations={[registration, secondRegistration]} mode="current" />);

      // Only the first registration's details are ever reachable — there is no control that
      // selects the second row. This pins the bug fixed by the admin overhaul plan's Phase 2
      // (deleting this table from the event workspace in favour of a selectable roster).
      expect(screen.getByRole("heading", { name: registration.attendeeName })).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: secondRegistration.attendeeName })).not.toBeInTheDocument();
      expect(screen.getByText(secondRegistration.attendeeName)).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: new RegExp(secondRegistration.attendeeName) })).not.toBeInTheDocument();
    });
  });
});
