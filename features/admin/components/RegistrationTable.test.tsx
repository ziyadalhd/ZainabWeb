import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RegistrationTable, type RegistrationTableActions } from "@/features/admin/components/RegistrationTable";
import type { Registration } from "@/lib/domain/types";

const actions: RegistrationTableActions = {
  cancelRegistration: vi.fn(),
  cancelWaitlistedRegistration: vi.fn(),
  confirmAttendance: vi.fn(),
  recordCheckIn: vi.fn(),
  revokeInvitation: vi.fn(),
  setPaymentStatus: vi.fn(),
};

function href(registration: Registration): string {
  return `/admin/registrations?id=${registration.id}`;
}

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
    render(<RegistrationTable registrations={[registration]} mode="current" registrationHref={href} actions={actions} />);

    expect(screen.getByText("بانتظار التأكيد")).toBeInTheDocument();
    expect(screen.getByText("لم يسجل الحضور")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد الحضور" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تسجيل الحضور" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تسجيل الغياب" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح التواصل" })).toHaveAttribute("href", `/admin/events/${registration.eventId}?tab=communications`);
    expect(screen.queryByText("تجهيز تذكير WhatsApp")).not.toBeInTheDocument();
  });

  it("routes previous-registration messaging to the event communication workspace", () => {
    render(<RegistrationTable registrations={[registration]} mode="previous" registrationHref={href} actions={actions} />);

    expect(screen.getByRole("link", { name: "فتح التواصل" })).toHaveAttribute("href", `/admin/events/${registration.eventId}?tab=communications`);
    expect(screen.queryByRole("button", { name: "إلغاء التسجيل" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "حفظ الدفع" })).not.toBeInTheDocument();
    expect(screen.getByText("غير مدفوع")).toBeInTheDocument();
  });

  it("makes every row selectable via registrationHref — regression test for admin overhaul plan A1", () => {
    const secondRegistration: Registration = { ...registration, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", attendeeName: "مشاركة أخرى" };
    render(<RegistrationTable registrations={[registration, secondRegistration]} mode="current" registrationHref={href} actions={actions} />);

    const rosterHrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href")).filter((value) => value?.startsWith("/admin/registrations?id="));
    expect(rosterHrefs).toEqual([href(registration), href(secondRegistration)]);
  });
});
