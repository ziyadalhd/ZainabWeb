import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MfaSetupForm } from "@/features/admin/components/MfaSetupForm";
import { MfaVerifyForm } from "@/features/admin/components/MfaVerifyForm";

const listFactors = vi.fn();
const challenge = vi.fn();
const verify = vi.fn();
const enroll = vi.fn();
const unenroll = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      mfa: {
        listFactors,
        challenge,
        verify,
        enroll,
        unenroll,
      },
    },
  }),
}));

describe("MfaVerifyForm", () => {
  let replaceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    listFactors.mockResolvedValue({
      data: {
        all: [{ id: "factor-1", factor_type: "totp", status: "verified", friendly_name: "جوالي" }],
        totp: [{ id: "factor-1", factor_type: "totp", status: "verified", friendly_name: "جوالي" }],
      },
      error: null,
    });
    replaceMock = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      replace: replaceMock,
    } as unknown as Location);
  });

  it("renders 6-digit input and verification button", () => {
    render(<MfaVerifyForm />);
    expect(screen.getByRole("textbox", { name: "الرمز من تطبيق المصادقة" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "التحقق والدخول" })).toBeInTheDocument();
  });

  it("validates 6-digit length before creating a challenge", async () => {
    render(<MfaVerifyForm />);
    await waitFor(() => expect(screen.getByRole("button", { name: "التحقق والدخول" })).toBeEnabled());
    fireEvent.change(screen.getByRole("textbox", { name: "الرمز من تطبيق المصادقة" }), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التحقق والدخول" }));

    expect(await screen.findByText("اكتبي الرمز المكوّن من 6 أرقام.")).toBeInTheDocument();
    expect(challenge).not.toHaveBeenCalled();
  });

  it("verifies TOTP code and redirects to /admin on success", async () => {
    listFactors.mockResolvedValue({
      data: {
        all: [{ id: "factor-1", factor_type: "totp", status: "verified" }],
        totp: [{ id: "factor-1", factor_type: "totp", status: "verified" }],
      },
      error: null,
    });
    challenge.mockResolvedValue({
      data: { id: "challenge-1" },
      error: null,
    });
    verify.mockResolvedValue({
      data: { access_token: "token-aal2" },
      error: null,
    });

    render(<MfaVerifyForm />);
    await waitFor(() => expect(screen.getByRole("button", { name: "التحقق والدخول" })).toBeEnabled());
    fireEvent.change(screen.getByRole("textbox", { name: "الرمز من تطبيق المصادقة" }), {
      target: { value: "١٢٣٤٥٦" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التحقق والدخول" }));

    await waitFor(() => {
      expect(challenge).toHaveBeenCalledWith({ factorId: "factor-1" });
      expect(verify).toHaveBeenCalledWith({
        factorId: "factor-1",
        challengeId: "challenge-1",
        code: "123456",
      });
      expect(replaceMock).toHaveBeenCalledWith("/admin");
    });
  });

  it("displays error message when verification code is incorrect", async () => {
    listFactors.mockResolvedValue({
      data: {
        all: [{ id: "factor-1", factor_type: "totp", status: "verified" }],
        totp: [{ id: "factor-1", factor_type: "totp", status: "verified" }],
      },
      error: null,
    });
    challenge.mockResolvedValue({
      data: { id: "challenge-1" },
      error: null,
    });
    verify.mockResolvedValue({
      data: null,
      error: { message: "Invalid code" },
    });

    render(<MfaVerifyForm />);
    await waitFor(() => expect(screen.getByRole("button", { name: "التحقق والدخول" })).toBeEnabled());
    fireEvent.change(screen.getByRole("textbox", { name: "الرمز من تطبيق المصادقة" }), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التحقق والدخول" }));

    expect(
      await screen.findByText("الرمز غير صحيح أو انتهت صلاحيته. اكتبي الرمز الحالي من التطبيق."),
    ).toBeInTheDocument();
    expect(replaceMock).not.toHaveBeenCalled();
  });

  it("allows choosing between multiple verified devices", async () => {
    listFactors.mockResolvedValue({
      data: {
        all: [
          { id: "primary", factor_type: "totp", status: "verified", friendly_name: "الجوال الأساسي" },
          { id: "backup", factor_type: "totp", status: "verified", friendly_name: "الجهاز الاحتياطي" },
        ],
        totp: [
          { id: "primary", factor_type: "totp", status: "verified", friendly_name: "الجوال الأساسي" },
          { id: "backup", factor_type: "totp", status: "verified", friendly_name: "الجهاز الاحتياطي" },
        ],
      },
      error: null,
    });
    challenge.mockResolvedValue({ data: { id: "challenge-backup" }, error: null });
    verify.mockResolvedValue({ data: { access_token: "token-aal2" }, error: null });

    render(<MfaVerifyForm />);
    const backup = await screen.findByRole("radio", { name: "الجهاز الاحتياطي" });
    fireEvent.click(backup);
    fireEvent.change(screen.getByRole("textbox", { name: "الرمز من تطبيق المصادقة" }), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: "التحقق والدخول" }));

    await waitFor(() => {
      expect(challenge).toHaveBeenCalledWith({ factorId: "backup" });
      expect(verify).toHaveBeenCalledWith({
        factorId: "backup",
        challengeId: "challenge-backup",
        code: "123456",
      });
    });
  });
});

describe("MfaSetupForm", () => {
  let replaceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      replace: replaceMock,
    } as unknown as Location);
  });

  it("cleans up unverified factors and enrolls new factor", async () => {
    listFactors.mockResolvedValue({
      data: {
        all: [{ id: "old-unverified", factor_type: "totp", status: "unverified" }],
        totp: [{ id: "old-unverified", factor_type: "totp", status: "unverified" }],
      },
      error: null,
    });
    unenroll.mockResolvedValue({ error: null });
    enroll.mockResolvedValue({
      data: {
        id: "new-factor",
        totp: {
          qr_code: "data:image/svg+xml;base64,mock-qr",
          secret: "TESTSECRETKEY123",
        },
      },
      error: null,
    });

    render(<MfaSetupForm />);

    await waitFor(() => {
      expect(unenroll).toHaveBeenCalledWith({ factorId: "old-unverified" });
      expect(enroll).toHaveBeenCalled();
    });

    expect(await screen.findByText("TESTSECRETKEY123")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تفعيل التحقق بخطوتين" })).toBeInTheDocument();
  });

  it("redirects to /admin/mfa/verify if a verified factor is already present", async () => {
    listFactors.mockResolvedValue({
      data: {
        all: [{ id: "verified-factor", factor_type: "totp", status: "verified" }],
        totp: [{ id: "verified-factor", factor_type: "totp", status: "verified" }],
      },
      error: null,
    });

    render(<MfaSetupForm />);

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/mfa/verify");
    });
    expect(enroll).not.toHaveBeenCalled();
  });
});
