import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminMfaDestination } from "@/lib/auth/mfa";
import { requireAdminFirstFactor } from "@/lib/auth/require-admin";

export const metadata: Metadata = {
  title: "التحقق من الدخول",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VerifyPage() {
  const session = await requireAdminFirstFactor();
  const destination = getAdminMfaDestination(session.currentLevel, session.nextLevel);
  redirect(destination);
}
