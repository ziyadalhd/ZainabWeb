import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionButton } from "@/components/ui/ActionButton";
import { ToastProvider } from "@/components/ui/ToastProvider";

describe("ActionButton", () => {
  it("submits the action and shows a success toast, without any confirmation step", async () => {
    const action = vi.fn(async () => ({ status: "success" as const }));
    render(
      <ToastProvider>
        <ActionButton action={action} label="تأكيد الحضور" successMessage="تم تأكيد الحضور." />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "تأكيد الحضور" }));

    await waitFor(() => expect(action).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("status")).toHaveTextContent("تم تأكيد الحضور."));
  });

  it("shows an error toast when the action fails", async () => {
    const action = vi.fn(async () => ({ status: "error" as const, message: "تعذر الحفظ." }));
    render(
      <ToastProvider>
        <ActionButton action={action} label="تسجيل الحضور" successMessage="تم." />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "تسجيل الحضور" }));

    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("تعذر الحفظ."));
  });
});
