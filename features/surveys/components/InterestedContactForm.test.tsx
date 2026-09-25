import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InterestedContactForm } from "@/features/surveys/components/InterestedContactForm";

vi.mock("@/app/(public)/surveys/interested-contact/actions", () => ({
  submitInterestedContactAction: vi.fn(),
}));

describe("InterestedContactForm", () => {
  it("keeps consent optional until the visitor explicitly checks it", () => {
    render(<InterestedContactForm />);

    expect(screen.getByRole("textbox", { name: "الاسم" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "رقم الجوال السعودي" })).toBeRequired();
    expect(screen.getByRole("textbox", { name: "البريد الإلكتروني" })).toBeRequired();
    expect(screen.getByRole("checkbox")).toBeRequired();
    expect(screen.getByRole("checkbox")).not.toBeChecked();
    expect(screen.getByRole("button", { name: "سجّلي اهتمامكِ" })).toBeEnabled();
  });
});
