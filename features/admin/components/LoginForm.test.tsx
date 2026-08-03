import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LoginForm } from "@/features/admin/components/LoginForm";

vi.mock("@/app/(dashboard)/admin/actions", () => ({ loginAction: vi.fn() }));

describe("LoginForm", () => {
  it("renders only email and password login fields", () => {
    render(<LoginForm />);
    expect(screen.getByRole("textbox", { name: "البريد الإلكتروني" })).toBeInTheDocument();
    expect(screen.getByLabelText("كلمة المرور")).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: "دخول المسؤول" })).toBeInTheDocument();
    expect(screen.queryByText(/إنشاء حساب/)).not.toBeInTheDocument();
  });
});
