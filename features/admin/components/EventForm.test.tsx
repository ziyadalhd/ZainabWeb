import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventForm } from "@/features/admin/components/EventForm";
import { ToastProvider } from "@/components/ui/ToastProvider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("EventForm", () => {
  it("offers every audience as a checkbox so one event can serve several", () => {
    render(
      <ToastProvider>
        <EventForm action={vi.fn()} submitLabel="حفظ المسودة" />
      </ToastProvider>,
    );
    const adults = screen.getByRole("checkbox", { name: "للبالغات" });
    const youth = screen.getByRole("checkbox", { name: "للفتيات" });
    expect(screen.getByRole("checkbox", { name: "للأطفال" })).not.toBeChecked();
    expect(adults).toBeChecked();
    expect(youth).not.toBeChecked();

    fireEvent.click(youth);
    expect(adults).toBeChecked();
    expect(youth).toBeChecked();
  });

  it("pre-checks every audience an existing event already serves", () => {
    render(
      <ToastProvider>
        <EventForm
          action={vi.fn()}
          submitLabel="حفظ"
          event={{
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            title: "لقاء",
            kind: "club_event",
            audiences: ["adults", "youth"],
            eventTypeLabel: "أمسية",
            description: null,
            startsAt: "2026-09-01T16:00:00.000Z",
            endsAt: "2026-09-01T18:00:00.000Z",
            capacity: 20,
            activeReservationCount: 0,
            priceHalalas: 0,
            posterUrl: null,
            registrationStatus: "open",
            availability: "available",
            publicationStatus: "draft",
            createdAt: "2026-08-01T00:00:00.000Z",
            updatedAt: "2026-08-01T00:00:00.000Z",
          }}
        />
      </ToastProvider>,
    );
    expect(screen.getByRole("checkbox", { name: "للبالغات" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "للفتيات" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "للأطفال" })).not.toBeChecked();
  });

  it("renders the approved fields and explains draft behavior", () => {
    render(
      <ToastProvider>
        <EventForm action={vi.fn()} submitLabel="حفظ المسودة" />
      </ToastProvider>,
    );
    expect(screen.getByRole("textbox", { name: "عنوان الفعالية" })).toBeRequired();
    expect(screen.getByRole("combobox", { name: /مسار الفعالية/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "رحلة بَيْن" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "الفئة" })).toBeInTheDocument();
    expect(screen.getByLabelText("نوع الفعالية")).toBeInTheDocument();
    expect(screen.getByText("الموعد والمكان")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /اليوم والتاريخ/ })).toBeInTheDocument();
    expect(screen.getByLabelText("تبدأ الساعة — الدقائق")).toBeInTheDocument();
    expect(screen.getByLabelText("تنتهي الساعة — الدقائق")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "تنتهي في يوم مختلف" })).not.toBeChecked();
    expect(screen.getAllByRole("button", { name: /تمام/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /وربع/ })).toHaveLength(2);
    expect(screen.getByLabelText("السعة")).toHaveAttribute("min", "1");
    expect(screen.getByLabelText("السعة")).toHaveAttribute("max", "50");
    expect(screen.getByLabelText("السعر بالريال السعودي")).toBeRequired();
    expect(screen.getByLabelText("استقبال التسجيلات")).toBeInTheDocument();
    expect(screen.getByLabelText(/إضافة بوستر/)).toBeInTheDocument();
    expect(screen.getByText(/الامتلاء يُحسب تلقائيًا/)).toBeInTheDocument();
    expect(screen.getByText("الحفظ لا ينشر الفعالية تلقائيًا.")).toBeInTheDocument();
  });

  it("reports every failing field as a linked error in one summary after a rejected submit", async () => {
    const action = vi.fn(async () => ({ status: "error" as const, errors: ["title", "capacity"] as const }));
    render(
      <ToastProvider>
        <EventForm action={action} submitLabel="حفظ المسودة" />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "حفظ المسودة" }));

    const summary = await screen.findByRole("alert");
    expect(within(summary).getByRole("link", { name: "أدخل عنوانًا للفعالية." })).toHaveAttribute("href", "#event-title");
    expect(within(summary).getByRole("link", { name: /سعة صحيحة/ })).toHaveAttribute("href", "#event-capacity");
  });

  it("updates the live guest preview as the admin types", () => {
    render(
      <ToastProvider>
        <EventForm action={vi.fn()} submitLabel="حفظ المسودة" />
      </ToastProvider>,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "عنوان الفعالية" }), { target: { value: "أمسية تجريبية" } });

    expect(screen.getByText("أمسية تجريبية")).toBeInTheDocument();
  });
});
