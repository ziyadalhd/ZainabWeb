import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminRegistrationRepository } from "@/lib/supabase/registrations";

export const dynamic = "force-dynamic";

/**
 * The dashboard-wide heartbeat: held seats across every event, plus who registered most recently
 * and for what.
 *
 * Polled by the global listener in the protected admin layout, so a registration announces itself
 * on whichever admin screen happens to be open. Admin-guarded like every other admin read, and
 * deliberately narrow — one name and one event title, never a phone, email, or guardian record.
 */
export async function GET() {
  await requireAdmin();

  const repository = await createAdminRegistrationRepository();
  const outcome = await repository.pulseLatest();
  if (!outcome.ok) return NextResponse.json({ error: "unavailable" }, { status: 503 });

  return NextResponse.json(outcome.data, { headers: { "cache-control": "no-store" } });
}
