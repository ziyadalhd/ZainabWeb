import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DeleteEventButton } from "@/features/admin/components/DeleteEventButton";
import { ToastProvider } from "@/components/ui/ToastProvider";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));

const eventId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

function renderButton(props: Partial<React.ComponentProps<typeof DeleteEventButton>> = {}) {
  const action = props.action ?? vi.fn(async () => ({ status: "success" as const }));
  render(
    <ToastProvider>
      <DeleteEventButton eventId={eventId} eventTitle="لقاء القراءة" attendeeCount={0} {...props} action={action} />
    </ToastProvider>,
  );
  return action;
}

describe("DeleteEventButton", () => {
  beforeEach(() => {
    push.mockClear();
    refresh.mockClear();
  });

  it("never deletes on the first click — it only opens a confirmation dialog", () => {
    const action = renderButton();

    fireEvent.click(screen.getByRole("button", { name: "حذف الفعالية" }));

    expect(action).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("labels the dialog and warns that the deletion is permanent", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "حذف الفعالية" }));

    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAccessibleName("حذف الفعالية");
    expect(dialog).toHaveTextContent("لا يمكن التراجع عن هذا الإجراء");
    expect(dialog).toHaveTextContent("لقاء القراءة");
  });

  it("deletes only after the explicit second confirmation", async () => {
    const action = vi.fn(async () => ({ status: "success" as const }));
    renderButton({ action });

    fireEvent.click(screen.getByRole("button", { name: "حذف الفعالية" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الحذف نهائيًا" }));

    await waitFor(() => expect(action).toHaveBeenCalledWith(eventId, expect.anything(), expect.any(FormData)));
  });

  it("redirects to a URL with no stale ?event= panel state and announces success", async () => {
    renderButton();

    fireEvent.click(screen.getByRole("button", { name: "حذف الفعالية" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الحذف نهائيًا" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/admin/events"));
    expect(push.mock.calls[0]![0]).not.toContain("event=");
    expect(await screen.findByText("تم حذف «لقاء القراءة» نهائيًا.")).toBeInTheDocument();
  });

  it("surfaces the server's error message as a toast", async () => {
    renderButton({ action: vi.fn(async () => ({ status: "error" as const, message: "لا يمكن حذف فعالية لها تسجيلات." })) });

    fireEvent.click(screen.getByRole("button", { name: "حذف الفعالية" }));
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الحذف نهائيًا" }));

    expect(await screen.findByText("لا يمكن حذف فعالية لها تسجيلات.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });

  it("warns about the impact and offers no confirm button when the event has attendees", () => {
    const action = renderButton({ attendeeCount: 12 });

    fireEvent.click(screen.getByRole("button", { name: "حذف الفعالية" }));

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("لا يمكن حذف هذه الفعالية");
    expect(alert).toHaveTextContent("١٢");
    expect(alert).toHaveTextContent("ألغي الفعالية بدلًا من ذلك");
    expect(screen.queryByRole("button", { name: "تأكيد الحذف نهائيًا" })).not.toBeInTheDocument();
    expect(action).not.toHaveBeenCalled();
  });
});
