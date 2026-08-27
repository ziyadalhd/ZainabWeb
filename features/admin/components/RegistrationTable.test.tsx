import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RegistrationTable, type RegistrationTableActions } from "@/features/admin/components/RegistrationTable";
import { ToastProvider } from "@/components/ui/ToastProvider";
import type { Registration } from "@/lib/domain/types";

const refresh = vi.fn();
// Only `refresh` is exposed: if code under test called router.push/replace instead of
// refreshing in place, the call would throw and fail the test.
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));

function renderTable(props: React.ComponentProps<typeof RegistrationTable>) {
  return render(
    <ToastProvider>
      <RegistrationTable {...props} />
    </ToastProvider>,
  );
}

const actions: RegistrationTableActions = {
  cancelRegistration: vi.fn(async () => ({ status: "success" as const })),
  confirmAttendance: vi.fn(async () => ({ status: "success" as const })),
  recordCheckIn: vi.fn(async () => ({ status: "success" as const })),
  revokeInvitation: vi.fn(async () => ({ status: "success" as const })),
  setPaymentStatus: vi.fn(async () => ({ saved: true as const })),
};

function href(registration: Registration): string {
  return `/admin/registrations?id=${registration.id}`;
}

function hrefsFor(registrations: readonly Registration[]): Record<string, string> {
  return Object.fromEntries(registrations.map((registration) => [registration.id, href(registration)]));
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
  beforeEach(() => {
    refresh.mockClear();
  });

  it("cancels a registration in place — refreshes the current page rather than navigating elsewhere (admin ux redesign plan phase B)", async () => {
    renderTable({ registrations: [registration], mode: "current", registrationHrefs: hrefsFor([registration]), actions });

    fireEvent.click(screen.getByRole("button", { name: "إلغاء التسجيل" }));
    // The dialog's own confirm button shares the trigger's label ("إلغاء التسجيل"); it's the second match.
    fireEvent.click(screen.getAllByRole("button", { name: "إلغاء التسجيل" })[1]!);

    await waitFor(() => expect(actions.cancelRegistration).toHaveBeenCalledWith(registration.id, expect.anything(), expect.anything()));
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("تم إلغاء التسجيل"));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows separate attendance confirmation and operational check-in controls, with no hidden action menu (A11)", () => {
    renderTable({ registrations: [registration], mode: "current", registrationHrefs: hrefsFor([registration]), actions });

    expect(screen.getByText("بانتظار التأكيد")).toBeInTheDocument();
    expect(screen.getByText("لم يسجل الحضور")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد الحضور" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تسجيل الحضور" })).toBeInTheDocument();
    // Cancel and mark-absent are confirm-dialog triggers; the dialog's own confirm button
    // shares the label but stays inaccessible (native dialog: not([open]) { display: none })
    // until the dialog opens, so only the trigger is queryable here.
    expect(screen.getByRole("button", { name: "تسجيل الغياب" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إلغاء التسجيل" })).toBeInTheDocument();
    expect(screen.queryByText("إجراءات إضافية")).not.toBeInTheDocument();
  });

  it("shows previous-registration payment status without offering cancellation or payment actions", () => {
    renderTable({ registrations: [registration], mode: "previous", registrationHrefs: hrefsFor([registration]), actions });

    expect(screen.queryByRole("button", { name: "إلغاء التسجيل" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "حفظ الدفع" })).not.toBeInTheDocument();
    expect(screen.getByText("غير مدفوع")).toBeInTheDocument();
  });

  it("makes every row selectable via registrationHref — regression test for admin overhaul plan A1", () => {
    const secondRegistration: Registration = { ...registration, id: "dddddddd-dddd-4ddd-8ddd-dddddddddddd", attendeeName: "مشاركة أخرى" };
    renderTable({ registrations: [registration, secondRegistration], mode: "current", registrationHrefs: hrefsFor([registration, secondRegistration]), actions });

    const rosterHrefs = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((value) => value?.startsWith("/admin/registrations?id="));
    expect(rosterHrefs).toEqual([href(registration), href(secondRegistration)]);
  });
});
