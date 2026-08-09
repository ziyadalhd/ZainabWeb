import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventForm } from "@/features/admin/components/EventForm";

describe("EventForm", () => {
  it("renders the approved fields and explains draft behavior", () => {
    render(<EventForm action={vi.fn()} submitLabel="حفظ المسودة" />);
    expect(screen.getByRole("textbox", { name: "عنوان الفعالية" })).toBeRequired();
    expect(screen.getByLabelText("الفئة")).toBeInTheDocument();
    expect(screen.getByLabelText("نوع الفعالية")).toBeInTheDocument();
    expect(screen.getByLabelText("تاريخ البداية")).toHaveAttribute("type", "date");
    expect(screen.getByLabelText("وقت البداية")).toHaveAttribute("type", "time");
    expect(screen.getByLabelText("تاريخ النهاية")).toBeRequired();
    expect(screen.getByLabelText("وقت النهاية")).toBeRequired();
    expect(screen.getByLabelText("السعة")).toHaveAttribute("min", "1");
    expect(screen.getByLabelText("السعة")).toHaveAttribute("max", "50");
    expect(screen.getByLabelText("السعر بالريال السعودي")).toBeRequired();
    expect(screen.getByLabelText("استقبال التسجيلات")).toBeInTheDocument();
    expect(screen.getByText(/الامتلاء يُحسب تلقائيًا/)).toBeInTheDocument();
    expect(screen.getByText("الحفظ لا ينشر الفعالية تلقائيًا.")).toBeInTheDocument();
  });
});
