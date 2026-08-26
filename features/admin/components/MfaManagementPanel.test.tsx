import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MfaManagementPanel } from "@/features/admin/components/MfaManagementPanel";

const listFactors = vi.fn();
const challenge = vi.fn();
const verify = vi.fn();
const enroll = vi.fn();
const unenroll = vi.fn();
const refreshSession = vi.fn();
const getAuthenticatorAssuranceLevel = vi.fn();

vi.mock("@/lib/supabase/browser", () => ({
  createSupabaseBrowserClient: () => ({
    auth: {
      refreshSession,
      mfa: {
        listFactors,
        challenge,
        verify,
        enroll,
        unenroll,
        getAuthenticatorAssuranceLevel,
      },
    },
  }),
}));

const primaryFactor = {
  id: "primary",
  factor_type: "totp",
  status: "verified",
  friendly_name: "الجوال الأساسي",
  created_at: "2026-08-20T12:00:00Z",
};

const backupFactor = {
  id: "backup",
  factor_type: "totp",
  status: "verified",
  friendly_name: "الجهاز الاحتياطي",
  created_at: "2026-08-21T12:00:00Z",
};

function factorResponse(factors = [primaryFactor]) {
  return { data: { all: factors, totp: factors }, error: null };
}

describe("MfaManagementPanel", () => {
  let replaceMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    replaceMock = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      replace: replaceMock,
    } as unknown as Location);
    listFactors.mockResolvedValue(factorResponse());
    unenroll.mockResolvedValue({ data: {}, error: null });
    refreshSession.mockResolvedValue({ data: {}, error: null });
    getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal2", nextLevel: "aal2" },
      error: null,
    });
  });

  it("shows the verified device and prevents removing the final factor", async () => {
    render(<MfaManagementPanel />);

    expect(await screen.findByText("الجوال الأساسي")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "إزالة الجهاز" })).toBeDisabled();
    expect(screen.getByText("هذا هو جهاز التحقق الوحيد. أضيفي جهازًا جديدًا وفعّليه قبل إزالة هذا الجهاز.")).toBeInTheDocument();
    expect(unenroll).not.toHaveBeenCalled();
  });

  it("enrolls and verifies a named backup device", async () => {
    enroll.mockResolvedValue({
      data: {
        id: "backup",
        totp: { qr_code: "data:image/svg+xml;base64,mock-qr", secret: "BACKUPSECRET" },
      },
      error: null,
    });
    challenge.mockResolvedValue({ data: { id: "challenge-backup" }, error: null });
    verify.mockResolvedValue({ data: { access_token: "aal2-token" }, error: null });
    listFactors
      .mockResolvedValueOnce(factorResponse())
      .mockResolvedValueOnce(factorResponse())
      .mockResolvedValueOnce(factorResponse([primaryFactor, backupFactor]));

    render(<MfaManagementPanel />);
    await screen.findByText("الجوال الأساسي");
    fireEvent.change(screen.getByRole("textbox", { name: "اسم الجهاز" }), {
      target: { value: "الجهاز الاحتياطي" },
    });
    fireEvent.click(screen.getByRole("button", { name: "متابعة إضافة الجهاز" }));

    expect(await screen.findByText("BACKUPSECRET")).toBeInTheDocument();
    expect(enroll).toHaveBeenCalledWith({ factorType: "totp", friendlyName: "الجهاز الاحتياطي" });

    fireEvent.change(screen.getByRole("textbox", { name: "رمز الجهاز الجديد" }), {
      target: { value: "١٢٣٤٥٦" },
    });
    fireEvent.click(screen.getByRole("button", { name: "تفعيل الجهاز الجديد" }));

    await waitFor(() => {
      expect(verify).toHaveBeenCalledWith({
        factorId: "backup",
        challengeId: "challenge-backup",
        code: "123456",
      });
    });
    expect(await screen.findByText("تمت إضافة «الجهاز الاحتياطي» بنجاح. يمكنك الآن إزالة الجهاز القديم عند الحاجة.")).toBeInTheDocument();
  });

  it("removes a selected device only when another verified device remains", async () => {
    listFactors.mockResolvedValueOnce(factorResponse([primaryFactor, backupFactor])).mockResolvedValueOnce(factorResponse([backupFactor]));

    render(<MfaManagementPanel />);
    await screen.findByText("الجهاز الاحتياطي");
    const removeButtons = screen.getAllByRole("button", { name: "إزالة الجهاز" });
    fireEvent.click(removeButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الإزالة" }));

    await waitFor(() => {
      expect(unenroll).toHaveBeenCalledWith({ factorId: "primary" });
      expect(refreshSession).toHaveBeenCalled();
      expect(getAuthenticatorAssuranceLevel).toHaveBeenCalled();
    });
    expect(await screen.findByText("تمت إزالة «الجوال الأساسي».")).toBeInTheDocument();
  });

  it("requires another MFA challenge if removing a factor downgrades the session", async () => {
    listFactors.mockResolvedValue(factorResponse([primaryFactor, backupFactor]));
    getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });

    render(<MfaManagementPanel />);
    await screen.findByText("الجهاز الاحتياطي");
    fireEvent.click(screen.getAllByRole("button", { name: "إزالة الجهاز" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الإزالة" }));

    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith("/admin/mfa/verify");
    });
  });
});
