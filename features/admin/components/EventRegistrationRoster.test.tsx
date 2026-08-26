import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventRegistrationRoster } from "@/features/admin/components/EventRegistrationRoster";
import type { Registration } from "@/lib/domain/types";

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

describe("EventRegistrationRoster", () => {
  it("shows the empty state when there are no registrations", () => {
    render(<EventRegistrationRoster registrations={[]} eventId="cccccccc-cccc-4ccc-8ccc-cccccccccccc" view="upcoming" emptyTitle="لا توجد تسجيلات بعد" emptyDescription="ستظهر الأسماء هنا." />);
    expect(screen.getByRole("heading", { name: "لا توجد تسجيلات بعد" })).toBeInTheDocument();
  });

  it("lists every registration with a working link into the shared registrations workspace", () => {
    render(<EventRegistrationRoster registrations={[registration]} eventId={registration.eventId} view="upcoming" emptyTitle="—" emptyDescription="—" />);

    expect(screen.getByText(registration.attendeeName)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "فتح" })).toHaveAttribute("href", `/admin/registrations?event=${registration.eventId}&view=upcoming&id=${registration.id}`);
    expect(screen.getByRole("link", { name: "إدارة كل التسجيلات لهذه الفعالية" })).toHaveAttribute("href", `/admin/registrations?event=${registration.eventId}&view=upcoming`);
  });
});
