"use client";

import { useEffect, useState, type FormEvent } from "react";
import { normalizeMfaCode } from "@/lib/auth/mfa";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { MfaDeviceList, type ManagedFactor } from "@/features/admin/components/MfaDeviceList";
import { MfaEnrollmentForm, type Enrollment } from "@/features/admin/components/MfaEnrollmentForm";

async function listVerifiedFactors(): Promise<ManagedFactor[]> {
  const supabase = createSupabaseBrowserClient();
  const result = await supabase.auth.mfa.listFactors();
  if (result.error) throw result.error;

  return result.data.totp.map((factor, index) => ({
    id: factor.id,
    name: factor.friendly_name?.trim() || `تطبيق المصادقة ${index + 1}`,
    createdAt: factor.created_at,
  }));
}

export function MfaManagementPanel() {
  const [factors, setFactors] = useState<ManagedFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deviceName, setDeviceName] = useState("");
  const [enrollment, setEnrollment] = useState<Enrollment>();
  const [code, setCode] = useState("");
  const [confirmingRemovalId, setConfirmingRemovalId] = useState<string>();
  const [busyAction, setBusyAction] = useState<"enroll" | "verify" | "cancel" | "remove">();
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  useEffect(() => {
    let active = true;

    void listVerifiedFactors()
      .then((nextFactors) => {
        if (active) setFactors(nextFactors);
      })
      .catch(() => {
        if (active) setErrorMessage("تعذر تحميل أجهزة التحقق. حدّثي الصفحة وحاولي مرة أخرى.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  async function beginEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busyAction || enrollment) return;

    const friendlyName = deviceName.trim();
    if (friendlyName.length < 2 || friendlyName.length > 80) {
      setErrorMessage("اكتبي اسمًا واضحًا للجهاز من حرفين إلى 80 حرفًا.");
      return;
    }

    setBusyAction("enroll");
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const existing = await supabase.auth.mfa.listFactors();

    if (existing.error) {
      setErrorMessage("تعذر بدء إضافة الجهاز. حدّثي الصفحة وحاولي مرة أخرى.");
      setBusyAction(undefined);
      return;
    }

    const unfinishedFactors = existing.data.all.filter((factor) => factor.factor_type === "totp" && factor.status === "unverified");

    for (const factor of unfinishedFactors) {
      const removal = await supabase.auth.mfa.unenroll({ factorId: factor.id });
      if (removal.error) {
        setErrorMessage("تعذر تنظيف محاولة إعداد سابقة. سجلي الخروج ثم ادخلي مرة أخرى.");
        setBusyAction(undefined);
        return;
      }
    }

    const result = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName,
    });

    if (result.error) {
      setErrorMessage("تعذر إنشاء رمز الجهاز الجديد. حاولي مرة أخرى بعد لحظة.");
      setBusyAction(undefined);
      return;
    }

    setEnrollment({
      factorId: result.data.id,
      name: friendlyName,
      qrCode: result.data.totp.qr_code,
      secret: result.data.totp.secret,
    });
    setBusyAction(undefined);
  }

  async function verifyEnrollment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!enrollment || busyAction) return;

    const normalizedCode = normalizeMfaCode(code);
    if (!/^\d{6}$/.test(normalizedCode)) {
      setErrorMessage("اكتبي الرمز المكوّن من 6 أرقام.");
      return;
    }

    setBusyAction("verify");
    setErrorMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const challenge = await supabase.auth.mfa.challenge({ factorId: enrollment.factorId });

    if (challenge.error) {
      setErrorMessage("تعذر بدء التحقق. انتظري لحظة ثم حاولي مرة أخرى.");
      setBusyAction(undefined);
      return;
    }

    const verification = await supabase.auth.mfa.verify({
      factorId: enrollment.factorId,
      challengeId: challenge.data.id,
      code: normalizedCode,
    });

    if (verification.error) {
      setErrorMessage("الرمز غير صحيح أو انتهت صلاحيته. اكتبي الرمز الحالي من الجهاز الجديد.");
      setBusyAction(undefined);
      return;
    }

    try {
      setFactors(await listVerifiedFactors());
      setEnrollment(undefined);
      setDeviceName("");
      setCode("");
      setSuccessMessage(`تمت إضافة «${enrollment.name}» بنجاح. يمكنك الآن إزالة الجهاز القديم عند الحاجة.`);
    } catch {
      setEnrollment(undefined);
      setErrorMessage("تمت إضافة الجهاز، لكن تعذر تحديث القائمة. حدّثي الصفحة لإظهاره.");
    } finally {
      setBusyAction(undefined);
    }
  }

  async function cancelEnrollment() {
    if (!enrollment || busyAction) return;

    setBusyAction("cancel");
    setErrorMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const removal = await supabase.auth.mfa.unenroll({ factorId: enrollment.factorId });

    if (removal.error) {
      setErrorMessage("تعذر إلغاء الإعداد الآن. حدّثي الصفحة قبل محاولة إضافة جهاز آخر.");
      setBusyAction(undefined);
      return;
    }

    setEnrollment(undefined);
    setDeviceName("");
    setCode("");
    setBusyAction(undefined);
  }

  async function removeFactor(factor: ManagedFactor) {
    if (busyAction) return;
    if (factors.length <= 1) {
      setErrorMessage("لا يمكن إزالة آخر جهاز تحقق. أضيفي جهازًا احتياطيًا أولًا.");
      setConfirmingRemovalId(undefined);
      return;
    }

    setBusyAction("remove");
    setErrorMessage(undefined);
    setSuccessMessage(undefined);
    const supabase = createSupabaseBrowserClient();
    const removal = await supabase.auth.mfa.unenroll({ factorId: factor.id });

    if (removal.error) {
      setErrorMessage("تعذر إزالة الجهاز. أعيدي التحقق من الجلسة ثم حاولي مرة أخرى.");
      setBusyAction(undefined);
      return;
    }

    setConfirmingRemovalId(undefined);
    const refresh = await supabase.auth.refreshSession();
    if (refresh.error) {
      window.location.replace("/admin/mfa");
      return;
    }

    const assurance = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (assurance.error || assurance.data.currentLevel !== "aal2") {
      window.location.replace("/admin/mfa/verify");
      return;
    }

    try {
      setFactors(await listVerifiedFactors());
      setSuccessMessage(`تمت إزالة «${factor.name}».`);
      setBusyAction(undefined);
    } catch {
      window.location.replace("/admin/settings?tab=security");
    }
  }

  return (
    <div className="mt-8 grid max-w-4xl gap-6">
      {errorMessage ? (
        <p role="alert" className="notice-error">
          {errorMessage}
        </p>
      ) : null}
      {successMessage ? (
        <p role="status" className="notice-success">
          {successMessage}
        </p>
      ) : null}

      <MfaDeviceList
        factors={factors}
        isLoading={isLoading}
        confirmingRemovalId={confirmingRemovalId}
        busy={Boolean(busyAction)}
        removing={busyAction === "remove"}
        onRequestRemoval={setConfirmingRemovalId}
        onConfirmRemoval={(factor) => void removeFactor(factor)}
        onCancelRemoval={() => setConfirmingRemovalId(undefined)}
      />

      <MfaEnrollmentForm
        enrollment={enrollment}
        deviceName={deviceName}
        code={code}
        busyAction={busyAction}
        onDeviceNameChange={setDeviceName}
        onCodeChange={setCode}
        onBeginEnrollment={beginEnrollment}
        onVerifyEnrollment={verifyEnrollment}
        onCancelEnrollment={() => void cancelEnrollment()}
      />

      <p className="notice-info">إذا فُقدت جميع الأجهزة، لا يوجد تجاوز من شاشة الدخول. يلزم استرداد يدوي موثوق من مالك مشروع Supabase، ثم تسجيل جهاز جديد.</p>
    </div>
  );
}
