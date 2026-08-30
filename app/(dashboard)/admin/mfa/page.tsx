import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAdminMfaDestination } from "@/lib/auth/mfa";
import { requireAdminFirstFactor } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "التحقق بخطوتين" };
export const dynamic = "force-dynamic";

export default async function AdminMfaIndexPage() {
  const session = await requireAdminFirstFactor();
  const destination = getAdminMfaDestination(session.currentLevel, session.nextLevel);
  redirect(destination);
}
