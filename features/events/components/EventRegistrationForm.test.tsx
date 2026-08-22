import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EventRegistrationForm } from "@/features/events/components/EventRegistrationForm";

describe("EventRegistrationForm", () => {
  it("renders the approved adult fields and retention notice", () => {
    render(<EventRegistrationForm action={vi.fn()} audience="adults" availability="available" />);
    expect(screen.getByRole("textbox", { name: "الاسم كاملًا" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "رقم الجوال" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: /البريد الإلكتروني/ })).not.toBeRequired();
    expect(screen.queryByLabelText("عمر المشاركة")).not.toBeInTheDocument();
    expect(screen.getByText(/تُحذف تلقائيًا بعد 90 يومًا/)).toBeInTheDocument();
  });

  it("renders the approved guardian fields for children", () => {
    render(<EventRegistrationForm action={vi.fn()} audience="children" availability="available" />);
    expect(screen.getByRole("textbox", { name: "اسم المشاركة كاملًا" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "جوال ولية الأمر" })).toBeRequired();
    expect(screen.getByLabelText("عمر المشاركة")).toHaveAttribute("min", "6");
    expect(screen.getByRole("textbox", { name: "اسم ولية الأمر كاملًا" })).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeRequired();
  });

  it("uses the youth age boundary and explains derived waitlist behavior", () => {
    render(<EventRegistrationForm action={vi.fn()} audience="youth" availability="full" />);
    expect(screen.getByLabelText("عمر المشاركة")).toHaveAttribute("min", "13");
    expect(screen.getByLabelText("عمر المشاركة")).toHaveAttribute("max", "17");
    expect(screen.getByRole("heading", { name: "قائمة الانتظار" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "جارٍ تجهيز التسجيل…" })).toBeDisabled();
  });

});
