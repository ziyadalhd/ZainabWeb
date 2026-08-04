import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventForm } from "@/features/admin/components/EventForm";

describe("EventForm", () => {
  it("renders the approved fields and explains draft behavior", () => {
    render(<EventForm action={vi.fn()} submitLabel="حفظ المسودة" />);
    expect(screen.getByRole("textbox", { name: "عنوان الفعالية" })).toBeRequired();
    expect(screen.getByLabelText("الفئة")).toBeInTheDocument();
    expect(screen.getByLabelText("نوع الفعالية")).toBeInTheDocument();
    expect(screen.getByLabelText("التاريخ والوقت بتوقيت الرياض")).toHaveAttribute("type", "datetime-local");
    expect(screen.getByLabelText("السعة")).toHaveAttribute("min", "1");
    expect(screen.getByLabelText(/حالة التوفر/)).toBeInTheDocument();
    expect(screen.getByText("الحفظ لا ينشر الفعالية تلقائيًا.")).toBeInTheDocument();
  });
});
