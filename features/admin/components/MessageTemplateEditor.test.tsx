import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { MessageTemplateEditor } from "@/features/admin/components/MessageTemplateEditor";
import { messageTemplateDefinitions } from "@/lib/messaging/message-templates";

vi.mock("@/app/(dashboard)/admin/(protected)/messages/templates/actions", () => ({
  saveMessageTemplateAction: vi.fn(async () => ({ status: "idle" as const })),
}));

function renderEditor(body: string | null = null) {
  return render(
    <ToastProvider>
      <MessageTemplateEditor kind="confirmation" body={body} />
    </ToastProvider>,
  );
}

describe("MessageTemplateEditor", () => {
  it("starts from the built-in default when nothing is saved", () => {
    renderEditor();
    const textarea = screen.getByLabelText("نص الرسالة") as HTMLTextAreaElement;
    expect(textarea.value).toBe(messageTemplateDefinitions.confirmation.defaultBody);
  });

  it("shows the saved text rather than the default", () => {
    renderEditor("نصي الخاص {{management_url}}");
    expect((screen.getByLabelText("نص الرسالة") as HTMLTextAreaElement).value).toBe("نصي الخاص {{management_url}}");
  });

  it("renders a preview with sample values instead of raw variables", () => {
    renderEditor("يا هلا {{attendee_name}} في {{event_title}} — {{management_url}}");
    const preview = screen.getByText(/يا هلا سارة في أمسية القراءة/);
    expect(preview).toBeInTheDocument();
    expect(preview.textContent).not.toContain("{{");
  });

  it("offers each variable as a button labelled in Arabic, not as braces", () => {
    renderEditor();
    expect(screen.getByRole("button", { name: "اسم المشاركة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "عنوان الفعالية" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "رابط الإدارة" })).toBeInTheDocument();
  });

  it("appends a variable to the text when its button is pressed", () => {
    renderEditor("مرحبا ");
    fireEvent.click(screen.getByRole("button", { name: "اسم المشاركة" }));
    expect((screen.getByLabelText("نص الرسالة") as HTMLTextAreaElement).value).toContain("{{attendee_name}}");
  });

  it("blocks saving and names the missing variable when a required one is removed", () => {
    renderEditor("نص بلا رابط");
    expect(screen.getByRole("alert").textContent).toContain("رابط الإدارة");
    expect(screen.getByRole("button", { name: "حفظ النص" })).toBeDisabled();
  });

  it("keeps save disabled until the text actually changes", () => {
    renderEditor();
    expect(screen.getByRole("button", { name: "حفظ النص" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("نص الرسالة"), { target: { value: "نص جديد {{management_url}}" } });
    expect(screen.getByRole("button", { name: "حفظ النص" })).toBeEnabled();
  });

  it("restores the built-in text on request", () => {
    renderEditor("نص مختصر {{management_url}}");
    fireEvent.click(screen.getByRole("button", { name: "استعادة النص الأصلي" }));
    expect((screen.getByLabelText("نص الرسالة") as HTMLTextAreaElement).value).toBe(
      messageTemplateDefinitions.confirmation.defaultBody,
    );
  });
});
