import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function EventWorkspaceRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  redirect(`/admin/events?event=${id}`);
}
