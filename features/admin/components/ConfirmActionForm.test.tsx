import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmActionForm } from "@/features/admin/components/ConfirmActionForm";
import { ToastProvider } from "@/components/ui/ToastProvider";

describe("ConfirmActionForm", () => {
  it("requires an explicit confirmation before showing the submit action", () => {
    render(
      <ToastProvider>
        <ConfirmActionForm action={vi.fn()} label="إلغاء التسجيل" confirmation="هل تريدين إلغاء التسجيل؟" successMessage="تم الإلغاء." />
      </ToastProvider>,
    );

    expect(screen.queryByRole("button", { name: "تأكيد" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "إلغاء التسجيل" }));
    expect(screen.getByText("هل تريدين إلغاء التسجيل؟")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأكيد" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "تراجع" }));
    expect(screen.getByRole("button", { name: "إلغاء التسجيل" })).toBeInTheDocument();
  });

  it("shows a success toast and calls onSuccess after a successful confirmation", async () => {
    const action = vi.fn(async () => ({ status: "success" as const }));
    const onSuccess = vi.fn();
    render(
      <ToastProvider>
        <ConfirmActionForm action={action} label="أرشفة الفعالية" confirmation="هل تريدين الأرشفة؟" successMessage="تم الأرشفة." onSuccess={onSuccess} />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "أرشفة الفعالية" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد" }));

    expect(await screen.findByText("تم الأرشفة.")).toBeInTheDocument();
    expect(onSuccess).toHaveBeenCalled();
  });
});
