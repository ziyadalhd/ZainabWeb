import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export const metadata: Metadata = { title: "التواصل" };
export const dynamic = "force-dynamic";

export default async function MessagesCompatibilityPage() {
  await requireAdmin();
  redirect("/admin/events?notice=communications");
}
