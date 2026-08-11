import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistrationTable } from "@/features/admin/components/RegistrationTable";
import type { Registration } from "@/lib/domain/types";

vi.mock("@/app/(dashboard)/admin/(protected)/registrations/actions", () => ({
  cancelRegistrationAction: vi.fn(),
  cancelWaitlistedRegistrationAction: vi.fn(),
  confirmAttendanceAction: vi.fn(),
  inviteRegistrationAction: vi.fn(),
  markRegistrationReminderSentAction: vi.fn(),
  prepareRegistrationReminderAction: vi.fn(),
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
    expect(screen.getByRole("button", { name: "تجهيز تذكير WhatsApp" })).toBeInTheDocument();
  });
});
