import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventForm } from "@/features/admin/components/EventForm";
import { ToastProvider } from "@/components/ui/ToastProvider";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

describe("EventForm", () => {
  it("renders the approved fields and explains draft behavior", () => {
    render(
      <ToastProvider>
        <EventForm action={vi.fn()} submitLabel="حفظ المسودة" />
      </ToastProvider>,
    );
    expect(screen.getByRole("textbox", { name: "عنوان الفعالية" })).toBeRequired();
    expect(screen.getByRole("combobox", { name: /مسار الفعالية/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "رحلة بَيْن" })).toBeInTheDocument();
    expect(screen.getByLabelText("الفئة")).toBeInTheDocument();
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
