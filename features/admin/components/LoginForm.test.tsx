import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/admin/components/LoginForm";

vi.mock("@/app/(dashboard)/admin/actions", () => ({ loginAction: vi.fn() }));
const resetPasswordForEmail = vi.fn();
vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({ auth: { resetPasswordForEmail } }),
}));

describe("LoginForm", () => {
  it("renders administrator login and recovery controls without public signup", () => {
    render(<LoginForm />);
    expect(screen.getByRole("textbox", { name: "البريد الإلكتروني" })).toBeInTheDocument();
    expect(screen.getByLabelText("كلمة المرور")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "دخول المسؤول" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إرسال رابط تغيير كلمة المرور" })).toBeInTheDocument();
    expect(screen.queryByText(/إنشاء حساب/)).not.toBeInTheDocument();
  });

  it("sends recovery only after an email is entered", async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.click(screen.getByRole("button", { name: "إرسال رابط تغيير كلمة المرور" }));
    expect(screen.getByText("اكتبي البريد الإلكتروني أولًا.")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: "البريد الإلكتروني" }), { target: { value: "admin@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "إرسال رابط تغيير كلمة المرور" }));
    expect(await screen.findByText(/إذا كان البريد تابعًا لحساب مسؤول/)).toBeInTheDocument();
    expect(resetPasswordForEmail).toHaveBeenCalledWith("admin@example.test", expect.objectContaining({ redirectTo: expect.stringContaining("/admin/reset-password") }));
  });
});
