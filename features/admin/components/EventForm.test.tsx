import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventForm } from "@/features/admin/components/EventForm";

describe("EventForm", () => {
  it("renders the approved fields and explains draft behavior", () => {
    render(<EventForm action={vi.fn()} submitLabel="حفظ المسودة" />);
    expect(screen.getByRole("textbox", { name: "عنوان الفعالية" })).toBeRequired();
    expect(screen.getByRole("combobox", { name: /مسار الفعالية/ })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "رحلة بَيْن" })).toBeInTheDocument();
    expect(screen.getByLabelText("الفئة")).toBeInTheDocument();
    expect(screen.getByLabelText("نوع الفعالية")).toBeInTheDocument();
    expect(screen.getByText("بداية الفعالية")).toBeInTheDocument();
    expect(screen.getByText("نهاية الفعالية")).toBeInTheDocument();
    expect(screen.getAllByLabelText("اليوم والتاريخ")).toHaveLength(2);
    expect(screen.getAllByLabelText("الساعة")).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /تمام/ })).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: /وربع/ })).toHaveLength(2);
    expect(screen.getByLabelText("السعة")).toHaveAttribute("min", "1");
    expect(screen.getByLabelText("السعة")).toHaveAttribute("max", "50");
    expect(screen.getByLabelText("السعر بالريال السعودي")).toBeRequired();
    expect(screen.getByLabelText("استقبال التسجيلات")).toBeInTheDocument();
    expect(screen.getByText(/الامتلاء يُحسب تلقائيًا/)).toBeInTheDocument();
    expect(screen.getByText("الحفظ لا ينشر الفعالية تلقائيًا.")).toBeInTheDocument();
  });
});
