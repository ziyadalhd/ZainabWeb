import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmActionForm } from "@/features/admin/components/ConfirmActionForm";

describe("ConfirmActionForm", () => {
  it("requires an explicit confirmation before showing the submit action", () => {
    render(<ConfirmActionForm action={vi.fn()} label="إلغاء التسجيل" confirmation="هل تريدين إلغاء التسجيل؟" />);

    expect(screen.queryByRole("button", { name: "تأكيد" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إلغاء التسجيل" }));
    expect(screen.getByText("هل تريدين إلغاء التسجيل؟")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تراجع" }));
    expect(screen.getByRole("button", { name: "إلغاء التسجيل" })).toBeInTheDocument();
  });
});
