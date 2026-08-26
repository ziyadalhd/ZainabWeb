import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ToastProvider } from "@/components/ui/ToastProvider";

function renderDialog(action: () => Promise<{ status: "success" | "error"; message?: string }>) {
  return render(
    <ToastProvider>
      <ConfirmDialog
        triggerLabel="إلغاء التسجيل"
        title="إلغاء التسجيل"
        description="هل تريدين إلغاء هذا التسجيل؟"
        action={action}
        successMessage="تم الإلغاء."
      />
    </ToastProvider>,
  );
}

describe("ConfirmDialog", () => {
  it("keeps the confirmation hidden until the trigger is activated", () => {
    renderDialog(vi.fn(async () => ({ status: "success" as const })));
    expect(screen.queryByRole("button", { name: "تأكيد" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "إلغاء التسجيل" }));
    expect(screen.getByRole("button", { name: "تأكيد" })).toBeInTheDocument();
    expect(screen.getByText("هل تريدين إلغاء هذا التسجيل؟")).toBeInTheDocument();
  });

  it("calls the action and shows a success toast on confirm", async () => {
    const action = vi.fn(async () => ({ status: "success" as const }));
    renderDialog(action);

    fireEvent.click(screen.getByRole("button", { name: "إلغاء التسجيل" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد" }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("تم الإلغاء."));
  });

  it("shows an error toast and keeps the dialog reachable when the action fails", async () => {
    const action = vi.fn(async () => ({ status: "error" as const, message: "تعذر الإلغاء." }));
    renderDialog(action);

    fireEvent.click(screen.getByRole("button", { name: "إلغاء التسجيل" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("تعذر الإلغاء."));
  });
});
